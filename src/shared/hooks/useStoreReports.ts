import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  StoreOrderDto,
  ProductDto,
} from "@shared/types";
import { useLanguage } from "@/shared/hooks/useLanguage";

// ============================================
// Query Keys
// ============================================

export const STORE_REPORTS_KEY = "store-reports";
export const STORE_REPORTS_ORDERS_KEY = "store-reports-orders";
export const STORE_REPORTS_PRODUCTS_KEY = "store-reports-products";

// ============================================
// Types
// ============================================

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year";

export interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  averageOrderValue: number;
  completionRate: number;
  cancellationRate: number;
}

export interface RevenueDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  nameAr: string;
  nameEn?: string;
  image?: string;
  totalSold: number;
  totalRevenue: number;
  trend: number;
}

export interface OrderStatusBreakdown {
  status: string;
  label: string;
  labelAr: string;
  labelEn?: string;
  count: number;
  percentage: number;
  color: string;
}

export interface OrderHourData {
  hour: number;
  count: number;
}

export interface OrderDayData {
  day: string;
  dayAr: string;
  dayEn: string;
  count: number;
}

export interface StoreReportData {
  summary: ReportSummary;
  revenueChart: RevenueDataPoint[];
  topProducts: TopProduct[];
  orderStatusBreakdown: OrderStatusBreakdown[];
  ordersByHour: OrderHourData[];
  ordersByDay: OrderDayData[];
}

// ============================================
// Period range — returns a half-open interval [start, end)
// ============================================

function getPeriodRange(
  period: ReportPeriod,
  now: Date = new Date(),
): { start: Date; end: Date } {
  const end = new Date(now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case "today":
      return { start, end };

    case "yesterday": {
      const yesterdayStart = new Date(start);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      return { start: yesterdayStart, end: start };
    }

    case "this_week": {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      return { start: weekStart, end };
    }

    case "last_week": {
      const thisWeekStart = new Date(start);
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      return { start: lastWeekStart, end: thisWeekStart };
    }

    case "this_month": {
      const monthStart = new Date(start);
      monthStart.setDate(1);
      return { start: monthStart, end };
    }

    case "last_month": {
      const thisMonthStart = new Date(start);
      thisMonthStart.setDate(1);
      const lastMonthStart = new Date(thisMonthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      return { start: lastMonthStart, end: thisMonthStart };
    }

    case "this_quarter": {
      const quarterStart = new Date(start);
      quarterStart.setDate(1);
      quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3);
      return { start: quarterStart, end };
    }

    case "this_year": {
      const yearStart = new Date(start);
      yearStart.setMonth(0, 1);
      return { start: yearStart, end };
    }
  }
}

// ============================================
// Status config — keyed by lowercase form of `OrderStatus`
// (server sends PascalCase: "Pending", "ReadyForDriver", …)
// ============================================

const orderStatusColors: Record<string, string> = {
  pending: "#F59E0B",
  accepted: "#3B82F6",
  preparing: "#8B5CF6",
  readyfordriver: "#10B981",
  driverassigned: "#6366F1",
  pickedup: "#06B6D4",
  intransit: "#3B82F6",
  delivered: "#059669",
  cancelled: "#EF4444",
  rejected: "#DC2626",
  failed: "#991B1B",
};

const getOrderStatusLabels = (_isAr: boolean) => ({
  pending: { labelAr: "قيد الانتظار", labelEn: "Pending" },
  accepted: { labelAr: "مقبول", labelEn: "Accepted" },
  preparing: { labelAr: "قيد التحضير", labelEn: "Preparing" },
  readyfordriver: { labelAr: "جاهز للسائق", labelEn: "Ready for Driver" },
  driverassigned: { labelAr: "تم تعيين سائق", labelEn: "Driver Assigned" },
  pickedup: { labelAr: "تم الاستلام", labelEn: "Picked Up" },
  intransit: { labelAr: "في الطريق", labelEn: "In Transit" },
  delivered: { labelAr: "تم التوصيل", labelEn: "Delivered" },
  cancelled: { labelAr: "ملغي", labelEn: "Cancelled" },
  rejected: { labelAr: "مرفوض", labelEn: "Rejected" },
  failed: { labelAr: "فاشل", labelEn: "Failed" },
});

// ============================================
// Day names — Saturday-first for MENA week display
// ============================================

const dayNamesMap = [
  { en: "Saturday", ar: "السبت" },
  { en: "Sunday", ar: "الأحد" },
  { en: "Monday", ar: "الإثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
];

// JS Date.getDay(): 0=Sun … 6=Sat — used to translate an order date → day name
const jsWeekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ============================================
// Hook
// ============================================

export function useStoreReports(period: ReportPeriod = "this_month") {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";

  // ── Fetch all orders (no status filter — the endpoint supports it, but we
  //    want every order so the report can group/count statuses itself) ──
  const ordersQuery = useQuery<StoreOrderDto[]>({
    queryKey: [STORE_REPORTS_ORDERS_KEY],
    queryFn: () => storeApi.orders.list(),
    staleTime: 60_000,
  });

  // ── Fetch all products (paged — take a generous first page) ──
  const productsQuery = useQuery({
    queryKey: [STORE_REPORTS_PRODUCTS_KEY],
    queryFn: () => storeApi.products.list({ pageSize: 500 }),
    staleTime: 60_000,
  });

  const orders = ordersQuery.data ?? [];
  const products: ProductDto[] = productsQuery.data?.items ?? [];

  // ── Filter orders to the selected period (client-side) ──
  const periodOrders = useMemo(() => {
    const { start, end } = getPeriodRange(period);
    const startMs = start.getTime();
    const endMs = end.getTime();
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= startMs && t < endMs;
    });
  }, [orders, period]);

  // ── Derive report ──
  const reportData = useMemo<StoreReportData | null>(() => {
    if (periodOrders.length === 0 && products.length === 0) {
      return null;
    }

    const statusLabels = getOrderStatusLabels(isAr);

    // ── Status breakdown (keys are lowercase for colour + label lookup) ──
    const statusCounts: Record<string, number> = {};
    periodOrders.forEach((o) => {
      const key = (o.status ?? "pending").toLowerCase();
      statusCounts[key] = (statusCounts[key] ?? 0) + 1;
    });

    const totalOrders = periodOrders.length;

    const orderStatusBreakdown: OrderStatusBreakdown[] = Object.entries(
      statusCounts,
    ).map(([status, count]) => {
      const cfg = statusLabels[status as keyof typeof statusLabels];
      const labelAr = cfg?.labelAr ?? status;
      const labelEn = cfg?.labelEn ?? status;
      return {
        status,
        label: isAr ? labelAr : labelEn,
        labelAr,
        labelEn,
        count,
        percentage:
          totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
        color: orderStatusColors[status] ?? "#6B7280",
      };
    });

    // ── Revenue by calendar date (YYYY-MM-DD) ──
    const revenueByDate: Record<string, { revenue: number; orders: number }> =
      {};
    periodOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!revenueByDate[key]) revenueByDate[key] = { revenue: 0, orders: 0 };
      revenueByDate[key].revenue += o.totalAmount ?? 0;
      revenueByDate[key].orders += 1;
    });

    const revenueChart: RevenueDataPoint[] = Object.entries(revenueByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        const d = new Date(date);
        return {
          label: d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: data.revenue,
          orders: data.orders,
        };
      });

    // ── Top products (only products with sales in the period) ──
    const productSales: Record<
      string,
      { totalSold: number; totalRevenue: number }
    > = {};
    periodOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const bucket = (productSales[item.productId] ??= {
          totalSold: 0,
          totalRevenue: 0,
        });
        bucket.totalSold += item.quantity ?? 0;
        bucket.totalRevenue += (item.quantity ?? 0) * (item.unitPrice ?? 0);
      });
    });

    const topProducts: TopProduct[] = products
      .filter((p) => productSales[p.id] !== undefined)
      .map((p) => {
        const sales = productSales[p.id];
        return {
          id: p.id,
          name: isAr
            ? p.nameAr ?? p.nameEn ?? ""
            : p.nameEn ?? p.nameAr ?? "",
          nameAr: p.nameAr ?? "",
          nameEn: p.nameEn,
          image: p.imageUrl,
          totalSold: sales.totalSold,
          totalRevenue: sales.totalRevenue,
          trend: 0, // needs previous-period data
        };
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // ── Orders by hour of day (0-23) ──
    const hourlyCounts = new Array<number>(24).fill(0);
    periodOrders.forEach((o) => {
      hourlyCounts[new Date(o.createdAt).getHours()] += 1;
    });
    const ordersByHour: OrderHourData[] = hourlyCounts.map((count, hour) => ({
      hour,
      count,
    }));

    // ── Orders by day of week ──
    const dayCounts: Record<string, number> = {};
    periodOrders.forEach((o) => {
      const name = jsWeekdayNames[new Date(o.createdAt).getDay()];
      dayCounts[name] = (dayCounts[name] ?? 0) + 1;
    });

    const ordersByDay: OrderDayData[] = dayNamesMap.map((day) => ({
      day: isAr ? day.ar : day.en,
      dayAr: day.ar,
      dayEn: day.en,
      count: dayCounts[day.en] ?? 0,
    }));

    // ── Summary ──
    const totalRevenue = periodOrders.reduce(
      (sum, o) => sum + (o.totalAmount ?? 0),
      0,
    );
    const completedCount = statusCounts["delivered"] ?? 0;
    const cancelledCount = statusCounts["cancelled"] ?? 0;

    const customerKeys = new Set<string>();
    periodOrders.forEach((o) => {
      if (o.customerName) customerKeys.add(o.customerName);
    });

    const summary: ReportSummary = {
      totalRevenue,
      totalOrders,
      totalProducts: products.length,
      totalCustomers: customerKeys.size,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      completionRate:
        totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0,
      cancellationRate:
        totalOrders > 0
          ? Math.round((cancelledCount / totalOrders) * 100)
          : 0,
    };

    return {
      summary,
      revenueChart,
      topProducts,
      orderStatusBreakdown,
      ordersByHour,
      ordersByDay,
    };
  }, [periodOrders, products, isAr]);

  const isLoading = ordersQuery.isLoading || productsQuery.isLoading;
  const isError = ordersQuery.isError || productsQuery.isError;
  const error = ordersQuery.error ?? productsQuery.error ?? null;

  const refetch = async () => {
    await Promise.all([ordersQuery.refetch(), productsQuery.refetch()]);
  };

  return {
    reportData,
    isLoading,
    isError,
    error,
    refetch,
  };
}
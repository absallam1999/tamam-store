import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  StoreOrderDto,
  StoreOrderStatsDto,
  ProductDto,
} from "@shared/types";
import { useLanguage } from "@/shared/hooks/useLanguage";

// ============================================
// Query Keys
// ============================================

export const STORE_REPORTS_KEY = "store-reports";
export const STORE_ORDERS_KEY = "store-reports-orders";
export const STORE_PRODUCTS_KEY = "store-reports-products";

// ============================================
// Helpers
// ============================================

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

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
// Status Config
// ============================================

const orderStatusColors: Record<string, string> = {
  pending: "#F59E0B",
  accepted: "#3B82F6",
  preparing: "#8B5CF6",
  ready: "#10B981",
  in_transit: "#06B6D4",
  picked_up: "#6366F1",
  delivered: "#059669",
  cancelled: "#EF4444",
};

const getOrderStatusLabels = (isAr: boolean) => ({
  pending: {
    label: isAr ? "قيد الانتظار" : "Pending",
    labelAr: "قيد الانتظار",
    labelEn: "Pending",
  },
  accepted: {
    label: isAr ? "مقبول" : "Accepted",
    labelAr: "مقبول",
    labelEn: "Accepted",
  },
  preparing: {
    label: isAr ? "قيد التحضير" : "Preparing",
    labelAr: "قيد التحضير",
    labelEn: "Preparing",
  },
  ready: { label: isAr ? "جاهز" : "Ready", labelAr: "جاهز", labelEn: "Ready" },
  in_transit: {
    label: isAr ? "في الطريق" : "In Transit",
    labelAr: "في الطريق",
    labelEn: "In Transit",
  },
  picked_up: {
    label: isAr ? "تم الاستلام" : "Picked Up",
    labelAr: "تم الاستلام",
    labelEn: "Picked Up",
  },
  delivered: {
    label: isAr ? "تم التوصيل" : "Delivered",
    labelAr: "تم التوصيل",
    labelEn: "Delivered",
  },
  cancelled: {
    label: isAr ? "ملغي" : "Cancelled",
    labelAr: "ملغي",
    labelEn: "Cancelled",
  },
});

// ============================================
// Day Names — Dual Language
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

// ============================================
// Hook
// ============================================

export function useStoreReports(period: ReportPeriod = "this_month") {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";

  // ---- Fetch Order Stats ----
  const { data: orderStats, isLoading: statsLoading } =
    useQuery<StoreOrderStatsDto>({
      queryKey: [STORE_REPORTS_KEY, "stats", period],
      queryFn: async () => {
        const response = await apiClient.get<StoreOrderStatsDto>(
          ENDPOINTS.STORE.ORDER_STATS,
        );
        return unwrap<StoreOrderStatsDto>(response.data);
      },
      staleTime: 60_000,
    });

  // ---- Fetch Orders ----
  const { data: orders, isLoading: ordersLoading } = useQuery<StoreOrderDto[]>({
    queryKey: [STORE_ORDERS_KEY, period],
    queryFn: async () => {
      const response = await apiClient.get<StoreOrderDto[]>(
        ENDPOINTS.STORE.ORDERS,
      );
      const result = unwrap(response.data);
      return Array.isArray(result)
        ? result
        : ((result as any)?.items ?? (result as any)?.data ?? []);
    },
    staleTime: 60_000,
  });

  // ---- Fetch Products ----
  const { data: products, isLoading: productsLoading } = useQuery<ProductDto[]>(
    {
      queryKey: [STORE_PRODUCTS_KEY, period],
      queryFn: async () => {
        const response = await apiClient.get<ProductDto[]>(
          ENDPOINTS.STORE.PRODUCTS,
        );
        const result = unwrap(response.data);
        return Array.isArray(result)
          ? result
          : ((result as any)?.items ?? (result as any)?.data ?? []);
      },
      staleTime: 60_000,
    },
  );

  const isLoading = statsLoading || ordersLoading || productsLoading;

  // ---- Derive Report Data ----
  const reportData = useMemo<StoreReportData | null>(() => {
    const ordersList = orders ?? [];
    const productsList = products ?? [];
    const stats = orderStats;

    if (!stats && ordersList.length === 0 && productsList.length === 0) {
      return null;
    }

    const statusLabels = getOrderStatusLabels(isAr);

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    ordersList.forEach((o) => {
      const status = o.status || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const totalOrders = ordersList.length || stats?.totalOrdersToday || 0;
    const orderStatusBreakdown: OrderStatusBreakdown[] = Object.entries(
      statusCounts,
    ).map(([status, count]) => {
      const labelConfig = statusLabels[status as keyof typeof statusLabels] || {
        label: status,
        labelAr: status,
        labelEn: status,
      };
      return {
        status,
        label: isAr ? labelConfig.labelAr : labelConfig.labelEn,
        labelAr: labelConfig.labelAr,
        labelEn: labelConfig.labelEn,
        count,
        percentage:
          totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
        color: orderStatusColors[status] || "#6B7280",
      };
    });

    // Revenue by day
    const revenueByDay: Record<string, { revenue: number; orders: number }> =
      {};
    ordersList.forEach((o) => {
      const day = new Date(o.createdAt).toLocaleDateString(
        isAr ? "ar-EG" : "en-US",
        { weekday: "short" },
      );
      if (!revenueByDay[day]) revenueByDay[day] = { revenue: 0, orders: 0 };
      revenueByDay[day].revenue += o.totalAmount || 0;
      revenueByDay[day].orders += 1;
    });

    const revenueChart: RevenueDataPoint[] = Object.entries(revenueByDay).map(
      ([label, data]) => ({
        label,
        revenue: data.revenue,
        orders: data.orders,
      }),
    );

    // Top products — use actual order data to calculate sales
    const productSales: Record<
      string,
      { totalSold: number; totalRevenue: number }
    > = {};
    ordersList.forEach((o) => {
      o.items?.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { totalSold: 0, totalRevenue: 0 };
        }
        productSales[item.productId].totalSold += item.quantity || 0;
        productSales[item.productId].totalRevenue +=
          (item.quantity || 0) * (item.unitPrice || 0);
      });
    });

    const topProducts: TopProduct[] = productsList
      .map((p) => {
        const sales = productSales[p.id] || { totalSold: 0, totalRevenue: 0 };
        return {
          id: p.id,
          name: isAr ? p.nameAr : p.nameEn || p.nameAr,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          image: p.imageUrl,
          totalSold: sales.totalSold,
          totalRevenue: sales.totalRevenue,
          trend: 0, // Would need previous period data for real trend
        };
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // Orders by hour
    const ordersByHour: OrderHourData[] = Array.from({ length: 24 }, (_, i) => {
      const count = ordersList.filter(
        (o) => new Date(o.createdAt).getHours() === i,
      ).length;
      return { hour: i, count };
    });

    // Orders by day of week — Dual language
    const ordersByDay: OrderDayData[] = dayNamesMap.map((day) => {
      const count = ordersList.filter(
        (o) =>
          new Date(o.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
          }) === day.en,
      ).length;
      return {
        day: isAr ? day.ar : day.en,
        dayAr: day.ar,
        dayEn: day.en,
        count,
      };
    });

    // Summary
    const totalRevenue = ordersList.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0,
    );
    const completedCount = statusCounts["delivered"] || 0;
    const cancelledCount = statusCounts["cancelled"] || 0;

    const summary: ReportSummary = {
      totalRevenue: stats?.revenueToday ?? totalRevenue,
      totalOrders: stats?.totalOrdersToday ?? totalOrders,
      totalProducts: productsList.length,
      totalCustomers: new Set(
        ordersList.map((o) => o.customerName).filter(Boolean),
      ).size,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      completionRate:
        totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0,
      cancellationRate:
        totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 100) : 0,
    };

    return {
      summary,
      revenueChart,
      topProducts,
      orderStatusBreakdown,
      ordersByHour,
      ordersByDay,
    };
  }, [orders, products, orderStats, isAr]);

  return {
    reportData,
    isLoading,
    isError: false,
    error: null,
    refetch: () => {},
  };
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useStore } from "@app/providers/StoreProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import {
  useStoreOrderStats,
  useStoreOrders,
  type NormalizedOrder,
} from "@shared/hooks/useStoreOrders";
import { useStoreProducts } from "@shared/hooks/useStoreProducts";
import { cn } from "@shared/utils/cn";
import { formatCurrency, getRelativeTime } from "@shared/utils/formatters";
import { useToast } from "@shared/components/Toaster";

// ============================================
// Translations
// ============================================

const t = {
  morning: { ar: "صباح الخير", en: "Good Morning" },
  afternoon: { ar: "مساء الخير", en: "Good Afternoon" },
  evening: { ar: "مساء الخير", en: "Good Evening" },
  myStore: { ar: "متجري", en: "My Store" },
  storeOwner: { ar: "صاحب المتجر", en: "Store Owner" },
  open: { ar: "مفتوح", en: "Open" },
  closed: { ar: "مغلق", en: "Closed" },
  busy: { ar: "مشغول", en: "Busy" },
  free: { ar: "متاح", en: "Free" },
  toggleStoreStatus: { ar: "تبديل حالة المتجر", en: "Toggle store status" },
  toggleBusyStatus: { ar: "تبديل حالة الانشغال", en: "Toggle busy status" },
  todayRevenue: { ar: "إيرادات اليوم", en: "Today's Revenue" },
  todayOrders: { ar: "طلبات اليوم", en: "Today's Orders" },
  pendingOrders: { ar: "طلبات معلقة", en: "Pending Orders" },
  activeOrders: { ar: "طلبات نشطة", en: "Active Orders" },
  totalProducts: { ar: "إجمالي المنتجات", en: "Total Products" },
  recentOrders: { ar: "آخر الطلبات", en: "Recent Orders" },
  viewAll: { ar: "عرض الكل", en: "View All" },
  noRecentOrders: { ar: "لا توجد طلبات حديثة", en: "No recent orders" },
  itemsCount: { ar: "عناصر", en: "items" },
  refresh: { ar: "تحديث", en: "Refresh" },
  statusPending: { ar: "قيد الانتظار", en: "Pending" },
  statusAccepted: { ar: "مقبول", en: "Accepted" },
  statusPreparing: { ar: "قيد التحضير", en: "Preparing" },
  statusReadyForDriver: { ar: "جاهز للسائق", en: "Ready for Driver" },
  statusDriverAssigned: { ar: "تم تعيين سائق", en: "Driver Assigned" },
  statusPickedUp: { ar: "تم الاستلام", en: "Picked Up" },
  statusInTransit: { ar: "في الطريق", en: "In Transit" },
  statusDelivered: { ar: "تم التوصيل", en: "Delivered" },
  statusCancelled: { ar: "ملغي", en: "Cancelled" },
  statusRejected: { ar: "مرفوض", en: "Rejected" },
  statusFailed: { ar: "فاشل", en: "Failed" },
};

// ============================================
// Status Configuration — lowercase keys match
// `FrontendOrderStatus` from `useStoreOrders`.
// ============================================

const getStatusConfig = (isAr: boolean) => ({
  pending: {
    label: isAr ? t.statusPending.ar : t.statusPending.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  accepted: {
    label: isAr ? t.statusAccepted.ar : t.statusAccepted.en,
    className:
      "bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20",
    dot: "bg-info-500",
  },
  preparing: {
    label: isAr ? t.statusPreparing.ar : t.statusPreparing.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  readyfordriver: {
    label: isAr ? t.statusReadyForDriver.ar : t.statusReadyForDriver.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  driverassigned: {
    label: isAr ? t.statusDriverAssigned.ar : t.statusDriverAssigned.en,
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
  },
  pickedup: {
    label: isAr ? t.statusPickedUp.ar : t.statusPickedUp.en,
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
  },
  intransit: {
    label: isAr ? t.statusInTransit.ar : t.statusInTransit.en,
    className:
      "bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20",
    dot: "bg-info-500",
  },
  delivered: {
    label: isAr ? t.statusDelivered.ar : t.statusDelivered.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  cancelled: {
    label: isAr ? t.statusCancelled.ar : t.statusCancelled.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
  },
  rejected: {
    label: isAr ? t.statusRejected.ar : t.statusRejected.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
  },
  failed: {
    label: isAr ? t.statusFailed.ar : t.statusFailed.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
  },
});

// ============================================
// DashboardHome — Main Component
// ============================================

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    store,
    isOpen,
    isBusy,
    toggleStoreStatus,
    toggleStoreBusy,
    refreshStore,
  } = useStore();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [isBusyToggling, setIsBusyToggling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  // Stats
  const {
    data: orderStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useStoreOrderStats();

  // Products — `useStoreProducts` may return `PagedResult<ProductDto>` or
  // `ProductDto[]`; normalize both shapes into a flat array.
  const productsQuery = useStoreProducts();
  const products = useMemo(() => {
    const data = productsQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return (data as { items?: unknown[] }).items ?? [];
  }, [productsQuery.data]);

  // Recent Orders — already `NormalizedOrder[]`
  const {
    data: ordersData,
    isLoading: recentLoading,
    refetch: refetchOrders,
  } = useStoreOrders();

  // Extract recent orders (first 5) — sorted newest-first
  const recentOrders: NormalizedOrder[] = useMemo(() => {
    if (!Array.isArray(ordersData)) return [];
    return [...ordersData]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [ordersData]);

  const isLoading =
    statsLoading || productsQuery.isLoading || recentLoading;

  // Today's orders — fallback when `orderStats.ordersToday` isn't ready yet
  const todayOrdersCount = useMemo(() => {
    if (!ordersData) return 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return ordersData.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= todayStart;
    }).length;
  }, [ordersData]);

  // Map server stats → display metrics.
  // `activeOrders` on the server has no single field — it's the sum of
  // every in-flight bucket.
  const stats = useMemo(
    () => ({
      todayRevenue: orderStats?.revenueToday ?? 0,
      todayOrders: orderStats?.ordersToday ?? todayOrdersCount,
      pendingOrders: orderStats?.pendingOrders ?? 0,
      activeOrders:
        (orderStats?.acceptedOrders ?? 0) +
        (orderStats?.preparingOrders ?? 0) +
        (orderStats?.readyForDriverOrders ?? 0) +
        (orderStats?.pickedUpOrders ?? 0) +
        (orderStats?.inTransitOrders ?? 0),
      avgOrder: orderStats?.averageOrderValue ?? 0,
      totalProducts: products.length,
    }),
    [orderStats, products.length, todayOrdersCount],
  );

  // Handle store open/close — StoreProvider re-throws on failure,
  // so the catch block now actually fires on network/server errors.
  const handleToggle = async () => {
    setIsToggling(true);
    const newIsOpen = !isOpen;
    try {
      await toggleStoreStatus();
      toast.success(
        isAr
          ? newIsOpen
            ? "تم فتح المتجر بنجاح"
            : "تم إغلاق المتجر بنجاح"
          : newIsOpen
            ? "Store opened successfully"
            : "Store closed successfully",
      );
    } catch {
      toast.error(
        isAr ? "فشل تحديث حالة المتجر" : "Failed to update store status",
      );
    } finally {
      setIsToggling(false);
    }
  };

  // Handle busy toggle — same pattern, hits PATCH /api/store/profile/busy.
  const handleBusyToggle = async () => {
    setIsBusyToggling(true);
    try {
      await toggleStoreBusy();
      toast.success(isAr ? "تم تحديث حالة الانشغال" : "Busy status updated");
    } catch {
      toast.error(isAr ? "فشل تحديث الحالة" : "Failed to update busy status");
    } finally {
      setIsBusyToggling(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return lang(t.morning);
    if (hour < 17) return lang(t.afternoon);
    return lang(t.evening);
  };

  const getUserName = () => user?.fullName || lang(t.storeOwner);
  const storeName = isAr
    ? store?.nameAr || store?.nameEn || lang(t.myStore)
    : store?.nameEn || store?.nameAr || lang(t.myStore);
  const statusConfig = getStatusConfig(isAr);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchOrders(), refreshStore()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-8",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {getGreeting()}, {getUserName()}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">
              {storeName}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                isOpen
                  ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20"
                  : "bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700",
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isOpen
                    ? "bg-success-500"
                    : "bg-surface-400 dark:bg-surface-500",
                )}
              />
              {isOpen ? lang(t.open) : lang(t.closed)}
            </span>
          </div>
        </div>

        {/* Toggle Switches Card */}
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 bg-white dark:bg-surface-900/50 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
          {/* Open/Closed Toggle */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium",
                isOpen
                  ? "text-success-600 dark:text-success-400"
                  : "text-surface-500 dark:text-surface-400",
              )}
            >
              {isOpen ? lang(t.open) : lang(t.closed)}
            </span>
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500 dark:focus:ring-offset-surface-900",
                isOpen
                  ? "bg-success-500"
                  : "bg-surface-300 dark:bg-surface-600",
                isToggling && "opacity-50 cursor-wait",
              )}
              aria-label={lang(t.toggleStoreStatus)}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                  isOpen
                    ? isAr
                      ? "-translate-x-6"
                      : "translate-x-6"
                    : "translate-x-1",
                )}
              />
            </button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-surface-200 dark:bg-surface-700" />

          {/* Busy/Free Toggle */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium",
                isBusy
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-success-600 dark:text-success-400",
              )}
            >
              {isBusy ? lang(t.busy) : lang(t.free)}
            </span>
            <button
              onClick={handleBusyToggle}
              disabled={isBusyToggling}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warning-500 dark:focus:ring-offset-surface-900",
                isBusy ? "bg-warning-500" : "bg-success-500",
                isBusyToggling && "opacity-50 cursor-wait",
              )}
              aria-label={lang(t.toggleBusyStatus)}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                  isBusy
                    ? isAr
                      ? "-translate-x-6"
                      : "translate-x-6"
                    : "translate-x-1",
                )}
              />
            </button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-surface-200 dark:bg-surface-700" />

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-surface-900",
              isRefreshing && "opacity-50 cursor-wait",
            )}
            aria-label={lang(t.refresh)}
            title={lang(t.refresh)}
          >
            <svg
              className={cn("w-4 h-4", isRefreshing && "animate-spin")}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            label: lang(t.todayRevenue),
            value: formatCurrency(stats.todayRevenue),
            color:
              "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ),
            to: "/dashboard/wallet",
          },
          {
            label: lang(t.todayOrders),
            value: stats.todayOrders,
            color:
              "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                />
              </svg>
            ),
            to: "/dashboard/orders",
          },
          {
            label: lang(t.pendingOrders),
            value: stats.pendingOrders,
            color:
              "bg-warning-100 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ),
            to: "/dashboard/orders?status=pending",
          },
          {
            label: lang(t.activeOrders),
            value: stats.activeOrders,
            color:
              "bg-info-100 dark:bg-info-500/10 text-info-600 dark:text-info-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                />
              </svg>
            ),
            to: "/dashboard/orders?status=accepted",
          },
          {
            label: lang(t.totalProducts),
            value: stats.totalProducts,
            color:
              "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
            ),
            to: "/dashboard/menu",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.to)}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md hover:border-surface-300 dark:hover:border-surface-700 transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="skeleton h-4 w-24 rounded-lg" />
                  <div className="skeleton h-10 w-10 rounded-xl" />
                </div>
                <div className="skeleton h-8 w-16 rounded-lg" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
                    {card.label}
                  </p>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      card.color,
                    )}
                  >
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {card.value}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">
            {lang(t.recentOrders)}
          </h3>
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
          >
            {lang(t.viewAll)}
          </button>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <div className="skeleton h-4 w-20 rounded-lg" />
                <div className="skeleton h-4 w-28 rounded-lg flex-1" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-4 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-surface-300 dark:text-surface-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {lang(t.noRecentOrders)}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {recentOrders.map((order) => {
              const sc =
                statusConfig[order.status as keyof typeof statusConfig] ||
                statusConfig.pending;
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer group"
                >
                  <span className="font-mono text-xs font-semibold text-surface-900 dark:text-white w-20 flex-shrink-0">
                    #{order.orderNumber}
                  </span>
                  <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 min-w-0 truncate">
                    {order.customerName || "—"}
                  </span>
                  <span className="text-sm text-surface-500 dark:text-surface-400 hidden sm:block flex-1 min-w-0 truncate">
                    {order.items?.length ?? 0} {lang(t.itemsCount)}
                  </span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white flex-shrink-0">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0",
                      sc.className,
                    )}
                  >
                    <span className={cn("w-1 h-1 rounded-full", sc.dot)} />
                    {sc.label}
                  </span>
                  <span className="text-xs text-surface-400 dark:text-surface-500 w-16 text-right flex-shrink-0">
                    {getRelativeTime(order.createdAt)}
                  </span>
                  <svg
                    className={cn(
                      "w-4 h-4 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                      isAr && "rotate-180",
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
import { useState, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency, getRelativeTime } from "@shared/utils/formatters";
import {
  useStoreOrder,
  useStoreOrders,
  useStoreOrderStats,
  useUpdateOrderStatus,
  useCompleteStoreDelivery,
  useAcceptOrder,
  useReadyForDriver,
  usePickedUpOrder,
  type FrontendOrderStatus,
  type NormalizedOrder,
} from "@shared/hooks/useStoreOrders";

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "الطلبات", en: "Orders" },
  subtitle: { ar: "إدارة وتتبع طلبات متجرك", en: "Manage and track your store orders" },
  total: { ar: "الكل", en: "All" },
  pending: { ar: "معلق", en: "Pending" },
  accepted: { ar: "مقبول", en: "Accepted" },
  preparing: { ar: "قيد التحضير", en: "Preparing" },
  ready: { ar: "جاهز", en: "Ready" },
  picked_up: { ar: "قيد التوصيل", en: "In Transit" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
  search: { ar: "ابحث برقم الطلب أو اسم العميل…", en: "Search by order # or customer…" },
  items: { ar: "عناصر", en: "items" },
  item: { ar: "عنصر", en: "item" },
  noOrders: { ar: "لا توجد طلبات بعد", en: "No orders yet" },
  noFilteredOrders: { ar: "لا توجد طلبات بهذه الحالة", en: "No orders match this filter" },
  noSearchResults: { ar: "لا توجد نتائج للبحث", en: "No results found" },
  statusUpdated: { ar: "تم تحديث حالة الطلب بنجاح", en: "Order status updated successfully" },
  statusUpdateFailed: { ar: "فشل تحديث الحالة", en: "Failed to update status" },
  revenue: { ar: "إيرادات اليوم", en: "Today's Revenue" },
  selectDeliveryMethod: { ar: "اختر طريقة التوصيل", en: "Select Delivery Method" },
  tamamDelivery: { ar: "توصيل تمام", en: "Tamam Delivery" },
  storeOwnDelivery: { ar: "توصيل المتجر", en: "Store Own Delivery" },
};

// ============================================================
// Status flow & labels
// ============================================================

const STATUS_FLOW: Record<FrontendOrderStatus, FrontendOrderStatus | null> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",     // ← was missing — orders in Preparing had no action button
  ready: "picked_up",
  picked_up: null,
  delivered: null,
  cancelled: null,
};

const STATUS_ACTION_LABEL: Record<FrontendOrderStatus, { ar: string; en: string }> = {
  pending: { ar: "قبول", en: "Accept" },
  accepted: { ar: "بدء التحضير", en: "Start Preparing" },
  preparing: { ar: "جاهز للتوصيل", en: "Ready for Pickup" },
  ready: { ar: "تأكيد الاستلام", en: "Confirm Pickup" },
  picked_up: { ar: "", en: "" },
  delivered: { ar: "", en: "" },
  cancelled: { ar: "", en: "" },
};

const orderStatusLabel = (s: FrontendOrderStatus, isAr: boolean): string =>
  isAr ? t[s].ar : t[s].en;

// ============================================================
// Status configuration (badges + icons)
// ============================================================

const getStatusConfig = (isAr: boolean) => ({
  pending: {
    label: orderStatusLabel("pending", isAr),
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  accepted: {
    label: orderStatusLabel("accepted", isAr),
    className:
      "bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20",
    dot: "bg-info-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    ),
  },
  preparing: {
    label: orderStatusLabel("preparing", isAr),
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    dot: "bg-purple-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
  },
  ready: {
    label: orderStatusLabel("ready", isAr),
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    ),
  },
  picked_up: {
    label: orderStatusLabel("picked_up", isAr),
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  delivered: {
    label: orderStatusLabel("delivered", isAr),
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    ),
  },
  cancelled: {
    label: orderStatusLabel("cancelled", isAr),
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    ),
  },
});

// ============================================================
// Expanded items
// ============================================================

const OrderItemsExpanded: React.FC<{
  orderId: string;
  items: NormalizedOrder["items"];
  isAr: boolean;
}> = ({ orderId, items, isAr }) => {
  const { data: fullOrder } = useStoreOrder(orderId);
  const displayItems = fullOrder?.items ?? items ?? [];

  return (
    <div className="space-y-2">
      {displayItems.map((item, idx) => {
        const productName = isAr
          ? item.productName ?? ""
          : item.productName ?? "";

        const optionsDisplay = (item.options ?? []).join(" | ");

        return (
          <div key={item.id ?? idx} className="text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 dark:text-surface-400 flex-shrink-0">
                  {item.quantity}×
                </span>
                <span className="text-surface-700 dark:text-surface-300 truncate">
                  {productName}
                </span>
              </div>
              <span className="text-surface-600 dark:text-surface-400 font-medium flex-shrink-0 ml-4 tabular-nums">
                {formatCurrency(item.quantity * item.unitPrice)}
              </span>
            </div>
            {optionsDisplay && (
              <div className={cn("mt-1 text-xs text-surface-500 dark:text-surface-400", isAr ? "pr-8" : "pl-8")}>
                {optionsDisplay}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// Main Page
// ============================================================

export const OrdersPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const activeFilter = (searchParams.get("status") || "all").toLowerCase();
  const urlSearchQuery = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(urlSearchQuery);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useStoreOrders();
  const { data: statsData } = useStoreOrderStats();
  const acceptOrder = useAcceptOrder();
  const readyForDriver = useReadyForDriver();
  const completeStoreDelivery = useCompleteStoreDelivery();
  const pickedUpOrder = usePickedUpOrder();
  const updateStatus = useUpdateOrderStatus();

  const statusConfig = getStatusConfig(isAr);

  const toggleExpanded = useCallback((orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const statusFiltered = useMemo(() => {
    if (activeFilter === "all") return orders;
    return orders.filter((o) => o.status === activeFilter);
  }, [orders, activeFilter]);

  const filtered = useMemo(() => {
    if (!urlSearchQuery.trim()) return statusFiltered;
    const q = urlSearchQuery.toLowerCase().trim();
    return statusFiltered.filter(
      (o) =>
        String(o.orderNumber ?? "").toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.customerPhone ?? "").includes(q),
    );
  }, [statusFiltered, urlSearchQuery]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      picked_up: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      counts.all++;
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return counts;
  }, [orders]);

  const setFilter = useCallback(
    (key: string) => {
      const p = new URLSearchParams(searchParams);
      if (key === "all") p.delete("status");
      else p.set("status", key);
      p.delete("search");
      setSearchInput("");
      setSearchParams(p);
    },
    [searchParams, setSearchParams],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      const p = new URLSearchParams(searchParams);
      if (value.trim()) p.set("search", value.trim());
      else p.delete("search");
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const executeStatusAction = async (orderId: string, next: FrontendOrderStatus) => {
    setProcessingId(orderId);
    try {
      if (next === "accepted") {
        await acceptOrder.mutateAsync(orderId);
        toast.success(lang(t.statusUpdated));
      } else if (next === "preparing") {
        await updateStatus.mutateAsync({ orderId, status: "preparing" });
        toast.success(lang(t.statusUpdated));
      } else if (next === "ready") {
        // Delivery method choice required before moving to ReadyForDriver
        setDeliveryOrderId(orderId);
        setShowDeliveryModal(true);
        setProcessingId(null);
        return;
      } else if (next === "picked_up") {
        await pickedUpOrder.mutateAsync(orderId);
        toast.success(lang(t.statusUpdated));
      } else {
        await updateStatus.mutateAsync({ orderId, status: next });
        toast.success(lang(t.statusUpdated));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : lang(t.statusUpdateFailed);
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeliveryChoice = async (method: "tamam" | "store") => {
    if (!deliveryOrderId) return;
    setProcessingId(deliveryOrderId);
    try {
      if (method === "store") {
        await completeStoreDelivery.mutateAsync(deliveryOrderId);
        toast.success(lang(t.delivered));
      } else {
        await readyForDriver.mutateAsync(deliveryOrderId);
        toast.success(lang(t.ready));
      }
      setShowDeliveryModal(false);
      setDeliveryOrderId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : lang(t.statusUpdateFailed);
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const statCards = [
    { key: "all", label: lang(t.total), value: stats.all },
    { key: "pending", label: lang(t.pending), value: stats.pending },
    { key: "accepted", label: lang(t.accepted), value: stats.accepted },
    { key: "preparing", label: lang(t.preparing), value: stats.preparing },
    { key: "ready", label: lang(t.ready), value: stats.ready },
    { key: "picked_up", label: lang(t.picked_up), value: stats.picked_up },
    { key: "delivered", label: lang(t.delivered), value: stats.delivered },
    { key: "cancelled", label: lang(t.cancelled), value: stats.cancelled },
  ];

  return (
    <div
      className={cn("space-y-5 animate-fade-in pb-12 w-full", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header + revenue pill — same structure as your version */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{lang(t.title)}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{lang(t.subtitle)}</p>
        </div>
        {statsData?.revenueToday !== undefined && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20">
            <span className="text-sm font-semibold text-success-700 dark:text-success-400">
              {lang(t.revenue)}: {formatCurrency(statsData.revenueToday)}
            </span>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {statCards.map((s) => {
          const isActive = activeFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={cn(
                "relative rounded-2xl border p-3.5 transition-all duration-200 text-start cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                isActive
                  ? "border-primary-400 bg-primary-50/80 dark:bg-primary-500/10 shadow-sm"
                  : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800",
              )}
            >
              <p className="text-xl font-bold tabular-nums text-surface-900 dark:text-white">{s.value}</p>
              <p className="text-[11px] font-medium mt-0.5 text-surface-500 dark:text-surface-400">
                {s.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search — same as your version */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={lang(t.search)}
            className={cn(
              "w-full py-2.5 bg-white dark:bg-surface-900 text-sm rounded-xl text-surface-900 dark:text-white placeholder:text-surface-400 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500/50 transition-all duration-200",
              isAr ? "pr-10 pl-10" : "pl-10 pr-10",
            )}
          />
        </div>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 animate-pulse">
              <div className="skeleton h-10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
          <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
            {urlSearchQuery
              ? lang(t.noSearchResults)
              : activeFilter !== "all"
                ? lang(t.noFilteredOrders)
                : lang(t.noOrders)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = order.status;
            const sc = statusConfig[status] ?? statusConfig.pending;
            const next = STATUS_FLOW[status];
            const nextLabel = next ? lang(STATUS_ACTION_LABEL[next]) : null;
            const isProcessing = processingId === order.id;
            const isExpanded = expandedOrders.has(order.id);
            const itemCount = order.items?.length ?? 0;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 transition-all duration-200 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md group overflow-hidden"
              >
                <button
                  onClick={() => itemCount > 0 && toggleExpanded(order.id)}
                  className="w-full p-4 sm:p-5 text-left cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3 min-w-0 group/link"
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", sc.className)}>
                          {sc.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-bold text-surface-900 dark:text-white">
                              #{order.orderNumber ?? "—"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500 dark:text-surface-400">
                            <span className="font-medium text-surface-700 dark:text-surface-300">
                              {order.customerName ?? "—"}
                            </span>
                            {order.customerPhone && (
                              <>
                                <span className="text-surface-300">•</span>
                                <span dir="ltr">{order.customerPhone}</span>
                              </>
                            )}
                            <span className="text-surface-300">•</span>
                            <span>
                              {itemCount} {itemCount === 1 ? lang(t.item) : lang(t.items)}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0", sc.className)}>
                        <span className={cn("w-1 h-1 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className={cn(isAr ? "text-left" : "text-right")}>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-[10px] text-surface-400 dark:text-surface-500">
                          {getRelativeTime(order.createdAt)}
                        </p>
                      </div>
                      {next && nextLabel ? (
                        <button
                          onClick={() => executeStatusAction(order.id, next)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-sm disabled:opacity-50 whitespace-nowrap transition-all"
                        >
                          {isProcessing ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            nextLabel
                          )}
                        </button>
                      ) : (
                        <span className={cn("inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border", sc.className)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </span>
                      )}
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all flex-shrink-0"
                      >
                        <svg className={cn("w-4 h-4", isAr && "rotate-180")} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </button>

                {isExpanded && itemCount > 0 && (
                  <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/20 px-5 py-3">
                    <OrderItemsExpanded orderId={order.id} items={order.items} isAr={isAr} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery method modal — same as your version */}
      {showDeliveryModal && deliveryOrderId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl">
            <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                {lang(t.selectDeliveryMethod)}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleDeliveryChoice("tamam")}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border-2 border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 transition-all text-start"
              >
                <p className="font-semibold">{lang(t.tamamDelivery)}</p>
              </button>
              <button
                onClick={() => handleDeliveryChoice("store")}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500/50 text-start"
              >
                <p className="font-semibold">{lang(t.storeOwnDelivery)}</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
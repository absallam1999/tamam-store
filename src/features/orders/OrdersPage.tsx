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
  useAcceptOrder,
  useReadyForDriver,
  usePickedUpOrder,
} from "@shared/hooks/useStoreOrders";

// ============================================================
// Types
// ============================================================

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

// ============================================================
// Status Flow
// ============================================================

const STATUS_FLOW: Record<string, string | null> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up",
  picked_up: null,
  delivered: null,
  cancelled: null,
};

const STATUS_ACTION_LABEL: Record<string, { ar: string; en: string }> = {
  accepted: { ar: "قبول", en: "Accept" },
  preparing: { ar: "بدء التحضير", en: "Start Preparing" },
  ready: { ar: "جاهز للتوصيل", en: "Ready for Pickup" },
  picked_up: { ar: "تأكيد الاستلام", en: "Confirm Pickup" },
};

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "الطلبات", en: "Orders" },
  subtitle: {
    ar: "إدارة وتتبع طلبات متجرك",
    en: "Manage and track your store orders",
  },
  total: { ar: "الكل", en: "All" },
  pending: { ar: "معلق", en: "Pending" },
  accepted: { ar: "مقبول", en: "Accepted" },
  preparing: { ar: "قيد التحضير", en: "Preparing" },
  ready: { ar: "جاهز", en: "Ready" },
  picked_up: { ar: "قيد التوصيل", en: "In Transit" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
  search: {
    ar: "ابحث برقم الطلب أو اسم العميل…",
    en: "Search by order # or customer…",
  },
  filterBy: { ar: "التصنيف:", en: "Filter:" },
  items: { ar: "عناصر", en: "items" },
  item: { ar: "عنصر", en: "item" },
  noOrders: { ar: "لا توجد طلبات بعد", en: "No orders yet" },
  noOrdersDesc: {
    ar: "ستظهر الطلبات الجديدة هنا فور وصولها",
    en: "New orders will appear here as they come in",
  },
  noFilteredOrders: {
    ar: "لا توجد طلبات بهذه الحالة",
    en: "No orders match this filter",
  },
  noSearchResults: { ar: "لا توجد نتائج للبحث", en: "No results found" },
  statusUpdated: {
    ar: "تم تحديث حالة الطلب بنجاح",
    en: "Order status updated successfully",
  },
  statusUpdateFailed: { ar: "فشل تحديث الحالة", en: "Failed to update status" },
  revenue: { ar: "إيرادات اليوم", en: "Today's Revenue" },
  clearFilter: { ar: "مسح", en: "Clear" },
  x: { ar: "x", en: "x" },
};

// ============================================================
// Status Configuration
// ============================================================

const getStatusConfig = (isAr: boolean) => ({
  pending: {
    label: isAr ? t.pending.ar : t.pending.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  accepted: {
    label: isAr ? t.accepted.ar : t.accepted.en,
    className:
      "bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20",
    dot: "bg-info-500",
  },
  preparing: {
    label: isAr ? t.preparing.ar : t.preparing.en,
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    dot: "bg-purple-500",
  },
  ready: {
    label: isAr ? t.ready.ar : t.ready.en,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  picked_up: {
    label: isAr ? t.picked_up.ar : t.picked_up.en,
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
  },
  delivered: {
    label: isAr ? t.delivered.ar : t.delivered.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  cancelled: {
    label: isAr ? t.cancelled.ar : t.cancelled.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
  },
});

// ============================================================
// Order Item Expanded
// ============================================================

const OrderItemsExpanded: React.FC<{
  orderId: string;
  items: any[];
  isAr: boolean;
}> = ({ orderId, items, isAr }) => {
  // Fetch full order details (includes options)
  const { data: fullOrder } = useStoreOrder(orderId);

  // Use full order items if available, otherwise fallback to list items
  const displayItems = fullOrder?.items || items;

  return (
    <div className="space-y-2">
      {displayItems.map((item, idx) => {
        const productName = isAr
          ? item.productNameAr || item.productNameEn || ""
          : item.productNameEn || item.productNameAr || "";

        // Parse options
        let parsedOptions: any[] = [];
        try {
          if (typeof item.options === "string" && item.options.trim()) {
            const parsed = JSON.parse(item.options);
            parsedOptions = Array.isArray(parsed) ? parsed : [parsed];
          } else if (Array.isArray(item.options)) {
            parsedOptions = item.options;
          } else if (item.options && typeof item.options === "object") {
            parsedOptions = [item.options];
          }
        } catch {
          parsedOptions = [];
        }

        // Format options for display
        const formatOptionDisplay = (opt: any): string => {
          if (typeof opt === "string") return opt;
          if (!opt || typeof opt !== "object") return "";

          const optionName = isAr
            ? opt.nameAr ||
              opt.optionNameAr ||
              opt.name ||
              opt.optionName ||
              opt.groupName ||
              ""
            : opt.nameEn ||
              opt.optionNameEn ||
              opt.name ||
              opt.optionName ||
              opt.groupName ||
              "";

          let values: string[] = [];

          if (Array.isArray(opt.values)) {
            values = opt.values
              .map((v: any) => {
                if (typeof v === "string") return v;
                return isAr
                  ? v?.nameAr || v?.valueNameAr || v?.name || v?.valueName || ""
                  : v?.nameEn ||
                      v?.valueNameEn ||
                      v?.name ||
                      v?.valueName ||
                      "";
              })
              .filter(Boolean);
          } else if (opt.valueName) {
            values = [opt.valueName];
          } else if (opt.value) {
            if (typeof opt.value === "string") {
              values = [opt.value];
            } else {
              values = [
                isAr
                  ? opt.value.nameAr || opt.value.name || ""
                  : opt.value.nameEn || opt.value.name || "",
              ];
            }
          } else if (opt.selectedValueName) {
            values = [opt.selectedValueName];
          } else if (opt.selectedValues && Array.isArray(opt.selectedValues)) {
            values = opt.selectedValues
              .map((v: any) => {
                if (typeof v === "string") return v;
                return isAr
                  ? v?.nameAr || v?.valueNameAr || v?.name || v?.valueName || ""
                  : v?.nameEn ||
                      v?.valueNameEn ||
                      v?.name ||
                      v?.valueName ||
                      "";
              })
              .filter(Boolean);
          }

          if (optionName && values.length > 0) {
            return `${optionName}: ${values.join(", ")}`;
          }
          if (values.length > 0) return values.join(", ");
          return optionName;
        };

        const optionsDisplay = parsedOptions
          .map(formatOptionDisplay)
          .filter(Boolean)
          .join(" | ");

        return (
          <div key={item.productId || idx} className="text-sm">
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

            {/* Options Display */}
            {optionsDisplay && (
              <div
                className={cn(
                  "mt-1 text-xs text-surface-500 dark:text-surface-400 flex items-start gap-1.5",
                  isAr ? "pr-8" : "pl-8",
                )}
              >
                <svg
                  className="w-3 h-3 flex-shrink-0 mt-0.5 text-surface-400 dark:text-surface-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{optionsDisplay}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// Main Page Component
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

  const { data: orders = [], isLoading } = useStoreOrders();
  const { data: statsData } = useStoreOrderStats();
  const acceptOrder = useAcceptOrder();
  const readyForDriver = useReadyForDriver();
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

  // Client-side filtering
  const statusFiltered = useMemo(() => {
    if (activeFilter === "all") return orders;
    return orders.filter(
      (o) => (o.status || "").toLowerCase() === activeFilter,
    );
  }, [orders, activeFilter]);

  const filtered = useMemo(() => {
    if (!urlSearchQuery.trim()) return statusFiltered;
    const q = urlSearchQuery.toLowerCase().trim();
    return statusFiltered.filter(
      (o) =>
        String(o.orderNumber || "")
          .toLowerCase()
          .includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").includes(q),
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
      const s = (o.status || "pending").toLowerCase();
      counts.all++;
      if (counts.hasOwnProperty(s)) counts[s]++;
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

  const executeStatusAction = async (orderId: string, next: string) => {
    setProcessingId(orderId);
    try {
      if (next === "accepted") await acceptOrder.mutateAsync(orderId);
      else if (next === "ready") await readyForDriver.mutateAsync(orderId);
      else if (next === "picked_up") await pickedUpOrder.mutateAsync(orderId);
      else await updateStatus.mutateAsync({ orderId, status: next });
      toast.success(lang(t.statusUpdated));
    } catch (err: any) {
      toast.error(err?.message || lang(t.statusUpdateFailed));
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
      className={cn(
        "space-y-5 animate-fade-in pb-12 w-full",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header + Revenue */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {lang(t.subtitle)}
          </p>
        </div>
        {statsData?.revenueToday !== undefined && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20">
            <svg
              className="w-4 h-4 text-success-600 dark:text-success-400"
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
            <span className="text-sm font-semibold text-success-700 dark:text-success-400">
              {lang(t.revenue)}: {formatCurrency(statsData.revenueToday)}
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {statCards.map((s) => {
          const isActive =
            activeFilter === s.key ||
            (s.key === "all" && activeFilter === "all");
          const activeColors: Record<string, string> = {
            all: "border-primary-400 bg-primary-50/80 dark:bg-primary-500/10",
            pending:
              "border-warning-400 bg-warning-50/80 dark:bg-warning-500/10",
            accepted: "border-info-400 bg-info-50/80 dark:bg-info-500/10",
            preparing:
              "border-purple-400 bg-purple-50/80 dark:bg-purple-500/10",
            ready: "border-emerald-400 bg-emerald-50/80 dark:bg-emerald-500/10",
            picked_up:
              "border-primary-400 bg-primary-50/80 dark:bg-primary-500/10",
            delivered:
              "border-success-400 bg-success-50/80 dark:bg-success-500/10",
            cancelled: "border-error-400 bg-error-50/80 dark:bg-error-500/10",
          };
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={cn(
                "relative rounded-2xl border p-3.5 transition-all duration-200 text-start cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                isActive
                  ? `${activeColors[s.key] || activeColors.all} shadow-sm`
                  : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800",
              )}
            >
              <p
                className={cn(
                  "text-xl font-bold tabular-nums",
                  isActive
                    ? "text-surface-900 dark:text-white"
                    : "text-surface-700 dark:text-surface-300",
                )}
              >
                {s.value}
              </p>
              <p
                className={cn(
                  "text-[11px] font-medium mt-0.5",
                  isActive
                    ? "text-surface-600 dark:text-surface-400"
                    : "text-surface-500 dark:text-surface-500",
                )}
              >
                {s.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search + Active Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <svg
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400",
              isAr ? "right-3.5" : "left-3.5",
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
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
          {searchInput && (
            <button
              onClick={() => handleSearchChange("")}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600",
                isAr ? "left-3" : "right-3",
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {activeFilter !== "all" && (
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 text-primary-700 dark:text-primary-400 text-sm font-medium whitespace-nowrap">
            {statusConfig[activeFilter as keyof typeof statusConfig]?.label ||
              activeFilter}
            <button
              onClick={() => setFilter("all")}
              className="p-0.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        )}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-32 rounded-lg" />
                  <div className="skeleton h-4 w-48 rounded-lg" />
                </div>
                <div className="skeleton h-8 w-20 rounded-full" />
                <div className="skeleton h-9 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
          <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
            <svg
              className="w-10 h-10 text-surface-300 dark:text-surface-600"
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
            const status = (
              order.status || "pending"
            ).toLowerCase() as OrderStatus;
            const sc = statusConfig[status] || statusConfig.pending;
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
                {/* Main Row - clickable to expand */}
                <button
                  onClick={() => itemCount > 0 && toggleExpanded(order.id)}
                  className="w-full p-4 sm:p-5 text-left cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          sc.className.split(" ")[0],
                          sc.className.split(" ")[1],
                        )}
                      >
                        {status === "pending" && (
                          <svg
                            className="w-4 h-4"
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
                        )}
                        {status === "accepted" && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        )}
                        {status === "preparing" && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                            />
                          </svg>
                        )}
                        {(status === "ready" || status === "delivered") && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        )}
                        {status === "picked_up" && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                            />
                          </svg>
                        )}
                        {status === "cancelled" && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18 18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-surface-900 dark:text-white">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              sc.className,
                            )}
                          >
                            <span
                              className={cn("w-1 h-1 rounded-full", sc.dot)}
                            />
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500 dark:text-surface-400">
                          <span className="font-medium text-surface-700 dark:text-surface-300">
                            {order.customerName || "—"}
                          </span>
                          {order.customerPhone && (
                            <>
                              <span className="text-surface-300">•</span>
                              <span dir="ltr">{order.customerPhone}</span>
                            </>
                          )}
                          <span className="text-surface-300">•</span>
                          <span>
                            {itemCount}{" "}
                            {itemCount === 1 ? lang(t.item) : lang(t.items)}
                          </span>
                          {itemCount > 0 && (
                            <svg
                              className={cn(
                                "w-3.5 h-3.5 transition-transform",
                                isExpanded && "rotate-180",
                              )}
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-4 lg:gap-6 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          ) : (
                            nextLabel
                          )}
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border",
                            sc.className,
                          )}
                        >
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full", sc.dot)}
                          />
                          {sc.label}
                        </span>
                      )}
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <svg
                          className={cn("w-4 h-4", isAr && "rotate-180")}
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
                      </Link>
                    </div>
                  </div>
                </button>

                {/* Expandable Items List */}
                {isExpanded && itemCount > 0 && (
                  <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/20 px-5 py-3">
                    <OrderItemsExpanded
                      orderId={order.id}
                      items={order.items}
                      isAr={isAr}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

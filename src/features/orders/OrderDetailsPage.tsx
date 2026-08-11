import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency, getRelativeTime } from "@shared/utils/formatters";
import {
  useStoreOrder,
  useAcceptOrder,
  useRejectOrder,
  useUpdateOrderStatus,
  useReadyForDriver,
  usePickedUpOrder,
} from "@/shared/hooks/useStoreOrders";
import { useState } from "react";

// ============================================
// Types
// ============================================

type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

// ============================================
// Safe helpers
// ============================================

const safeGetRelativeTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "—";
  try {
    return getRelativeTime(dateStr) || "—";
  } catch {
    return "—";
  }
};

const safeFormatDateTime = (
  dateStr: string | undefined | null,
  options: Intl.DateTimeFormatOptions,
  locale: string,
): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(locale, options);
  } catch {
    return "—";
  }
};

const safeFormatTime = (
  dateStr: string | undefined | null,
  locale: string,
): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};

// ============================================
// Translations (unchanged)
// ============================================

const t = {
  back: { ar: "العودة للطلبات", en: "Back to Orders" },
  orderDetails: { ar: "تفاصيل الطلب", en: "Order Details" },
  products: { ar: "المنتجات", en: "Products" },
  orderSummary: { ar: "ملخص الطلب", en: "Order Summary" },
  customer: { ar: "العميل", en: "Customer" },
  notes: { ar: "ملاحظات", en: "Notes" },
  subtotal: { ar: "المجموع الفرعي", en: "Subtotal" },
  deliveryFee: { ar: "رسوم التوصيل", en: "Delivery Fee" },
  discount: { ar: "الخصم", en: "Discount" },
  total: { ar: "الإجمالي", en: "Total" },
  items: { ar: "عناصر", en: "items" },
  item: { ar: "عنصر", en: "item" },
  statusPending: { ar: "قيد الانتظار", en: "Pending" },
  statusAccepted: { ar: "مقبول", en: "Accepted" },
  statusPreparing: { ar: "قيد التحضير", en: "Preparing" },
  statusReady: { ar: "جاهز للتوصيل", en: "Ready for Pickup" },
  statusPickedUp: { ar: "في الطريق", en: "In Transit" },
  statusDelivered: { ar: "تم التوصيل", en: "Delivered" },
  statusCancelled: { ar: "ملغي", en: "Cancelled" },
  loadError: { ar: "فشل تحميل الطلب", en: "Failed to load order" },
  statusUpdated: { ar: "تم تحديث حالة الطلب", en: "Order status updated" },
  statusUpdateError: { ar: "فشل تحديث الحالة", en: "Failed to update status" },
  scheduledDelivery: { ar: "موعد التوصيل", en: "Scheduled Delivery" },
  processing: { ar: "جاري المعالجة...", en: "Processing..." },
  noItems: { ar: "لا توجد منتجات", en: "No items" },
  noNotes: { ar: "لا توجد ملاحظات", en: "No special instructions" },
  quantity: { ar: "الكمية", en: "Qty" },
  price: { ar: "السعر", en: "Price" },
  actions: { ar: "إجراءات", en: "Actions" },
  orderNumber: { ar: "طلب رقم", en: "Order #" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  paymentMethod: { ar: "طريقة الدفع", en: "Payment Method" },
  orderType: { ar: "نوع الطلب", en: "Order Type" },
  reject: { ar: "رفض الطلب", en: "Reject Order" },
  rejectReason: {
    ar: "سبب الرفض (اختياري)",
    en: "Rejection reason (optional)",
  },
  confirmReject: { ar: "تأكيد الرفض", en: "Confirm Rejection" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  normal: { ar: "عادي", en: "Normal" },
  scheduled: { ar: "مجدول", en: "Scheduled" },
};

// ============================================
// Status Configuration (unchanged)
// ============================================

const getStatusConfig = (isAr: boolean) => ({
  pending: {
    label: isAr ? t.statusPending.ar : t.statusPending.en,
    className:
      "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
    dot: "bg-warning-500",
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
  },
  accepted: {
    label: isAr ? t.statusAccepted.ar : t.statusAccepted.en,
    className:
      "bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20",
    dot: "bg-info-500",
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
          d="m4.5 12.75 6 6 9-13.5"
        />
      </svg>
    ),
  },
  preparing: {
    label: isAr ? t.statusPreparing.ar : t.statusPreparing.en,
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    dot: "bg-purple-500",
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
          d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
        />
      </svg>
    ),
  },
  ready: {
    label: isAr ? t.statusReady.ar : t.statusReady.en,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
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
          d="m4.5 12.75 6 6 9-13.5"
        />
      </svg>
    ),
  },
  picked_up: {
    label: isAr ? t.statusPickedUp.ar : t.statusPickedUp.en,
    className:
      "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
    dot: "bg-primary-500",
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
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
    ),
  },
  delivered: {
    label: isAr ? t.statusDelivered.ar : t.statusDelivered.en,
    className:
      "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
    dot: "bg-success-500",
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
          d="m4.5 12.75 6 6 9-13.5"
        />
      </svg>
    ),
  },
  cancelled: {
    label: isAr ? t.statusCancelled.ar : t.statusCancelled.en,
    className:
      "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
    dot: "bg-error-500",
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
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    ),
  },
});

// Status flow
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
  accepted: { ar: "قبول الطلب", en: "Accept Order" },
  preparing: { ar: "بدء التحضير", en: "Start Preparing" },
  ready: { ar: "جاهز للتوصيل", en: "Ready for Pickup" },
  picked_up: { ar: "تأكيد الاستلام", en: "Confirm Pickup" },
};

// ============================================
// Main Component
// ============================================

export const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  console.log("🔍 [OrderDetailsPage] orderId from URL:", orderId);

  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useStoreOrder(orderId || "");
  const acceptOrder = useAcceptOrder();
  const rejectOrder = useRejectOrder();
  const updateStatus = useUpdateOrderStatus();
  const readyForDriver = useReadyForDriver();
  const pickedUpOrder = usePickedUpOrder();

  const isUpdating =
    acceptOrder.isPending ||
    rejectOrder.isPending ||
    updateStatus.isPending ||
    readyForDriver.isPending ||
    pickedUpOrder.isPending;

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    try {
      if (newStatus === "accepted") await acceptOrder.mutateAsync(order.id);
      else if (newStatus === "ready")
        await readyForDriver.mutateAsync(order.id);
      else if (newStatus === "picked_up")
        await pickedUpOrder.mutateAsync(order.id);
      else
        await updateStatus.mutateAsync({
          orderId: order.id,
          status: newStatus,
        });

      toast.success(lang(t.statusUpdated));

      // Force refetch the order data immediately after update
      refetch();
    } catch (err: any) {
      toast.error(err?.message || lang(t.statusUpdateError));
    }
  };

  const handleReject = async () => {
    if (!order) return;
    try {
      await rejectOrder.mutateAsync({
        orderId: order.id,
        reason: rejectReason || undefined,
      });
      toast.success(lang(t.statusUpdated));
      setShowRejectModal(false);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err?.message || lang(t.statusUpdateError));
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div
        className={cn(
          "space-y-6 animate-fade-in",
          isAr ? "text-right" : "text-left",
        )}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="skeleton h-40 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
        <div className="w-20 h-20 rounded-2xl bg-error-100 dark:bg-error-500/10 flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 text-error-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-500 dark:text-surface-400 mb-2">
          {lang(t.loadError)}
        </h3>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            {lang(t.retry)}
          </button>
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="btn btn-ghost btn-sm"
          >
            {lang(t.back)}
          </button>
        </div>
      </div>
    );
  }

  // Status is already normalized by the hook
  const status = (order.status || "pending") as OrderStatus;
  const sc = getStatusConfig(isAr)[status] || getStatusConfig(isAr).pending;
  const nextStatus = STATUS_FLOW[status];
  const nextLabel = nextStatus ? lang(STATUS_ACTION_LABEL[nextStatus]) : null;
  const canReject = status === "pending";

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-12",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header Card */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate("/dashboard/orders")}
              className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    isAr
                      ? "M8.25 4.5l7.5 7.5-7.5 7.5"
                      : "M15.75 19.5 8.25 12l7.5-7.5"
                  }
                />
              </svg>
            </button>
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                sc.className.split(" ")[0],
                sc.className.split(" ")[1],
              )}
            >
              {sc.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white font-mono">
                #{order.orderNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    sc.className,
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                  {sc.label}
                </span>
                <span className="text-xs text-surface-400">
                  {safeGetRelativeTime(order.createdAt)}
                </span>
                {(order as any).paymentMethod && (
                  <>
                    <span className="text-xs text-surface-300">•</span>
                    <span className="text-xs text-surface-500">
                      {(order as any).paymentMethod}
                    </span>
                  </>
                )}
                {(order as any).orderType === "Scheduled" && (
                  <>
                    <span className="text-xs text-surface-300">•</span>
                    <span className="text-xs text-surface-500">
                      {lang(t.scheduled)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {canReject && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isUpdating}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  "bg-error-50 text-error-700 border border-error-200 hover:bg-error-100",
                  "dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20 dark:hover:bg-error-500/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {lang(t.reject)}
              </button>
            )}
            {nextStatus && nextLabel && (
              <button
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={isUpdating}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                  "shadow-sm hover:shadow-md",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2",
                )}
              >
                {isUpdating ? (
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
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                {lang(t.products)}
              </h3>
              <span className="text-sm text-surface-500">
                {order.items?.length ?? 0}{" "}
                {(order.items?.length ?? 0) === 1
                  ? lang(t.item)
                  : lang(t.items)}
              </span>
            </div>
            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {order.items.map((item, idx) => {
                  // Get product name based on app language
                  const productName = isAr
                    ? item.productNameAr || item.productNameEn || ""
                    : item.productNameEn || item.productNameAr || "";

                  return (
                    <div
                      key={item.productId || idx}
                      className="flex items-center justify-between p-4 gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-600 dark:text-surface-400">
                            {item.quantity}x
                          </span>
                          <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                            {productName}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white tabular-nums">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center min-h-[200px]">
                <svg
                  className="w-12 h-12 text-surface-300 dark:text-surface-600 mb-3"
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
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {lang(t.noItems)}
                </p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
              {lang(t.orderSummary)}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">{lang(t.subtotal)}</span>
                <span className="font-medium text-surface-700 dark:text-surface-300 tabular-nums">
                  {formatCurrency(
                    (order as any).subtotal ||
                      order.totalAmount - (order.deliveryFee || 0),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">{lang(t.deliveryFee)}</span>
                <span className="font-medium text-surface-700 dark:text-surface-300 tabular-nums">
                  {formatCurrency(order.deliveryFee || 0)}
                </span>
              </div>
              {((order as any).discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">{lang(t.discount)}</span>
                  <span className="font-medium text-success-600 tabular-nums">
                    -{formatCurrency((order as any).discount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                <span className="font-semibold text-surface-900 dark:text-white">
                  {lang(t.total)}
                </span>
                <span className="text-lg font-bold text-surface-900 dark:text-white tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
              {lang(t.customer)}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {(order.customerName || "?")[0]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-surface-900 dark:text-white truncate">
                  {order.customerName || "—"}
                </p>
                {order.customerPhone && (
                  <p className="text-sm text-surface-500" dir="ltr">
                    {order.customerPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scheduled Delivery */}
          {order.scheduledDeliveryTime && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
                {lang(t.scheduledDelivery)}
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-info-100 dark:bg-info-500/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-info-600 dark:text-info-400"
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
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-900 dark:text-white tabular-nums">
                    {safeFormatTime(
                      order.scheduledDeliveryTime,
                      isAr ? "ar-EG" : "en-US",
                    )}
                  </p>
                  <p className="text-xs text-surface-500">
                    {safeFormatDateTime(
                      order.scheduledDeliveryTime,
                      { weekday: "long", month: "short", day: "numeric" },
                      isAr ? "ar-EG" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
              {lang(t.actions)}
            </h3>
            <div className="space-y-2">
              {canReject && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-error-50 text-error-700 border border-error-200 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20 disabled:opacity-50 transition-all"
                >
                  {lang(t.reject)}
                </button>
              )}
              {nextStatus && nextLabel && (
                <button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
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
              )}
              <button
                onClick={() => navigate("/dashboard/orders")}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all"
              >
                {lang(t.back)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="bg-white dark:bg-surface-900 w-full max-w-md rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                {lang(t.confirmReject)}
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <svg
                  className="w-5 h-5"
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
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={lang(t.rejectReason)}
                rows={3}
                className="w-full rounded-xl py-3 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 border-2 border-transparent focus:outline-none focus:border-primary-500/50 transition-all text-sm resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200"
                >
                  {lang(t.cancel)}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-error-600 text-white hover:bg-error-700 active:scale-[0.98] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
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
                    lang(t.confirmReject)
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;

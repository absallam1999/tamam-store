import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency } from "@shared/utils/formatters";
import {
  useAcceptOrder,
  useRejectOrder,
  orderKeys,
} from "@shared/hooks/useStoreOrders";
import type { StoreOrderDto } from "@shared/types";

// ============================================================
// Translations
// ============================================================

const t = {
  newOrder: { ar: "طلب جديد!", en: "New Order!" },
  newOrders: { ar: "طلبات جديدة!", en: "New Orders!" },
  orderNumber: { ar: "رقم الطلب", en: "Order #" },
  customerName: { ar: "العميل", en: "Customer" },
  items: { ar: "المنتجات", en: "Items" },
  total: { ar: "الإجمالي", en: "Total" },
  accept: { ar: "قبول", en: "Accept" },
  reject: { ar: "رفض", en: "Reject" },
  accepting: { ar: "جاري القبول...", en: "Accepting..." },
  rejecting: { ar: "جاري الرفض...", en: "Rejecting..." },
  orderAccepted: { ar: "تم قبول الطلب", en: "Order accepted" },
  orderRejected: { ar: "تم رفض الطلب", en: "Order rejected" },
  rejectReason: {
    ar: "سبب الرفض (اختياري)",
    en: "Rejection reason (optional)",
  },
  of: { ar: "من", en: "of" },
  paymentMethod: { ar: "طريقة الدفع", en: "Payment Method" },
  deliveryFee: { ar: "رسوم التوصيل", en: "Delivery Fee" },
  free: { ar: "مجاناً", en: "Free" },
  moreItems: { ar: "منتجات إضافية", en: "more items" },
  pending: { ar: "قيد الانتظار", en: "Pending" },
};

// ============================================================
// Helper – get product name by language
// ============================================================

const getProductName = (item: any, isAr: boolean): string => {
  if (isAr) {
    return item.productNameAr || item.productName || item.productNameEn || "";
  }
  return item.productNameEn || item.productName || item.productNameAr || "";
};

// ============================================================
// Main Component
// ============================================================

interface NewOrderModalProps {
  orders: StoreOrderDto[];
  onClose: () => void;
  onOrderProcessed?: (orderId: string) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  orders,
  onClose,
  onOrderProcessed,
}) => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [processedOrders, setProcessedOrders] = useState<Set<string>>(
    new Set(),
  );

  const acceptOrder = useAcceptOrder();
  const rejectOrder = useRejectOrder();

  // Sort orders: oldest first (FIFO)
  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [orders]);

  // Active orders = sortedOrders minus processed
  const activeOrders = useMemo(() => {
    return sortedOrders.filter((o) => !processedOrders.has(o.id));
  }, [sortedOrders, processedOrders]);

  const currentOrder = activeOrders[currentIndex];
  const hasMultiple = activeOrders.length > 1;
  const isLastOrder = currentIndex >= activeOrders.length - 1;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const moveToNext = useCallback(() => {
    setShowRejectInput(false);
    setRejectReason("");
    if (currentIndex < activeOrders.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  }, [currentIndex, activeOrders.length, onClose]);

  const handleAccept = async () => {
    if (isAccepting || !currentOrder) return;
    setIsAccepting(true);
    try {
      await acceptOrder.mutateAsync(currentOrder.id);
      toast.success(lang(t.orderAccepted));
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Mark as processed
      setProcessedOrders((prev) => new Set(prev).add(currentOrder.id));
      // Notify parent
      onOrderProcessed?.(currentOrder.id);
      moveToNext();
    } catch {
      toast.error(isAr ? "فشل قبول الطلب" : "Failed to accept order");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting || !currentOrder) return;
    if (showRejectInput && !rejectReason.trim()) {
      toast.warning(isAr ? "يرجى إدخال سبب الرفض" : "Please enter a reason");
      return;
    }
    setIsRejecting(true);
    try {
      await rejectOrder.mutateAsync({
        orderId: currentOrder.id,
        reason: rejectReason.trim() || undefined,
      });
      toast.success(lang(t.orderRejected));
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Mark as processed
      setProcessedOrders((prev) => new Set(prev).add(currentOrder.id));
      // Notify parent
      onOrderProcessed?.(currentOrder.id);
      moveToNext();
    } catch {
      toast.error(isAr ? "فشل رفض الطلب" : "Failed to reject order");
    } finally {
      setIsRejecting(false);
    }
  };

  const handlePrev = () => {
    setShowRejectInput(false);
    setRejectReason("");
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentOrder) return null;

  const isProcessing = isAccepting || isRejecting;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4",
        "bg-black/60 backdrop-blur-sm",
        "animate-fade-in",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        "transition-all duration-500 ease-out",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl overflow-hidden",
          "bg-white dark:bg-surface-900",
          "border border-surface-200/50 dark:border-surface-800/50",
          "shadow-2xl shadow-black/30 dark:shadow-black/50",
          "animate-scale-in",
          "max-h-[90vh] flex flex-col",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================== */}
        {/* HEADER                                             */}
        {/* ================================================== */}
        <div
          className={cn(
            "relative overflow-hidden px-6 py-5",
            isAr
              ? "bg-gradient-to-l from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800"
              : "bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800",
          )}
        >
          {/* Decorative blurs */}
          <div
            className={cn(
              "absolute -top-20 w-40 h-40 bg-white/10 rounded-full blur-3xl",
              isAr ? "-left-20" : "-right-20",
            )}
          />
          <div
            className={cn(
              "absolute -bottom-20 w-40 h-40 bg-primary-400/10 rounded-full blur-3xl",
              isAr ? "-right-20" : "-left-20",
            )}
          />

          <div className="relative">
            {/* Main row */}
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex items-center gap-3 min-w-0",
                  isAr ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 animate-pulse",
                    isAr ? "order-2" : "order-1",
                  )}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>
                </div>

                <div
                  className={cn(
                    "flex-1 min-w-0",
                    isAr ? "text-right order-1" : "text-left order-2",
                  )}
                >
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {hasMultiple ? lang(t.newOrders) : lang(t.newOrder)}
                  </h2>
                  {hasMultiple && (
                    <p className="text-sm text-white/80 mt-0.5">
                      {currentIndex + 1} {lang(t.of)} {activeOrders.length}
                    </p>
                  )}
                </div>
              </div>

              <span
                className={cn(
                  "px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-xs font-mono font-bold border border-white/15 flex-shrink-0",
                  isAr ? "order-3" : "order-3",
                )}
              >
                #{currentOrder.orderNumber}
              </span>
            </div>

            {/* Navigation Dots */}
            {hasMultiple && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {activeOrders.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason("");
                      setCurrentIndex(idx);
                    }}
                    disabled={isProcessing}
                    className="group relative transition-all duration-300 focus:outline-none"
                  >
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === currentIndex
                          ? "w-8 bg-white shadow-lg shadow-white/30"
                          : "w-2.5 bg-white/40 group-hover:bg-white/60",
                        isProcessing && "cursor-not-allowed opacity-50",
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* BODY                                               */}
        {/* ================================================== */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-50/50 dark:bg-surface-900/50">
          {/* Customer Info */}
          <div className="p-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200/50 dark:border-surface-700/50 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1 text-start">
              <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                {currentOrder.customerName || "—"}
              </p>

              <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                {currentOrder.customerPhone && (
                  <p
                    className="text-xs text-surface-500 dark:text-surface-400 font-mono"
                    dir="ltr"
                  >
                    {currentOrder.customerPhone}
                  </p>
                )}
                {currentOrder.customerPhone && (
                  <span className="text-xs text-surface-300 dark:text-surface-600 select-none">
                    •
                  </span>
                )}
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {new Date(currentOrder.createdAt).toLocaleTimeString(
                    isAr ? "ar-EG" : "en-US",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400 flex-shrink-0 whitespace-nowrap">
              {lang(t.pending)}
            </span>
          </div>

          {/* Items */}
          <div className="rounded-xl p-4 bg-white dark:bg-surface-800 border border-surface-200/50 dark:border-surface-700/50 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                {lang(t.items)}
              </p>
              <span className="text-xs font-medium text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-lg">
                {currentOrder.items?.length || 0}
              </span>
            </div>

            <div className="space-y-2">
              {currentOrder.items?.slice(0, 5).map((item, idx) => {
                const productName = getProductName(item, isAr);
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-800/50 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <span className="text-xs font-medium text-surface-400 dark:text-surface-500 tabular-nums w-7 text-center flex-shrink-0">
                        {item.quantity}×
                      </span>
                      <span className="text-surface-700 dark:text-surface-300 truncate text-start flex-1 min-w-0">
                        {productName}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400 tabular-nums flex-shrink-0 text-end">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}

              {currentOrder.items && currentOrder.items.length > 5 && (
                <p className="text-xs text-surface-400 dark:text-surface-500 text-center pt-2 border-t border-surface-200 dark:border-surface-700">
                  +{currentOrder.items.length - 5} {lang(t.moreItems)}
                </p>
              )}
            </div>
          </div>

          {/* Payment + Delivery */}
          <div className="p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200/50 dark:border-surface-700/50 shadow-sm flex items-center gap-4">
            <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-surface-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
              </svg>
              <span>
                {(currentOrder as any).paymentMethod ||
                  (isAr ? "غير محدد" : "N/A")}
              </span>
            </span>

            <span className="w-px h-4 bg-surface-200 dark:bg-surface-700 flex-shrink-0" />

            <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-surface-400 flex-shrink-0"
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
              <span>
                {currentOrder.deliveryFee === 0
                  ? lang(t.free)
                  : formatCurrency(currentOrder.deliveryFee)}
              </span>
            </span>
          </div>

          {/* Total */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-500/10 dark:to-primary-600/5 border border-primary-200/50 dark:border-primary-500/20 flex items-center justify-between">
            <span className="text-sm font-semibold text-surface-900 dark:text-white">
              {lang(t.total)}
            </span>
            <span className="text-xl font-bold text-primary-700 dark:text-primary-400 tabular-nums">
              {formatCurrency(currentOrder.totalAmount)}
            </span>
          </div>

          {/* Rejection Reason Input */}
          {showRejectInput && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-medium text-surface-600 dark:text-surface-400 block text-start">
                {lang(t.rejectReason)}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={lang(t.rejectReason)}
                rows={2}
                className="w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all resize-none text-start"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* NAVIGATION (multiple orders)                      */}
        {/* ================================================== */}
        {hasMultiple && (
          <div
            className={cn(
              "flex items-center justify-between px-4 py-2.5",
              "bg-white/60 dark:bg-surface-900/60 backdrop-blur-sm",
              "border-t border-surface-200/50 dark:border-surface-800/50",
            )}
          >
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0 || isProcessing}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                "focus:outline-none",
                currentIndex === 0 || isProcessing
                  ? "text-surface-300 cursor-not-allowed opacity-50"
                  : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/30 focus-visible:ring-2 focus-visible:ring-primary-500/40",
                isAr ? "order-3" : "order-1",
              )}
              aria-label={isAr ? "الطلب السابق" : "Previous order"}
            >
              <svg
                className="w-5 h-5 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            <span
              className={cn(
                "text-xs font-medium text-surface-400 dark:text-surface-500",
                "bg-white/30 dark:bg-surface-800/30 px-3 py-1 rounded-lg tabular-nums",
                "order-2",
              )}
            >
              {currentIndex + 1} / {activeOrders.length}
            </span>

            <button
              onClick={moveToNext}
              disabled={isProcessing || (isLastOrder && !showRejectInput)}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                "focus:outline-none",
                isProcessing || (isLastOrder && !showRejectInput)
                  ? "text-surface-300 cursor-not-allowed opacity-50"
                  : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/30 focus-visible:ring-2 focus-visible:ring-primary-500/40",
                isAr ? "order-1" : "order-3",
              )}
              aria-label={isAr ? "الطلب التالي" : "Next order"}
            >
              <svg
                className="w-5 h-5 transition-transform duration-200"
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
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* FOOTER – Accept / Reject                          */}
        {/* ================================================== */}
        <div
          className={cn(
            "p-4",
            "bg-white dark:bg-surface-900",
            "border-t border-surface-200/50 dark:border-surface-800/50",
            "flex gap-3",
            isAr ? "flex-row-reverse" : "flex-row",
          )}
        >
          <button
            onClick={() => {
              if (showRejectInput) {
                handleReject();
              } else {
                setShowRejectInput(true);
              }
            }}
            disabled={isProcessing}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300",
              "hover:bg-surface-200 dark:hover:bg-surface-700",
              "active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-400/40",
              isAr ? "flex-row-reverse" : "flex-row",
            )}
          >
            {isRejecting ? (
              <>
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
                <span>{lang(t.rejecting)}</span>
              </>
            ) : (
              <span>{lang(t.reject)}</span>
            )}
          </button>

          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
              "text-white",
              "active:scale-[0.98]",
              "shadow-md shadow-primary-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50",
              isAr ? "flex-row-reverse" : "flex-row",
            )}
          >
            {isAccepting ? (
              <>
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
                <span>{lang(t.accepting)}</span>
              </>
            ) : (
              <span>{lang(t.accept)}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default NewOrderModal;

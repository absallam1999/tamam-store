import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency } from "@shared/utils/formatters";
import {
  useStoreOrder,
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
  options: { ar: "خيارات", en: "Options" },
};

// ============================================================
// Notification Audio Hook - Loops until user responds
// ============================================================

const useNotificationAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopIntervalRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Create audio element for notification sound
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = "./audio/notification.mp3";
    audio.loop = true; // Enable looping
    audioRef.current = audio;

    // Check if user has muted notifications
    const muted = localStorage.getItem("notification-muted") === "true";
    setIsMuted(muted);

    // Cleanup on unmount
    return () => {
      stopLoop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Start looping notification
  const startLoop = useCallback(() => {
    if (isMuted || !audioRef.current) return;

    try {
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.volume = 0.7;
      audio.loop = true;

      // Play audio
      audio.play().catch((err) => {
        console.log("Audio playback failed:", err);
        // Fallback: try again after user interaction
        const playOnInteraction = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", playOnInteraction);
          document.removeEventListener("touchstart", playOnInteraction);
        };
        document.addEventListener("click", playOnInteraction);
        document.addEventListener("touchstart", playOnInteraction);
      });

      // Clear any existing interval
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
      }

      // Set interval to ensure audio keeps playing (in case loop fails)
      loopIntervalRef.current = window.setInterval(() => {
        if (audio.paused && !isMuted) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      }, 1000);
    } catch (err) {
      console.log("Failed to start notification loop:", err);
    }
  }, [isMuted]);

  // Stop looping notification
  const stopLoop = useCallback(() => {
    // Clear interval
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
    }
  }, []);

  // Play once (for testing or single notification)
  const playOnce = useCallback(() => {
    if (isMuted || !audioRef.current) return;

    const audio = audioRef.current;
    audio.loop = false;
    audio.currentTime = 0;
    audio.volume = 0.7;
    audio.play().catch((err) => {
      console.log("Audio playback failed:", err);
    });
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem("notification-muted", String(newValue));

      // If muting, stop audio immediately
      if (newValue) {
        stopLoop();
      }

      return newValue;
    });
  }, [stopLoop]);

  return {
    startLoop,
    stopLoop,
    playOnce,
    toggleMute,
    isMuted,
  };
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
// Helper – Parse options from string or array
// ============================================================

const parseItemOptions = (options: any): any[] => {
  if (!options) return [];

  // If already an array, return it
  if (Array.isArray(options)) {
    return options;
  }

  // If string, try to parse as JSON
  if (typeof options === "string") {
    const trimmed = options.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      // If not valid JSON, treat as a single option value
      return [{ valueName: trimmed }];
    }
  }

  // If object, wrap in array
  if (typeof options === "object" && options !== null) {
    // Check if it's already an options structure
    if (options.name || options.nameAr || options.nameEn || options.valueName) {
      return [options];
    }

    // Check if it has values array
    if (Array.isArray(options.values)) {
      return [options];
    }

    // If empty object, return empty array
    if (Object.keys(options).length === 0) {
      return [];
    }

    return [options];
  }

  return [];
};

// ============================================================
// Helper – Format options display string
// ============================================================

const formatOptionsDisplay = (options: any[], isAr: boolean): string => {
  if (!options || options.length === 0) return "";

  const parts: string[] = [];

  options.forEach((opt) => {
    if (typeof opt === "string") {
      parts.push(opt);
    } else if (opt && typeof opt === "object") {
      const optionName = isAr
        ? opt.nameAr || opt.optionNameAr || opt.name || opt.optionName || ""
        : opt.nameEn || opt.optionNameEn || opt.name || opt.optionName || "";

      let values: string[] = [];
      if (Array.isArray(opt.values)) {
        values = opt.values
          .map((v: any) =>
            isAr
              ? v.nameAr || v.valueNameAr || v.name || v.valueName || ""
              : v.nameEn || v.valueNameEn || v.name || v.valueName || "",
          )
          .filter(Boolean);
      } else if (opt.valueName) {
        values = [opt.valueName];
      } else if (opt.value) {
        values = [
          isAr
            ? opt.value.nameAr || opt.value.name || ""
            : opt.value.nameEn || opt.value.name || "",
        ];
      }

      if (optionName && values.length > 0) {
        parts.push(`${optionName}: ${values.join(", ")}`);
      } else if (values.length > 0) {
        parts.push(values.join(", "));
      } else if (optionName) {
        parts.push(optionName);
      }
    }
  });

  return parts.join(" | ");
};

// ============================================================
// Helper – Group duplicate products by productId
// ============================================================

interface GroupedOrderItem {
  productId: string;
  productNameAr?: string;
  productNameEn?: string;
  unitPrice: number;
  totalQuantity: number;
  variations: {
    quantity: number;
    options: any[];
    optionsDisplay: string;
  }[];
}

const groupOrderItems = (items: any[], isAr: boolean): GroupedOrderItem[] => {
  const grouped: Record<string, GroupedOrderItem> = {};

  items.forEach((item) => {
    const productId = item.productId || item.id || "";
    const key = productId || getProductName(item, isAr);

    if (!grouped[key]) {
      grouped[key] = {
        productId,
        productNameAr: item.productNameAr,
        productNameEn: item.productNameEn,
        unitPrice: item.unitPrice || item.price || 0,
        totalQuantity: 0,
        variations: [],
      };
    }

    const options = parseItemOptions(item.options);
    const optionsDisplay = formatOptionsDisplay(options, isAr);
    const quantity = Number(item.quantity) || 1;

    grouped[key].totalQuantity += quantity;

    const existingVariation = grouped[key].variations.find(
      (v) => v.optionsDisplay === optionsDisplay,
    );

    if (existingVariation) {
      existingVariation.quantity += quantity;
    } else {
      grouped[key].variations.push({
        quantity,
        options,
        optionsDisplay,
      });
    }
  });

  return Object.values(grouped);
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
  const { startLoop, stopLoop, toggleMute, isMuted } = useNotificationAudio();

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [orders]);

  const activeOrders = useMemo(() => {
    return sortedOrders.filter((o) => !processedOrders.has(o.id));
  }, [sortedOrders, processedOrders]);

  const currentOrder = activeOrders[currentIndex];
  const currentOrderId = currentOrder?.id || "";
  const hasMultiple = activeOrders.length > 1;
  const isLastOrder = currentIndex >= activeOrders.length - 1;

  // Fetch full order details for the current order (includes options)
  const { data: fullOrderDetails } = useStoreOrder(currentOrderId);

  // Use full details if available, otherwise fallback to list data
  const displayOrder = fullOrderDetails || currentOrder;

  // Group items for current order
  const groupedItems = useMemo(() => {
    if (!displayOrder?.items) return [];
    return groupOrderItems(displayOrder.items, isAr);
  }, [displayOrder, isAr]);

  // Play notification sound when component mounts with new orders
  useEffect(() => {
    if (orders.length > 0) {
      startLoop();
    }

    return () => {
      stopLoop();
    };
  }, [orders.length, startLoop, stopLoop]);

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
    stopLoop();
    try {
      await acceptOrder.mutateAsync(currentOrder.id);
      toast.success(lang(t.orderAccepted));
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      setProcessedOrders((prev) => new Set(prev).add(currentOrder.id));
      onOrderProcessed?.(currentOrder.id);

      // If there are more orders, restart the loop
      if (activeOrders.length > 1) {
        startLoop();
      }

      moveToNext();
    } catch {
      toast.error(isAr ? "فشل قبول الطلب" : "Failed to accept order");
    } finally {
      setIsAccepting(false);
    }
  };

  // Stop audio when user rejects order
  const handleReject = async () => {
    if (isRejecting || !currentOrder) return;
    if (showRejectInput && !rejectReason.trim()) {
      toast.warning(isAr ? "يرجى إدخال سبب الرفض" : "Please enter a reason");
      return;
    }
    setIsRejecting(true);
    stopLoop();
    try {
      await rejectOrder.mutateAsync({
        orderId: currentOrder.id,
        reason: rejectReason.trim() || undefined,
      });
      toast.success(lang(t.orderRejected));
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      setProcessedOrders((prev) => new Set(prev).add(currentOrder.id));
      onOrderProcessed?.(currentOrder.id);

      // If there are more orders, restart the loop
      if (activeOrders.length > 1) {
        startLoop();
      }

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
        {/* HEADER */}
        <div
          className={cn(
            "relative overflow-hidden px-6 py-5",
            isAr
              ? "bg-gradient-to-l from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800"
              : "bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800",
          )}
        >
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

              <div className="flex items-center gap-2">
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200 relative",
                    isMuted
                      ? "bg-white/10 hover:bg-white/20"
                      : "bg-white/15 hover:bg-white/25",
                  )}
                  title={
                    isMuted
                      ? isAr
                        ? "تفعيل الصوت"
                        : "Unmute"
                      : isAr
                        ? "كتم الصوت"
                        : "Mute"
                  }
                  aria-label={
                    isMuted
                      ? isAr
                        ? "تفعيل الصوت"
                        : "Unmute"
                      : isAr
                        ? "كتم الصوت"
                        : "Mute"
                  }
                >
                  {isMuted ? (
                    // Muted Icon
                    <svg
                      className="w-4 h-4 text-white/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 8.25l4.5-4.5v16.5l-4.5-4.5H3.75a.75.75 0 0 1-.75-.75V9a.75.75 0 0 1 .75-.75h3Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m15 9 6 6m0-6-6 6"
                      />
                    </svg>
                  ) : (
                    // Unmuted Icon
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 8.25l4.5-4.5v16.5l-4.5-4.5H3.75a.75.75 0 0 1-.75-.75V9a.75.75 0 0 1 .75-.75h3Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424"
                      />
                    </svg>
                  )}

                  {/* Red dot indicator when muted */}
                  {isMuted && (
                    <>
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white/50 animate-pulse" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 blur-[2px] animate-ping" />
                    </>
                  )}
                </button>

                <span className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-xs font-mono font-bold border border-white/15">
                  #{currentOrder.orderNumber}
                </span>
              </div>
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

        {/* BODY */}
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
                {displayOrder.customerName || "—"}
              </p>

              <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                {displayOrder.customerPhone && (
                  <p
                    className="text-xs text-surface-500 dark:text-surface-400 font-mono"
                    dir="ltr"
                  >
                    {displayOrder.customerPhone}
                  </p>
                )}
                {displayOrder.customerPhone && (
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

          {/* Grouped Items with Options */}
          <div className="rounded-xl p-4 bg-white dark:bg-surface-800 border border-surface-200/50 dark:border-surface-700/50 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                {lang(t.items)}
              </p>
              <span className="text-xs font-medium text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-lg">
                {groupedItems.length}
              </span>
            </div>

            <div className="space-y-2">
              {groupedItems.slice(0, 5).map((item, idx) => {
                const productName = isAr
                  ? item.productNameAr || item.productNameEn || ""
                  : item.productNameEn || item.productNameAr || "";

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 flex items-center gap-2.5">
                        <span className="text-xs font-medium text-surface-400 dark:text-surface-500 tabular-nums w-7 text-center flex-shrink-0">
                          {item.totalQuantity}×
                        </span>
                        <span className="text-surface-700 dark:text-surface-300 truncate text-start flex-1 min-w-0">
                          {productName}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-surface-600 dark:text-surface-400 tabular-nums flex-shrink-0 text-end">
                        {formatCurrency(item.unitPrice * item.totalQuantity)}
                      </span>
                    </div>

                    {/* Show variations if there are multiple options */}
                    {item.variations.length > 1 && (
                      <div className="mt-2 pl-9 space-y-1">
                        {item.variations.map((variation, vIdx) => (
                          <div
                            key={vIdx}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-[10px] text-surface-400 tabular-nums w-5 text-center flex-shrink-0">
                                {variation.quantity}×
                              </span>
                              <span className="text-[11px] text-surface-500 dark:text-surface-400 truncate">
                                {variation.optionsDisplay || ""}
                              </span>
                            </div>
                            <span className="text-[11px] text-surface-400 tabular-nums flex-shrink-0">
                              {formatCurrency(
                                item.unitPrice * variation.quantity,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show single variation options */}
                    {item.variations.length === 1 &&
                      item.variations[0].optionsDisplay && (
                        <div className="mt-1.5 pl-9">
                          <span className="text-[11px] text-surface-500 dark:text-surface-400">
                            {item.variations[0].optionsDisplay}
                          </span>
                        </div>
                      )}
                  </div>
                );
              })}

              {groupedItems.length > 5 && (
                <p className="text-xs text-surface-400 dark:text-surface-500 text-center pt-2 border-t border-surface-200 dark:border-surface-700">
                  +{groupedItems.length - 5} {lang(t.moreItems)}
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
                {displayOrder.deliveryFee === 0
                  ? lang(t.free)
                  : formatCurrency(displayOrder.deliveryFee)}
              </span>
            </span>
          </div>

          {/* Total */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-500/10 dark:to-primary-600/5 border border-primary-200/50 dark:border-primary-500/20 flex items-center justify-between">
            <span className="text-sm font-semibold text-surface-900 dark:text-white">
              {lang(t.total)}
            </span>
            <span className="text-xl font-bold text-primary-700 dark:text-primary-400 tabular-nums">
              {formatCurrency(displayOrder.totalAmount)}
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

        {/* NAVIGATION */}
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

        {/* FOOTER */}
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

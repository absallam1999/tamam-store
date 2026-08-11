/**
 * formatters — Store Dashboard Formatting Utilities
 */

// ============================================================
// Helpers
// ============================================================

/**
 * Safely parse a date value, returning null if invalid
 */
const safeDate = (date: string | Date | null | undefined): Date | null => {
  if (date === null || date === undefined || date === "") return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
};

// ============================================================
// Currency
// ============================================================

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currencyDisplay: "symbol",
  }).format(amount);

export const formatCurrencyValue = (amount: number): string =>
  new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

// ============================================================
// Numbers
// ============================================================

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat("ar-EG").format(num);

export const formatCompactNumber = (num: number): string =>
  new Intl.NumberFormat("ar-EG", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);

export const formatPercentage = (value: number): string =>
  new Intl.NumberFormat("ar-EG", { style: "percent", minimumFractionDigits: 0 }).format(value / 100);

// ============================================================
// Dates & Time
// ============================================================

export const formatDate = (date: string | Date): string => {
  const d = safeDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
};

export const formatDateShort = (date: string | Date): string => {
  const d = safeDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

export const formatTime = (date: string | Date): string => {
  const d = safeDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = safeDate(date);
  if (!d) return "—";
  return `${formatDate(d)}، ${formatTime(d)}`;
};

// ============================================================
// Relative Time (lightweight, used everywhere)
// ============================================================

export const getRelativeTime = (timestamp: string | Date | null | undefined): string => {
  const d = safeDate(timestamp);
  if (!d) return "—";

  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return "الآن";
  if (seconds < 60) return `منذ ${seconds} ث`;
  if (minutes === 1) return "منذ دقيقة";
  if (minutes < 60) return `منذ ${minutes} د`;
  if (hours === 1) return "منذ ساعة";
  if (hours < 24) return `منذ ${hours} س`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} يوم`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسبوع`;
  return formatDate(d);
};

// ============================================================
// Order Status Labels
// ============================================================

export const orderStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  preparing: "قيد التحضير",
  ready: "جاهز",
  picked_up: "في الطريق",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export const getOrderStatusLabel = (status: string): string =>
  orderStatusLabels[status] ?? status;

// ============================================================
// Preparation & Delivery Time
// ============================================================

export const formatPreparationTime = (minutes: number): string => {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} ساعة` : `${h} ساعة و${m} دقيقة`;
  }
  return `${minutes} دقيقة`;
};

export const formatDeliveryTimeRange = (min: number, max: number): string =>
  `${min}-${max} دقيقة`;

// ============================================================
// Text Helpers
// ============================================================

export const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}...`;

// ============================================================
// Working Hours Display
// ============================================================

export const formatWorkingHours = (open: string, close: string): string => {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "م" : "ص";
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  };
  return `${fmt(open)} - ${fmt(close)}`;
};
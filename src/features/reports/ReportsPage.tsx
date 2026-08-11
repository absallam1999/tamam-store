import { useState } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency } from "@shared/utils/formatters";
import {
  useStoreReports,
  type ReportPeriod,
} from "@shared/hooks/useStoreReports";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "التقارير والتحليلات", en: "Reports & Analytics" },
  subtitle: {
    ar: "تحليل أداء متجرك واتخاذ قرارات مبنية على البيانات",
    en: "Analyze your store performance and make data-driven decisions",
  },
  today: { ar: "اليوم", en: "Today" },
  yesterday: { ar: "الأمس", en: "Yesterday" },
  thisWeek: { ar: "هذا الأسبوع", en: "This Week" },
  lastWeek: { ar: "الأسبوع الماضي", en: "Last Week" },
  thisMonth: { ar: "هذا الشهر", en: "This Month" },
  lastMonth: { ar: "الشهر الماضي", en: "Last Month" },
  thisQuarter: { ar: "هذا الربع", en: "This Quarter" },
  thisYear: { ar: "هذه السنة", en: "This Year" },
  totalRevenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
  totalOrders: { ar: "إجمالي الطلبات", en: "Total Orders" },
  totalProducts: { ar: "إجمالي المنتجات", en: "Total Products" },
  completionRate: { ar: "نسبة الإكمال", en: "Completion Rate" },
  cancellationRate: { ar: "نسبة الإلغاء", en: "Cancellation Rate" },
  revenueOverTime: { ar: "الإيرادات خلال الفترة", en: "Revenue Over Time" },
  ordersByStatus: { ar: "الطلبات حسب الحالة", en: "Orders by Status" },
  topProducts: { ar: "أفضل المنتجات مبيعاً", en: "Top Selling Products" },
  ordersByHour: { ar: "الطلبات حسب الساعة", en: "Orders by Hour" },
  ordersByDay: { ar: "الطلبات حسب اليوم", en: "Orders by Day" },
  product: { ar: "المنتج", en: "Product" },
  sold: { ar: "المبيعات", en: "Sold" },
  revenue: { ar: "الإيرادات", en: "Revenue" },
  trend: { ar: "التغير", en: "Trend" },
  downloadPDF: { ar: "تحميل PDF", en: "Download PDF" },
  downloading: { ar: "جاري التحميل...", en: "Downloading..." },
  noData: { ar: "لا توجد بيانات كافية", en: "Not enough data" },
  noDataDesc: {
    ar: "ستظهر التقارير هنا عند توفر بيانات كافية",
    en: "Reports will appear here when enough data is available",
  },
  storeReport: { ar: "تقرير المتجر", en: "Store Report" },
  generatedOn: { ar: "تاريخ التقرير", en: "Generated On" },
  period: { ar: "الفترة", en: "Period" },
  summary: { ar: "ملخص", en: "Summary" },
};

const periodLabels: Record<ReportPeriod, { ar: string; en: string }> = {
  today: { ar: t.today.ar, en: t.today.en },
  yesterday: { ar: t.yesterday.ar, en: t.yesterday.en },
  this_week: { ar: t.thisWeek.ar, en: t.thisWeek.en },
  last_week: { ar: t.lastWeek.ar, en: t.lastWeek.en },
  this_month: { ar: t.thisMonth.ar, en: t.thisMonth.en },
  last_month: { ar: t.lastMonth.ar, en: t.lastMonth.en },
  this_quarter: { ar: t.thisQuarter.ar, en: t.thisQuarter.en },
  this_year: { ar: t.thisYear.ar, en: t.thisYear.en },
};

// ============================================
// Inline SVG Icons
// ============================================

const Icon = {
  revenue: (cls = "w-5 h-5") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  ),
  orders: (cls = "w-5 h-5") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
      />
    </svg>
  ),
  products: (cls = "w-5 h-5") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  ),
  check: (cls = "w-5 h-5") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  ),
  cancel: (cls = "w-5 h-5") => (
    <svg
      className={cls}
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
  ),
  download: (cls = "w-5 h-5") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  ),
  emptyChart: (cls = "w-10 h-10") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v18h18M7 16l4-4 4 4 4-4"
      />
    </svg>
  ),
  emptyBar: (cls = "w-10 h-10") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  clock: (cls = "w-10 h-10") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  calendar: (cls = "w-10 h-10") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  ),
  report: (cls = "w-10 h-10") => (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  ),
};

// ============================================
// PDF Download Helper
// ============================================

const downloadPDF = (reportData: any, periodLabel: string, isAr: boolean) => {
  const now = new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const htmlContent = `<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="UTF-8"><title>${lang(t.storeReport)} - ${periodLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; max-width: 900px; margin: auto; }
  h1 { font-size: 28px; margin-bottom: 8px; color: #111; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
  .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: #f8f8f8; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
  .stat-card .label { font-size: 11px; color: #888; margin-bottom: 8px; text-transform: uppercase; }
  .stat-card .value { font-size: 24px; font-weight: 700; color: #111; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f8f8f8; padding: 12px 16px; text-align: ${isAr ? "right" : "left"}; font-size: 12px; color: #888; border-bottom: 2px solid #e5e5e5; }
  td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
  .section { margin-bottom: 32px; }
  .section h3 { font-size: 18px; margin-bottom: 16px; color: #111; padding-bottom: 8px; border-bottom: 2px solid #6366f1; }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .bar-label { width: 100px; font-size: 12px; color: #666; }
  .bar-track { flex: 1; height: 24px; background: #eee; border-radius: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 8px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-size: 11px; font-weight: 500; }
  .bar-value { width: 80px; font-size: 13px; font-weight: 600; color: #111; }
  .trend-up { color: #16a34a; font-weight: 600; }
  .trend-down { color: #dc2626; font-weight: 600; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 2px solid #e5e5e5; font-size: 11px; color: #999; text-align: center; }
</style></head>
<body>
  <h1>${lang(t.storeReport)}</h1>
  <p class="subtitle">${lang(t.period)}: ${periodLabel} &bull; ${lang(t.generatedOn)}: ${now}</p>
  <div class="section"><h3>${lang(t.summary)}</h3>
    <div class="stats">
      <div class="stat-card"><span class="label">${lang(t.totalRevenue)}</span><div class="value">${formatCurrency(reportData.summary.totalRevenue)}</div></div>
      <div class="stat-card"><span class="label">${lang(t.totalOrders)}</span><div class="value">${reportData.summary.totalOrders}</div></div>
      <div class="stat-card"><span class="label">${lang(t.completionRate)}</span><div class="value">${reportData.summary.completionRate}%</div></div>
      <div class="stat-card"><span class="label">${lang(t.cancellationRate)}</span><div class="value">${reportData.summary.cancellationRate}%</div></div>
    </div>
  </div>
  <div class="section"><h3>${lang(t.revenueOverTime)}</h3>
    ${reportData.revenueChart
      .map((p: any) => {
        const maxRev = Math.max(
          ...reportData.revenueChart.map((d: any) => d.revenue),
          1,
        );
        return `<div class="bar-row"><span class="bar-label">${p.label}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, (p.revenue / maxRev) * 100)}%; background:#6366f1;">${p.orders > 0 ? p.orders + " " + (isAr ? "طلب" : "ord") : ""}</div></div><span class="bar-value">${formatCurrency(p.revenue)}</span></div>`;
      })
      .join("")}
  </div>
  <div class="section"><h3>${lang(t.topProducts)}</h3>
    <table><thead><tr><th>${lang(t.product)}</th><th>${lang(t.sold)}</th><th>${lang(t.revenue)}</th><th>${lang(t.trend)}</th></tr></thead>
    <tbody>${reportData.topProducts.map((p: any) => `<tr><td>${isAr ? p.nameAr : p.nameEn || p.name}</td><td>${p.totalSold}</td><td>${formatCurrency(p.totalRevenue)}</td><td class="${p.trend >= 0 ? "trend-up" : "trend-down"}">${p.trend >= 0 ? "+" : ""}${p.trend}%</td></tr>`).join("")}</tbody></table>
  </div>
  <div class="footer">Tamam Store Dashboard &bull; ${now}</div>
</body></html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
};

// ============================================
// Reusable Sub-Components
// ============================================

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden",
      className,
    )}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 sm:px-5 py-2.5 sm:py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between gap-2">
    {children}
  </div>
);

const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn("p-3 sm:p-5", className)}>{children}</div>;

const ChartTitle: React.FC<{ title: string; badge?: React.ReactNode }> = ({
  title,
  badge,
}) => (
  <div className="flex items-center justify-between mb-3 sm:mb-5">
    <h3 className="text-sm sm:text-base font-semibold text-surface-900 dark:text-white">
      {title}
    </h3>
    {badge}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 sm:py-1 rounded-md font-medium">
    {children}
  </span>
);

const EmptyState: React.FC<{ icon: React.ReactNode; message: string }> = ({
  icon,
  message,
}) => (
  <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-surface-400 dark:text-surface-500 h-full w-full">
    <div className="opacity-40 mb-3">{icon}</div>
    <p className="text-xs sm:text-sm">{message}</p>
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  isPrimary?: boolean;
}> = ({ label, value, icon, colorClass, isPrimary }) => (
  <Card className={cn(isPrimary ? "col-span-2 sm:col-span-1" : "")}>
    <CardBody className="!p-2.5 sm:!p-5 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-sm font-medium text-surface-500 dark:text-surface-400 leading-snug line-clamp-2">
          {label}
        </p>
        <div
          className={cn(
            "w-7 h-7 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            colorClass,
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-base sm:text-xl lg:text-2xl font-bold text-surface-900 dark:text-white truncate w-full">
        {value}
      </p>
    </CardBody>
  </Card>
);

// ============================================
// Chart Row Component (reusable, with horizontal scroll)
// ============================================

interface ChartRowProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  secondaryValue?: number;
  showSecondary?: boolean;
  isAr: boolean;
  formatValue?: (val: number) => string;
  labelWidth?: string;
  valueWidth?: string;
  barHeight?: string;
}

const ChartRow: React.FC<ChartRowProps> = ({
  label,
  value,
  maxValue,
  color = "#6366f1",
  secondaryValue,
  showSecondary = false,
  isAr,
  formatValue = (v) => String(v),
  labelWidth = "w-12 sm:w-16",
  valueWidth = "w-[60px] sm:w-[90px]",
  barHeight = "h-5 sm:h-6",
}) => {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5 sm:gap-3 w-full min-w-[280px] sm:min-w-0">
      <span
        className={cn(
          "text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 flex-shrink-0 truncate text-start",
          labelWidth,
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "flex-1 bg-surface-100 dark:bg-surface-800 rounded-lg overflow-hidden min-w-[40px]",
          barHeight,
        )}
      >
        <div
          className="h-full rounded-lg flex items-center justify-end px-1.5 sm:px-2 transition-all duration-700"
          style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }}
        >
          {showSecondary &&
            secondaryValue !== undefined &&
            secondaryValue > 0 &&
            pct > 15 && (
              <span className="text-[7px] sm:text-[10px] text-white/90 font-medium whitespace-nowrap">
                {secondaryValue}
              </span>
            )}
        </div>
      </div>
      <span
        className={cn(
          "text-[10px] sm:text-xs font-semibold text-surface-700 dark:text-surface-300 text-end flex-shrink-0 truncate",
          valueWidth,
        )}
      >
        {formatValue(value)}
      </span>
    </div>
  );
};

// ============================================
// ReportsPage Component
// ============================================

export const ReportsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [selectedPeriod, setSelectedPeriod] =
    useState<ReportPeriod>("this_month");
  const [isDownloading, setIsDownloading] = useState(false);
  const { reportData, isLoading } = useStoreReports(selectedPeriod);

  const handleDownloadPDF = () => {
    if (!reportData) return;
    setIsDownloading(true);
    try {
      const periodLabel = isAr
        ? periodLabels[selectedPeriod].ar
        : periodLabels[selectedPeriod].en;
      downloadPDF(reportData, periodLabel, isAr);
      toast.success(
        isAr ? "تم فتح التقرير للطباعة" : "Report opened for printing",
      );
    } catch {
      toast.error(isAr ? "فشل تحميل التقرير" : "Failed to download report");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading && !reportData) {
    return (
      <div
        className="space-y-4 sm:space-y-6 animate-fade-in w-full px-2 sm:px-0"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="skeleton h-8 w-44 rounded-lg" />
            <div className="skeleton h-4 w-56 rounded-lg" />
          </div>
          <div className="skeleton h-10 w-full sm:w-32 rounded-xl" />
        </div>
        <div className="flex gap-2 overflow-x-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-9 w-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-24 sm:h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-0" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col space-y-3 sm:space-y-6 pb-6 sm:pb-12">
        {/* ========== HEADER + BUTTON ========== */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-surface-900 dark:text-white">
              {lang(t.title)}
            </h1>
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5 sm:mt-1">
              {lang(t.subtitle)}
            </p>
          </div>
          {reportData && (
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-medium transition-colors",
                "px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-sm",
                "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white",
                "w-full sm:w-auto max-w-[140px] sm:max-w-none",
                "disabled:opacity-50 flex-shrink-0",
              )}
            >
              {Icon.download("w-3.5 h-3.5 sm:w-5 sm:h-5")}
              <span>
                {isDownloading ? lang(t.downloading) : lang(t.downloadPDF)}
              </span>
            </button>
          )}
        </div>

        {/* ========== PERIOD SELECTOR ========== */}
        <div className="relative w-full">
          <div className="overflow-x-auto pb-1.5 sm:pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-1.5 sm:gap-2 w-max px-0.5 sm:px-1">
              {(Object.keys(periodLabels) as ReportPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    "px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl",
                    "text-[9px] sm:text-sm font-medium",
                    "whitespace-nowrap transition-all duration-200",
                    selectedPeriod === period
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700",
                  )}
                >
                  {isAr ? periodLabels[period].ar : periodLabels[period].en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ========== CONTENT ========== */}
        {reportData ? (
          <>
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 w-full">
              <StatCard
                isPrimary
                label={lang(t.totalRevenue)}
                value={formatCurrency(reportData.summary.totalRevenue)}
                icon={Icon.revenue()}
                colorClass="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label={lang(t.totalOrders)}
                value={reportData.summary.totalOrders}
                icon={Icon.orders()}
                colorClass="bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
              />
              <StatCard
                label={lang(t.totalProducts)}
                value={reportData.summary.totalProducts}
                icon={Icon.products()}
                colorClass="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label={lang(t.completionRate)}
                value={`${reportData.summary.completionRate}%`}
                icon={Icon.check()}
                colorClass="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label={lang(t.cancellationRate)}
                value={`${reportData.summary.cancellationRate}%`}
                icon={Icon.cancel()}
                colorClass="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
              />
            </div>

            {/* CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 w-full">
              {/* REVENUE OVER TIME */}
              <Card>
                <CardBody>
                  <ChartTitle
                    title={lang(t.revenueOverTime)}
                    badge={<Badge>{isAr ? "ج.م" : "EGP"}</Badge>}
                  />
                  {reportData.revenueChart.length > 0 ? (
                    <div className="flex flex-col gap-2 sm:gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {reportData.revenueChart.map((item: any, idx: number) => {
                        const maxVal = Math.max(
                          ...reportData.revenueChart.map((d: any) => d.revenue),
                          1,
                        );
                        return (
                          <ChartRow
                            key={idx}
                            label={item.label}
                            value={item.revenue}
                            maxValue={maxVal}
                            color="#6366f1"
                            secondaryValue={item.orders}
                            showSecondary
                            isAr={isAr}
                            formatValue={(v) => formatCurrency(v)}
                            labelWidth="w-10 sm:w-16"
                            valueWidth="w-[55px] sm:w-[90px]"
                            barHeight="h-4 sm:h-6"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Icon.emptyChart()}
                      message={lang(t.noData)}
                    />
                  )}
                </CardBody>
              </Card>

              {/* ORDERS BY STATUS */}
              <Card>
                <CardBody>
                  <ChartTitle
                    title={lang(t.ordersByStatus)}
                    badge={
                      <div className="flex items-center gap-1">
                        {reportData.orderStatusBreakdown
                          .slice(0, 3)
                          .map((s: any) => (
                            <span
                              key={s.label}
                              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                          ))}
                      </div>
                    }
                  />
                  {reportData.orderStatusBreakdown.length > 0 ? (
                    <div className="flex flex-col gap-2 sm:gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {reportData.orderStatusBreakdown.map(
                        (item: any, idx: number) => {
                          const maxVal = Math.max(
                            ...reportData.orderStatusBreakdown.map(
                              (d: any) => d.count,
                            ),
                            1,
                          );
                          return (
                            <ChartRow
                              key={idx}
                              label={item.label}
                              value={item.count}
                              maxValue={maxVal}
                              color={item.color}
                              isAr={isAr}
                              labelWidth="w-14 sm:w-28"
                              valueWidth="w-6 sm:w-10"
                              barHeight="h-4 sm:h-6"
                            />
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Icon.emptyBar()}
                      message={lang(t.noData)}
                    />
                  )}
                </CardBody>
              </Card>

              {/* ORDERS BY HOUR - Vertical (3-hour quarters) */}
              <Card className="flex flex-col h-[280px] sm:h-[400px]">
                <CardBody className="flex flex-col flex-1 min-h-0 !pb-1.5 sm:!pb-2">
                  <ChartTitle
                    title={lang(t.ordersByHour)}
                    badge={
                      <span className="text-[10px] sm:text-xs text-surface-400">
                        {isAr ? "أربع ساعات" : "4-hour"}
                      </span>
                    }
                  />
                  {reportData.ordersByHour.length > 0 ? (
                    <div className="flex-1 overflow-y-auto overflow-x-auto px-0.5 sm:px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <div className="flex items-end gap-1 sm:gap-1.5 h-full min-h-[180px] sm:min-h-[250px]">
                        {/* Group hours into 3-hour quarters */}
                        {(() => {
                          interface Quarter {
                            startHour: number;
                            endHour: number;
                            count: number;
                            avgCount: number;
                            label: string;
                            shortLabel: string;
                          }

                          const quarters: Quarter[] = [];
                          for (let i = 0; i < 24; i += 3) {
                            const hourGroup = reportData.ordersByHour.filter(
                              (h: any) => h.hour >= i && h.hour < i + 3,
                            );
                            const totalCount = hourGroup.reduce(
                              (sum: number, h: any) => sum + h.count,
                              0,
                            );
                            const avgCount = Math.round(
                              totalCount / (hourGroup.length || 1),
                            );
                            quarters.push({
                              startHour: i,
                              endHour: i + 3,
                              count: totalCount,
                              avgCount: avgCount,
                              label: `${String(i).padStart(2, "0")}:00 - ${String(i + 3).padStart(2, "0")}:00`,
                              shortLabel: `${String(i).padStart(2, "0")} - ${String(i + 3).padStart(2, "0")}`,
                            });
                          }

                          const maxVal = Math.max(
                            ...quarters.map((q) => q.count),
                            1,
                          );

                          return quarters.map((quarter, idx) => {
                            const heightPercent =
                              (quarter.count / maxVal) * 100;
                            const isPeak =
                              quarter.count ===
                                Math.max(...quarters.map((q) => q.count)) &&
                              quarter.count > 0;

                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center justify-end min-w-[28px] sm:min-w-[40px]"
                              >
                                {/* Bar */}
                                <div
                                  className="w-full rounded-t-lg transition-all duration-700"
                                  style={{
                                    height: `${Math.max(heightPercent, 2)}%`,
                                    backgroundColor: isPeak
                                      ? "#6366f1"
                                      : quarter.count > 0
                                        ? "#3B82F6"
                                        : "#e5e7eb",
                                    minHeight:
                                      quarter.count > 0 ? "4px" : "0px",
                                    opacity: quarter.count > 0 ? 1 : 0.3,
                                  }}
                                />
                                {/* Value */}
                                {quarter.count > 0 && (
                                  <span className="text-[8px] sm:text-[10px] font-semibold text-surface-600 dark:text-surface-400 mt-1">
                                    {quarter.count}
                                  </span>
                                )}
                                {/* Label */}
                                <span className="text-[6px] sm:text-[9px] text-surface-400 dark:text-surface-500 mt-0.5 whitespace-nowrap">
                                  {isAr
                                    ? `${String(quarter.startHour).padStart(2, "0")} - ${String(quarter.endHour).padStart(2, "0")}`
                                    : quarter.shortLabel}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={Icon.clock()} message={lang(t.noData)} />
                  )}
                </CardBody>
              </Card>

              {/* ORDERS BY DAY */}
              <Card className="flex flex-col h-[280px] sm:h-[400px]">
                <CardBody className="flex flex-col flex-1 min-h-0 !pb-1.5 sm:!pb-2">
                  <ChartTitle
                    title={lang(t.ordersByDay)}
                    badge={<Badge>{isAr ? "أسبوعي" : "Weekly"}</Badge>}
                  />
                  {reportData.ordersByDay.length > 0 ? (
                    <div className="flex-1 overflow-y-auto overflow-x-auto space-y-1.5 sm:space-y-2 pr-0.5 sm:pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {reportData.ordersByDay.map((d: any, i: number) => {
                        const maxVal = Math.max(
                          ...reportData.ordersByDay.map(
                            (item: any) => item.count,
                          ),
                          1,
                        );
                        return (
                          <ChartRow
                            key={i}
                            label={d.day}
                            value={d.count}
                            maxValue={maxVal}
                            color="#8B5CF6"
                            isAr={isAr}
                            labelWidth="w-10 sm:w-20"
                            valueWidth="w-5 sm:w-8"
                            barHeight="h-3 sm:h-4"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Icon.calendar()}
                      message={lang(t.noData)}
                    />
                  )}
                </CardBody>
              </Card>
            </div>

            {/* TOP PRODUCTS */}
            {reportData.topProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-sm sm:text-base font-semibold text-surface-900 dark:text-white">
                    {lang(t.topProducts)}
                  </h3>
                </CardHeader>

                {/* MOBILE VIEW */}
                <div className="md:hidden flex flex-col divide-y divide-surface-100 dark:divide-surface-800">
                  {reportData.topProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="px-3 py-2.5 sm:p-4 flex items-center justify-between gap-2 w-full"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            Icon.products(
                              "w-4 h-4 sm:w-5 sm:h-5 text-surface-400",
                            )
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-surface-900 dark:text-white truncate">
                            {isAr
                              ? product.nameAr
                              : product.nameEn || product.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-surface-500">
                            {product.totalSold} {lang(t.sold)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <p className="text-xs sm:text-sm font-bold text-surface-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(product.totalRevenue)}
                        </p>
                        <span
                          className={cn(
                            "text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-md mt-0.5",
                            product.trend >= 0
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
                          )}
                        >
                          {product.trend >= 0 ? "+" : ""}
                          {product.trend}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden md:block w-full overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 dark:bg-surface-800/50">
                        {[
                          lang(t.product),
                          lang(t.sold),
                          lang(t.revenue),
                          lang(t.trend),
                        ].map((h, i) => (
                          <th
                            key={i}
                            className={cn(
                              "py-3 px-5 font-semibold text-xs text-surface-500 uppercase tracking-wide",
                              isAr ? "text-right" : "text-left",
                            )}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                      {reportData.topProducts.map((product: any) => (
                        <tr
                          key={product.id}
                          className="hover:bg-surface-50 dark:hover:bg-surface-800/30"
                        >
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  Icon.products("w-5 h-5 text-surface-400")
                                )}
                              </div>
                              <span className="font-medium text-surface-900 dark:text-white truncate max-w-[200px]">
                                {isAr
                                  ? product.nameAr
                                  : product.nameEn || product.name}
                              </span>
                            </div>
                          </td>
                          <td
                            className={cn(
                              "py-3 px-5 text-surface-600 dark:text-surface-400",
                              isAr ? "text-right" : "text-left",
                            )}
                          >
                            {product.totalSold}
                          </td>
                          <td
                            className={cn(
                              "py-3 px-5 font-semibold text-surface-900 dark:text-white",
                              isAr ? "text-right" : "text-left",
                            )}
                          >
                            {formatCurrency(product.totalRevenue)}
                          </td>
                          <td
                            className={cn(
                              "py-3 px-5",
                              isAr ? "text-right" : "text-left",
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold",
                                product.trend >= 0
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                  : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
                              )}
                            >
                              {product.trend >= 0 ? "+" : ""}
                              {product.trend}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-32 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 w-full">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-4 sm:mb-6">
              {Icon.report("w-8 h-8 sm:w-10 sm:h-10 text-surface-400")}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-white mb-1 sm:mb-2">
              {lang(t.noData)}
            </h3>
            <p className="text-xs sm:text-sm text-surface-500 max-w-sm px-4 sm:px-6 text-center">
              {lang(t.noDataDesc)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

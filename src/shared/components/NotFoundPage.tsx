import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useTheme } from "@app/providers/ThemeProvider";
import { cn } from "@shared/utils/cn";

/**
 * NotFoundPage — Premium Bilingual 404 Error Page
 */

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "الصفحة غير موجودة", en: "Page Not Found" },
  description: {
    ar: "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    en: "Sorry, the page you're looking for doesn't exist or has been moved.",
  },
  errorCode: { ar: "خطأ ٤٠٤", en: "Error 404" },
  suggestions: { ar: "ربما تبحث عن:", en: "You might be looking for:" },
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  goBack: { ar: "العودة للخلف", en: "Go Back" },
  signIn: { ar: "تسجيل الدخول", en: "Sign In" },
  orders: { ar: "الطلبات", en: "Orders" },
  products: { ar: "المنتجات", en: "Products" },
  settings: { ar: "الإعدادات", en: "Settings" },
  menu: { ar: "قائمة الطعام", en: "Menu" },
  wallet: { ar: "المحفظة", en: "Wallet" },
  needHelp: { ar: "هل تحتاج مساعدة؟", en: "Need help?" },
  contactSupport: { ar: "تواصل مع الدعم الفني", en: "Contact Support" },
  or: { ar: "أو", en: "or" },
};

// ============================================
// Quick Links
// ============================================

const quickLinks = [
  {
    to: "/dashboard",
    labelAr: t.dashboard.ar,
    labelEn: t.dashboard.en,
    icon: (
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
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/orders",
    labelAr: t.orders.ar,
    labelEn: t.orders.en,
    icon: (
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
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/products",
    labelAr: t.products.ar,
    labelEn: t.products.en,
    icon: (
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
          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/menu",
    labelAr: t.menu.ar,
    labelEn: t.menu.en,
    icon: (
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
          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/wallet",
    labelAr: t.wallet.ar,
    labelEn: t.wallet.en,
    icon: (
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
          d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
        />
      </svg>
    ),
  },
  {
    to: "/dashboard/settings",
    labelAr: t.settings.ar,
    labelEn: t.settings.en,
    icon: (
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
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
];

// ============================================
// Main Component
// ============================================

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const { resolvedTheme } = useTheme();

  const isAr = currentLanguage === "ar";
  const isDark = resolvedTheme === "dark";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);
  const attemptedPath = location.pathname;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-surface-50 dark:bg-surface-950">
      <div className="w-full max-w-2xl">
        {/* ============================================ */}
        {/* Large 404 Display */}
        {/* ============================================ */}
        <div
          className="relative mb-8 sm:mb-10 select-none flex justify-center items-center h-48 sm:h-56"
          aria-hidden="true"
        >
          {/* Ambient Map Glow */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-primary-100/40 dark:bg-primary-900/20 blur-3xl" />
          </div>

          {/* Stylized Background Route/Map Pattern */}
          <svg
            className="absolute inset-0 w-full h-full -z-10 opacity-20 dark:opacity-[0.15]"
            viewBox="0 0 500 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dashed Route Path */}
            <path
              d="M 50,150 C 100,150 150,50 250,50 C 350,50 400,120 480,120"
              stroke="currentColor"
              className="text-primary-500 dark:text-primary-400"
              strokeWidth="2"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            {/* Route Nodes */}
            <circle
              cx="50"
              cy="150"
              r="4"
              fill="currentColor"
              className="text-surface-400 dark:text-surface-500"
            />
            <circle
              cx="150"
              cy="98"
              r="3"
              fill="currentColor"
              className="text-surface-300 dark:text-surface-600"
            />
            <circle
              cx="350"
              cy="85"
              r="3"
              fill="currentColor"
              className="text-surface-300 dark:text-surface-600"
            />
            <circle
              cx="480"
              cy="120"
              r="4"
              fill="currentColor"
              className="text-surface-400 dark:text-surface-500"
            />

            {/* Delivery/Map grid lines */}
            <line
              x1="0"
              y1="100"
              x2="500"
              y2="100"
              stroke="currentColor"
              className="text-surface-200 dark:text-surface-800"
              strokeWidth="1"
            />
            <line
              x1="250"
              y1="0"
              x2="250"
              y2="200"
              stroke="currentColor"
              className="text-surface-200 dark:text-surface-800"
              strokeWidth="1"
            />
          </svg>

          {/* Typography & Map Pin Graphic */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 relative">
            {/* Number 4 */}
            <span className="text-[100px] sm:text-[140px] md:text-[160px] font-black leading-none tracking-tighter bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent dark:from-primary-300 dark:via-primary-400 dark:to-emerald-400 drop-shadow-sm">
              4
            </span>

            {/* Map Pin as "0" */}
            <div className="relative flex flex-col items-center justify-end h-[100px] sm:h-[140px] md:h-[160px] w-[80px] sm:w-[110px]">
              <div
                className="absolute top-0 w-20 h-20 sm:w-28 sm:h-28 text-primary-500 dark:text-primary-400 animate-bounce"
                style={{ animationDuration: "2s" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full drop-shadow-lg"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {/* Pin Drop Shadow / Pulse */}
              <div
                className="absolute bottom-2 w-10 h-2 sm:w-14 sm:h-3 bg-surface-900/10 dark:bg-surface-900/40 rounded-[100%] blur-sm animate-pulse"
                style={{ animationDuration: "2s" }}
              />
            </div>

            {/* Number 4 */}
            <span className="text-[100px] sm:text-[140px] md:text-[160px] font-black leading-none tracking-tighter bg-gradient-to-br from-emerald-500 via-primary-500 to-primary-400 bg-clip-text text-transparent dark:from-emerald-400 dark:via-primary-400 dark:to-primary-300 drop-shadow-sm">
              4
            </span>
          </div>
        </div>

        {/* ============================================ */}
        {/* Content Card */}
        {/* ============================================ */}
        <div className="glass glass-elevated p-6 sm:p-8 md:p-10 rounded-3xl animate-fade-in-up stagger-2 shadow-xl">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-surface-100 dark:bg-surface-800/80 flex items-center justify-center mx-auto mb-5 sm:mb-6 ring-1 ring-surface-200 dark:ring-surface-700 shadow-sm">
            <svg
              className="w-8 h-8 sm:w-9 sm:h-9 text-surface-400 dark:text-surface-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 2v4m0 12v4M2 12h4m12 0h4" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.5 14.5 4 4"
                strokeWidth={2.5}
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3 text-center">
            {lang(t.title)}
          </h1>
          <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400 mb-6 leading-relaxed text-center max-w-lg mx-auto">
            {lang(t.description)}
          </p>
          {attemptedPath && attemptedPath !== "/" && (
            <div className="flex justify-center mb-6">
              <div
                className={cn(
                  "inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm",
                  isAr ? "flex-row-reverse" : "flex-row",
                )}
              >
                <svg
                  className="w-4 h-4 text-surface-400 dark:text-surface-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
                <code className="text-sm font-mono font-medium text-surface-600 dark:text-surface-400 break-all">
                  {attemptedPath}
                </code>
              </div>
            </div>
          )}
          <div className="mb-8">
            <p className="text-start text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-3">
              {lang(t.suggestions)}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickLinks.map((link, idx) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl transition-all duration-200 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 text-sm font-medium group stagger-" +
                      (idx + 1),
                    isAr ? "flex-row-reverse text-right" : "flex-row text-left",
                  )}
                >
                  <span className="text-primary-500 dark:text-primary-400 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                    {link.icon}
                  </span>
                  <span className="truncate">
                    {isAr ? link.labelAr : link.labelEn}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
            <span className="text-xs text-surface-400 dark:text-surface-500 font-medium">
              {lang(t.or)}
            </span>
            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
          </div>
          <div className="text-center">
            <a
              href="https://tamaam.cloud/contact"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 group border border-surface-200 dark:border-surface-700",
              )}
            >
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
              <span>{lang(t.needHelp)}</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400 group-hover:underline underline-offset-2">
                {lang(t.contactSupport)}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useTheme } from "@app/providers/ThemeProvider";
import { useLanguage } from "@shared/hooks/useLanguage";
import { LanguageSwitcher } from "@shared/components/LanguageSwitcher";
import { PageLoader } from "@shared/components/PageLoader";
import { cn } from "@shared/utils/cn";

/**
 * AuthLayout — Premium Bilingual
 */

// ============================================
// Types
// ============================================

interface RouteContent {
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: (isAr: boolean) => ReactNode;
}

interface LastSession {
  device: string;
  browser: string;
  location: string;
  time: string;
  ip: string;
}

// ============================================
// Route Configuration
// ============================================

const routeContent: Record<string, RouteContent> = {
  "/auth/login": {
    taglineAr: "مرحباً بعودتك",
    taglineEn: "Welcome Back",
    descriptionAr: "أدخل رقم هاتفك وكلمة المرور للدخول إلى منصة تحكم المتجر.",
    descriptionEn:
      "Enter your phone number and password to access your store dashboard.",
    icon: (isAr: boolean) => (
      <svg
        className={cn("w-6 h-6", isAr && "scale-x-[-1]")}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
        />
      </svg>
    ),
  },
  "/auth/signup": {
    taglineAr: "ابدأ رحلتك",
    taglineEn: "Start Your Journey",
    descriptionAr: "أنشئ متجرك الإلكتروني وابدأ في بيع منتجاتك اليوم.",
    descriptionEn:
      "Create your online store and start selling your products today.",
    icon: (_isAr: boolean) => (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
        />
      </svg>
    ),
  },
  "/auth/forgot-password": {
    taglineAr: "استعادة كلمة المرور",
    taglineEn: "Reset Password",
    descriptionAr:
      "لا تقلق! أدخل رقم هاتفك المسجل في نظامنا وسنرسل لك رسالة خاصة بكود التفعيل.",
    descriptionEn:
      "No worries! Enter your phone number and we'll send you a verification code.",
    icon: (_isAr: boolean) => (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
    ),
  },
  "/auth/reset-password": {
    taglineAr: "تعيين كلمة مرور جديدة",
    taglineEn: "Set New Password",
    descriptionAr: "اختر كلمة مرور قوية وآمنة لحماية حساب متجرك.",
    descriptionEn:
      "Choose a strong, secure password to protect your store account.",
    icon: (_isAr: boolean) => (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
};

// ============================================
// Features List
// ============================================

const features = [
  {
    titleAr: "تقارير فورية",
    titleEn: "Real-time Reports",
    descriptionAr: "متابعة المبيعات والأرباح",
    descriptionEn: "Track sales and revenue",
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
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
  {
    titleAr: "إدارة ذكية",
    titleEn: "Smart Management",
    descriptionAr: "تحكم كامل في المخزون",
    descriptionEn: "Full inventory control",
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
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
  {
    titleAr: "دعم فوري",
    titleEn: "Instant Support",
    descriptionAr: "مساعدة على مدار الساعة",
    descriptionEn: "24/7 customer support",
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
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
  },
];

const loginFeatures = [
  {
    titleAr: "تسجيل دخول آمن",
    titleEn: "Secure Login",
    descriptionAr: "رمز تحقق يستخدم لمرة واحدة",
    descriptionEn: "One-time verification code",
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
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
  {
    titleAr: "وصول فوري",
    titleEn: "Instant Access",
    descriptionAr: "لا حاجة لتذكر كلمة المرور",
    descriptionEn: "No password to remember",
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
  {
    titleAr: "حماية كاملة",
    titleEn: "Full Protection",
    descriptionAr: "تشفير من طرف إلى طرف",
    descriptionEn: "End-to-end encryption",
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
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
    ),
  },
];

// ============================================
// API Session Tracking
// ============================================

/**
 * Fetch the last session data from the API (if available).
 * Falls back to localStorage for backward compatibility.
 */
const getLastSession = async (): Promise<LastSession | null> => {
  try {
    // 1) Try the backend endpoint first (if you add one)
    // const response = await storeApi.getLastSession();
    // if (response) return mapSessionDto(response);

    // 2) Fallback to localStorage for now
    const saved = localStorage.getItem("last-session");
    if (saved) return JSON.parse(saved);
  } catch {
    // Silently fail — session info is purely informational
  }
  return null;
};

/**
 * Save session data after successful login.
 * Called from AuthProvider or the Login form itself.
 */
export const saveLastSession = (session: LastSession): void => {
  try {
    localStorage.setItem("last-session", JSON.stringify(session));
  } catch {
    // Storage full or unavailable — ignore
  }
};

// ============================================
// Session Info Component
// ============================================

const SessionInfo: React.FC<{ session: LastSession | null; isAr: boolean }> = ({
  session,
  isAr,
}) => {
  if (!session) return null;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (isAr) {
      if (hours > 24) return `منذ ${Math.floor(hours / 24)} يوم`;
      if (hours > 0) return `منذ ${hours} ساعة`;
      if (minutes > 0) return `منذ ${minutes} دقيقة`;
      return "الآن";
    }
    if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const sessionItems = [
    {
      labelAr: "الجهاز",
      labelEn: "Device",
      value: session.device || "Unknown",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
          />
        </svg>
      ),
    },
    {
      labelAr: "المتصفح",
      labelEn: "Browser",
      value: session.browser || "Unknown",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      ),
    },
    {
      labelAr: "الموقع",
      labelEn: "Location",
      value: session.location || "Unknown",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
      ),
    },
    {
      labelAr: "الوقت",
      labelEn: "Time",
      value: session.time ? timeAgo(session.time) : "N/A",
      icon: (
        <svg
          className="w-3.5 h-3.5"
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
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/50">
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
        <span className="text-xs font-semibold uppercase tracking-wider">
          {isAr ? "آخر جلسة دخول" : "Last Login Session"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {sessionItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "p-3 rounded-xl",
              "bg-white/8 backdrop-blur-sm",
              "border border-white/8",
              "hover:bg-white/12 transition-colors duration-200",
            )}
          >
            <p
              className={cn(
                "text-[10px] text-white/40 uppercase tracking-wider mb-1.5",
                isAr ? "text-right" : "text-left",
              )}
            >
              {isAr ? item.labelAr : item.labelEn}
            </p>
            <p
              className={cn(
                "text-sm font-medium text-white flex items-center gap-1.5",
              )}
            >
              <span className="text-white/50 flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.value}</span>
            </p>
          </div>
        ))}
      </div>

      {session.ip && (
        <div
          className={cn(
            "flex items-center gap-2 p-2.5 rounded-xl",
            "bg-white/5 border border-white/5",
          )}
        >
          <div className="w-2 h-2 rounded-full bg-success-400 shadow-lg shadow-success-400/50 animate-pulse-soft flex-shrink-0" />
          <p className="text-xs text-white/50 truncate">
            <span className="text-white/70 font-medium">IP:</span> {session.ip}
            <span className="mx-1.5 text-white/30">•</span>
            <span className="text-success-400/80 font-medium">
              {isAr ? "آمن" : "Secure"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Auth Footer Component
// ============================================

const AuthFooter: React.FC<{ isLogin: boolean; isAr: boolean }> = ({
  isLogin,
  isAr,
}) => {
  return (
    <div className="mt-6 text-center space-y-3">
      {isLogin ? (
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
          <Link
            to="/auth/signup"
            className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {isAr ? "إنشاء حساب جديد" : "Create one"}
          </Link>
        </p>
      ) : (
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
          <Link
            to="/auth/login"
            className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </p>
      )}

      <a
        href="https://tamaam.cloud/contact"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5",
          "text-xs text-surface-400 dark:text-surface-500",
          "hover:text-primary-600 dark:hover:text-primary-400",
          "transition-colors duration-200",
        )}
      >
        <svg
          className="w-3.5 h-3.5"
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
        {isAr ? "هل تحتاج مساعدة؟" : "Need help?"}
      </a>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { currentLanguage } = useLanguage();
  const location = useLocation();

  const isDark = resolvedTheme === "dark";
  const isAr = currentLanguage === "ar";
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const isLogin = location.pathname === "/auth/login";

  const content = routeContent[location.pathname] || {
    taglineAr: "لوحة تحكم المتجر",
    taglineEn: "Store Management Platform",
    descriptionAr: "تحكم كامل في متجرك، طلباتك، وأرباحك من مكان واحد.",
    descriptionEn:
      "Complete control over your store, orders, and revenue from one place.",
    icon: () => (
      <svg
        className="w-6 h-6"
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
  };

  useEffect(() => {
    if (isLogin) {
      getLastSession().then(setLastSession);
    }
  }, [isLogin]);

  if (isLoading) {
    return (
      <PageLoader
        message={isAr ? "جاري التحقق من الجلسة..." : "Verifying session..."}
      />
    );
  }

  if (
    isAuthenticated &&
    !["/auth/forgot-password", "/auth/reset-password"].includes(
      location.pathname,
    )
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-surface-50 dark:bg-surface-950 overflow-hidden">
      {/* Skip Link */}
      <a
        href="#auth-form"
        className={cn(
          "sr-only focus:not-sr-only",
          "absolute top-4 start-4 z-[60]",
          "px-4 py-2 rounded-xl",
          "bg-primary-600 text-white shadow-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "text-sm font-medium",
        )}
      >
        {isAr ? "تخطي إلى النموذج" : "Skip to form"}
      </a>

      {/* ============================================ */}
      {/* Left Panel — Brand Experience */}
      {/* ============================================ */}
      <div
        className={cn(
          "relative hidden lg:flex lg:w-[45%] xl:w-[42%]",
          "overflow-hidden items-center",
          "p-8 xl:p-12 2xl:p-16",
        )}
      >
        {/* Animated Background */}
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-700",
            isDark
              ? "bg-gradient-to-br from-surface-900 via-primary-950 to-surface-950"
              : "bg-gradient-to-br from-primary-600 via-primary-700 to-emerald-600",
          )}
        />

        {/* Subtle Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        {/* Glowing Orbs */}
        <div
          className={cn(
            "absolute -top-32 -end-32 w-96 h-96 rounded-full blur-[120px] animate-float",
            isDark ? "bg-primary-800/25" : "bg-white/8",
          )}
          aria-hidden="true"
        />

        <div
          className={cn(
            "absolute -bottom-40 -start-40 w-[450px] h-[450px] rounded-full blur-[120px]",
            isDark ? "bg-emerald-800/15" : "bg-emerald-300/12",
          )}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg">
          {/* Logo & Brand */}
          <div className="flex items-center gap-5 mb-12">
            <div
              className={cn(
                "w-16 h-16 xl:w-18 xl:h-18 rounded-2xl",
                "bg-white/12 backdrop-blur-md",
                "border border-white/15",
                "shadow-2xl shadow-black/15",
                "flex items-center justify-center flex-shrink-0",
                "transition-all duration-300 hover:scale-105 hover:bg-white/18",
                "ring-1 ring-white/10",
              )}
            >
              <img
                src="/icon.svg"
                alt="Tamaam Logo"
                className="w-9 h-9 xl:w-10 xl:h-10 drop-shadow-lg"
              />
            </div>

            <div className={isAr ? "text-right" : "text-left"}>
              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold tracking-tight leading-none text-white">
                {isAr ? "تطبيق تمام" : "Tamam App"}
              </h1>
              <p className="text-xs xl:text-sm text-white/55 mt-1.5 font-medium tracking-wider uppercase">
                {isAr ? "منصة تحكم المتجر" : "Store Control Platform"}
              </p>
            </div>
          </div>

          {/* Route Content */}
          <div className={cn("flex gap-4")}>
            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 xl:w-12 xl:h-12 rounded-xl flex-shrink-0 mt-0.5",
                "bg-white/12 backdrop-blur-sm",
                "border border-white/15",
                "flex items-center justify-center",
                "text-white/80",
              )}
            >
              {content.icon(isAr)}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-white leading-tight">
                {isAr ? content.taglineAr : content.taglineEn}
              </h2>
              <p className="text-sm xl:text-base text-white/65 leading-relaxed max-w-md mt-1.5">
                {isAr ? content.descriptionAr : content.descriptionEn}
              </p>
            </div>
          </div>

          {/* Session Info */}
          {isLogin && lastSession ? (
            <div className="mt-10 animate-fade-in-up stagger-2">
              <SessionInfo session={lastSession} isAr={isAr} />
            </div>
          ) : isLogin ? (
            <div className="mt-10 space-y-3 animate-fade-in-up stagger-2">
              {loginFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3.5 p-3.5 rounded-xl",
                    "bg-white/8 backdrop-blur-sm",
                    "border border-white/10",
                    "hover:bg-white/12 transition-colors duration-200",
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white/70">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {isAr ? feature.titleAr : feature.titleEn}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {isAr ? feature.descriptionAr : feature.descriptionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 space-y-3 animate-fade-in-up stagger-2">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3.5 p-3.5 rounded-xl",
                    "bg-white/8 backdrop-blur-sm",
                    "border border-white/10",
                    "hover:bg-white/12 transition-colors duration-200",
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white/70">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {isAr ? feature.titleAr : feature.titleEn}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {isAr ? feature.descriptionAr : feature.descriptionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Security Badge */}
          <div
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl mt-10",
              "bg-white/5 border border-white/8",
            )}
          >
            <svg
              className="w-4 h-4 text-success-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
            <p className="text-xs text-white/50">
              <span className="text-white/70 font-medium">256-bit</span>{" "}
              {isAr
                ? "تشفير SSL • بياناتك محمية"
                : "SSL Encryption • Your data is protected"}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Right Panel — Auth Form */}
      {/* ============================================ */}
      <div
        className={cn(
          "flex-1 flex flex-col items-center justify-center",
          "p-4 sm:p-6 lg:p-10 xl:p-16",
          "bg-surface-50 dark:bg-surface-950",
          "relative",
        )}
      >
        {/* Top Right Controls — Language + Theme Toggle */}
        <div className="absolute top-4 end-4 z-40 flex items-center gap-1.5">
          <LanguageSwitcher variant="navbar" className="shadow-sm" />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={cn(
              "p-2 rounded-xl transition-all duration-200 active:scale-95",
              "hover:bg-surface-100 dark:hover:bg-surface-800",
              "text-surface-500 dark:text-surface-400",
              "border border-surface-200 dark:border-surface-700",
            )}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg
                className="w-5 h-5 text-warning-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
              </svg>
            ) : (
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
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden w-full max-w-md mb-8 mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <img src="/icon.svg" alt="Tamam Logo" className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {isAr ? "تطبيق تمام" : "TamamApp"}
            </span>
          </Link>
          <p className="text-sm text-surface-500 dark:text-surface-400 px-4">
            {isAr ? content.descriptionAr : content.descriptionEn}
          </p>
        </div>

        {/* Form Container */}
        <div
          id="auth-form"
          className={cn(
            "w-full max-w-md lg:max-w-lg xl:max-w-xl",
            "animate-fade-in-up",
          )}
        >
          <Suspense
            fallback={
              <div
                className="p-8 sm:p-10 flex items-center justify-center min-h-[400px] rounded-2xl
                bg-white/80 dark:bg-surface-900/80
                backdrop-blur-xl border border-surface-200/50 dark:border-surface-800/50"
              >
                <PageLoader
                  variant="inline"
                  message={isAr ? "جاري التحميل..." : "Loading..."}
                />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>

        {/* Auth Footer */}
        <AuthFooter isLogin={isLogin} isAr={isAr} />

        {/* Copyright */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-surface-400 dark:text-surface-500">
            &copy; {new Date().getFullYear()} Tamam.{" "}
            {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

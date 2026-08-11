import { Suspense, useState, useEffect, useRef, type ReactNode } from "react";
import {
  Outlet,
  useLocation,
  Navigate,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useTheme } from "@app/providers/ThemeProvider";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useStore } from "@app/providers/StoreProvider";
import { LanguageSwitcher } from "@shared/components/LanguageSwitcher";
import { PageLoader } from "@shared/components/PageLoader";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { getRelativeTime } from "@shared/utils/formatters";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
} from "@shared/hooks/useStoreNotifications";
import { useStoreOrderStats } from "@shared/hooks/useStoreOrders";
import { useStoreOrders } from "@shared/hooks/useStoreOrders";
import { useSupportTickets } from "@shared/hooks/useStoreSupport";
import { NewOrderModal } from "@features/orders/NewOrderModal";
import {
  useAvailableStoreTypes,
  useAddStoreType,
} from "@shared/hooks/useStoreTypes";
import type { StoreOrderDto } from "@shared/types";

// ============================================
// Types
// ============================================

interface NavItem {
  to: string;
  labelAr: string;
  labelEn: string;
  icon: ReactNode;
  badge?: number;
  end?: boolean;
}

// ============================================
// Icon helper
// ============================================

const Icon: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <svg
    className={cn("w-5 h-5 flex-shrink-0", className)}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    {children}
  </svg>
);

// ============================================
// Navigation Items
// ============================================

const createMainNavItems = (
  pendingOrdersCount: number,
  supportTicketsCount: number,
): NavItem[] => [
  {
    to: "/dashboard",
    labelAr: "لوحة التحكم",
    labelEn: "Dashboard",
    end: true,
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/orders",
    labelAr: "الطلبات",
    labelEn: "Orders",
    badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/categories",
    labelAr: "التصنيفات",
    labelEn: "Categories",
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/menu",
    labelAr: "القائمة",
    labelEn: "Menu",
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/offers",
    labelAr: "العروض",
    labelEn: "Offers",
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/coupons",
    labelAr: "الكوبونات",
    labelEn: "Coupons",
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 6h.008v.008H6V6Z"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/wallet",
    labelAr: "المحفظة",
    labelEn: "Wallet",
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/support",
    labelAr: "الدعم الفنى",
    labelEn: "Technical Support",
    badge: supportTicketsCount > 0 ? supportTicketsCount : undefined,
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
        />
      </Icon>
    ),
  },
];

const createBottomNavItems = (unreadNotifications: number): NavItem[] => [
  {
    to: "/dashboard/notifications",
    labelAr: "الإشعارات",
    labelEn: "Notifications",
    badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/reports",
    labelAr: "التقارير",
    labelEn: "Reports",
    icon: (
      <Icon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </Icon>
    ),
  },
  {
    to: "/dashboard/settings",
    labelAr: "الإعدادات",
    labelEn: "Settings",
    icon: (
      <Icon>
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
      </Icon>
    ),
  },
];

// ============================================
// Sidebar
// ============================================

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const { store } = useStore();
  const { user } = useAuth();
  const isAr = currentLanguage === "ar";

  const { data: orderStats } = useStoreOrderStats();
  const { data: unreadData } = useUnreadCount();
  const { data: tickets = [] } = useSupportTickets();

  // Count open support tickets (not closed or resolved)
  const openSupportTickets = tickets.filter(
    (t) => t.status === "Open" || t.status === "InProgress",
  ).length;

  const pendingOrdersCount = orderStats?.pendingOrders ?? 0;
  const unreadNotifications = unreadData ?? 0;

  const mainNavItems = createMainNavItems(
    pendingOrdersCount,
    openSupportTickets,
  );
  const bottomNavItems = createBottomNavItems(unreadNotifications);

  const ownerName = user?.fullName || (isAr ? "صاحب المتجر" : "Store Owner");
  const ownerInitial = ownerName?.charAt(0) || "م";

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, mobileOpen, setCollapsed, setMobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const getLabel = (item: NavItem) => (isAr ? item.labelAr : item.labelEn);

  const handleLogoClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Helper to determine indicator color based on nav item
  const getIndicatorColor = (to: string): string => {
    if (to === "/dashboard/orders") return "bg-warning-500";
    if (to === "/dashboard/notifications") return "bg-error-500";
    if (to === "/dashboard/support") return "bg-primary-500";
    return "bg-primary-500";
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed top-0 h-full z-50 flex flex-col",
          "bg-surface-50/90 dark:bg-surface-950/90 backdrop-blur-xl backdrop-saturate-150",
          "border-e border-surface-200/50 dark:border-surface-800/50",
          "transition-all duration-300 ease-out-expo shadow-glass-sm",
          isAr ? "right-0" : "left-0",
          mobileOpen ? "w-full" : collapsed ? "w-[72px]" : "w-64",
          mobileOpen
            ? "translate-x-0"
            : cn(
                isAr
                  ? "translate-x-full lg:translate-x-0"
                  : "-translate-x-full lg:translate-x-0",
              ),
          mobileOpen && "shadow-2xl lg:shadow-none",
        )}
        aria-label={isAr ? "القائمة الجانبية" : "Sidebar navigation"}
      >
        {/* Logo Section */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-surface-200/50 dark:border-surface-800/50 flex-shrink-0 transition-all duration-300",
            collapsed && !mobileOpen
              ? "lg:justify-center lg:px-0 px-3"
              : "justify-between px-5",
          )}
        >
          {collapsed && !mobileOpen ? (
            <button
              onClick={handleLogoClick}
              className="hidden lg:flex w-12 h-12 items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95 transition-all"
              aria-label={isAr ? "توسيع القائمة" : "Expand sidebar"}
            >
              <img
                src={store?.logoUrl || "/icon.svg"}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icon.svg";
                }}
              />
            </button>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => isMobile && setMobileOpen(false)}
                className="flex items-center gap-3 group min-w-0 flex-1"
              >
                <img
                  src={store?.logoUrl || "/icon.svg"}
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/icon.svg";
                  }}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-lg font-bold text-surface-900 dark:text-surface-100 leading-tight truncate">
                    {isAr ? "تطبيق تمام" : "Tamam App"}
                  </span>
                  <span className="text-[10px] text-surface-500 dark:text-surface-400 -mt-0.5">
                    {isAr ? "منصة تحكم المتجر" : "Store Control Platform"}
                  </span>
                </div>
              </NavLink>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCollapsed(true)}
                  className="hidden lg:flex p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95"
                  aria-label={isAr ? "طي القائمة" : "Collapse"}
                >
                  <svg
                    className={cn("w-5 h-5", isAr && "scale-x-[-1]")}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="lg:hidden p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95"
                  aria-label={isAr ? "إغلاق" : "Close"}
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
            </>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2 px-3",
              collapsed && !mobileOpen && "lg:hidden",
            )}
          >
            {isAr ? "الرئيسية" : "Main"}
          </p>
          {mainNavItems.map((item) => {
            const indicatorColor = getIndicatorColor(item.to);
            const hasBadge = item.badge !== undefined && item.badge > 0;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative",
                    !(collapsed && !mobileOpen) && "gap-3 px-3 py-2.5 w-full",
                    collapsed &&
                      !mobileOpen &&
                      "lg:w-12 lg:h-12 lg:p-0 lg:justify-center lg:mx-auto",
                    isActive
                      ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm"
                      : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-surface-200",
                  )
                }
                title={collapsed && !mobileOpen ? getLabel(item) : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary-600 dark:bg-primary-400 animate-scale-in",
                          isAr
                            ? "right-0 rounded-l-full"
                            : "left-0 rounded-r-full",
                          collapsed &&
                            !mobileOpen &&
                            (isAr ? "lg:-right-3" : "lg:-left-3"),
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="absolute inset-0 rounded-xl bg-primary-500/0 group-hover:bg-primary-500/5 dark:group-hover:bg-primary-400/5 transition-colors duration-300"
                      aria-hidden="true"
                    />
                    <span className="relative z-10 flex-shrink-0">
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "truncate relative z-10 transition-all",
                        collapsed && !mobileOpen ? "lg:hidden" : "flex-1",
                      )}
                    >
                      {getLabel(item)}
                    </span>
                    {hasBadge && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full relative z-10",
                          isActive
                            ? "bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300"
                            : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
                          collapsed && !mobileOpen && "lg:hidden",
                        )}
                      >
                        {item.badge! > 99 ? "99+" : item.badge}
                      </span>
                    )}
                    {hasBadge && collapsed && !mobileOpen && (
                      <span
                        className={cn(
                          "hidden lg:block absolute top-2.5 end-2.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-surface-900 shadow-sm",
                          indicatorColor,
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {!(collapsed && !mobileOpen) && (
            <div className="my-3 border-t border-surface-200 dark:border-surface-700" />
          )}
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2 mt-6 px-3",
              collapsed && !mobileOpen && "lg:hidden",
            )}
          >
            {isAr ? "أخرى" : "Other"}
          </p>
          {bottomNavItems.map((item) => {
            const indicatorColor = getIndicatorColor(item.to);
            const hasBadge = item.badge !== undefined && item.badge > 0;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative",
                    !(collapsed && !mobileOpen) && "gap-3 px-3 py-2.5 w-full",
                    collapsed &&
                      !mobileOpen &&
                      "lg:w-12 lg:h-12 lg:p-0 lg:justify-center lg:mx-auto",
                    isActive
                      ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm"
                      : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-surface-200",
                  )
                }
                title={collapsed && !mobileOpen ? getLabel(item) : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary-600 dark:bg-primary-400 animate-scale-in",
                          isAr
                            ? "right-0 rounded-l-full"
                            : "left-0 rounded-r-full",
                          collapsed &&
                            !mobileOpen &&
                            (isAr ? "lg:-right-3" : "lg:-left-3"),
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="absolute inset-0 rounded-xl bg-primary-500/0 group-hover:bg-primary-500/5 dark:group-hover:bg-primary-400/5 transition-colors duration-300"
                      aria-hidden="true"
                    />
                    <span className="relative z-10 flex-shrink-0">
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "truncate relative z-10 transition-all",
                        collapsed && !mobileOpen ? "lg:hidden" : "flex-1",
                      )}
                    >
                      {getLabel(item)}
                    </span>
                    {hasBadge && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full relative z-10",
                          isActive
                            ? "bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300"
                            : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300",
                          collapsed && !mobileOpen && "lg:hidden",
                        )}
                      >
                        {item.badge! > 99 ? "99+" : item.badge}
                      </span>
                    )}
                    {hasBadge && collapsed && !mobileOpen && (
                      <span
                        className={cn(
                          "hidden lg:block absolute top-2.5 end-2.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-surface-900 shadow-sm",
                          indicatorColor,
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Section */}
        <div
          className={cn(
            "p-3 border-t border-surface-200/50 dark:border-surface-800/50 flex-shrink-0 transition-all duration-300",
            collapsed && !mobileOpen ? "lg:flex lg:justify-center lg:p-3" : "",
          )}
        >
          {collapsed && !mobileOpen ? (
            <div className="hidden lg:flex w-12 h-12 items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-active:scale-95 transition-transform">
                <span className="text-sm font-bold text-white">
                  {ownerInitial}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                <span className="text-sm font-bold text-white">
                  {ownerInitial}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                  {ownerName}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                  {isAr ? "مالك المتجر" : "Store Owner"}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// ============================================
// Navbar
// ============================================

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const isAr = currentLanguage === "ar";

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<
    Array<{ label: string; labelAr: string; path: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData } = useNotifications(1, 5);
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const notifications = notificationsData ?? [];
  const unreadCount = unreadData ?? 0;

  const searchableRoutes = [
    { label: "Dashboard", labelAr: "لوحة التحكم", path: "/dashboard" },
    { label: "Orders", labelAr: "الطلبات", path: "/dashboard/orders" },
    {
      label: "Categories",
      labelAr: "التصنيفات",
      path: "/dashboard/categories",
    },
    { label: "Menu", labelAr: "القائمة", path: "/dashboard/menu" },
    { label: "Offers", labelAr: "العروض", path: "/dashboard/offers" },
    { label: "Coupons", labelAr: "الكوبونات", path: "/dashboard/coupons" },
    { label: "Wallet", labelAr: "المحفظة", path: "/dashboard/wallet" },
    {
      label: "Notifications",
      labelAr: "الإشعارات",
      path: "/dashboard/notifications",
    },
    { label: "Reports", labelAr: "التقارير", path: "/dashboard/reports" },
    { label: "Settings", labelAr: "الإعدادات", path: "/dashboard/settings" },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const filtered = searchableRoutes.filter(
        (route) =>
          route.label.toLowerCase().includes(query.toLowerCase()) ||
          route.labelAr.includes(query),
      );
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSuggestions.length > 0) {
      navigate(searchSuggestions[0].path);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          "[data-search]",
        ) as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        const searchInput = document.querySelector(
          "[data-search]",
        ) as HTMLInputElement;
        searchInput?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as HTMLElement)
      )
        setUserMenuOpen(false);
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as HTMLElement)
      )
        setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Clear all cached data before logging out
    try {
      // Clear all localStorage data related to the app
      localStorage.removeItem("store-sidebar-collapsed");

      // Clear any other app-specific storage
      const keysToRemove = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith("tamam") ||
          key.startsWith("store") ||
          key.includes("cache") ||
          key.includes("query"),
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear sessionStorage
      sessionStorage.clear();
    } catch (error) {
      console.warn("Error clearing storage:", error);
    }

    // Perform logout
    logout();
    toast.success(isAr ? "تم تسجيل الخروج بنجاح" : "Logged out successfully");
    navigate("/auth/login");
  };

  return (
    <header
      className={cn(
        "h-16 sticky top-0 z-30 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-xl backdrop-saturate-150",
        "border-b border-surface-200/50 dark:border-surface-800/50",
        "flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 transition-all duration-300",
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95 flex-shrink-0"
          aria-label={isAr ? "فتح القائمة" : "Open menu"}
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
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <div className="relative flex-1 max-w-md">
          <form onSubmit={handleSearchSubmit}>
            <svg
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                isAr ? "right-3" : "left-3",
                searchFocused
                  ? "text-primary-500"
                  : "text-surface-400 dark:text-surface-500",
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
              data-search
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                setSearchFocused(true);
                if (searchQuery.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setSearchFocused(false);
                  setShowSuggestions(false);
                }, 200);
              }}
              placeholder={isAr ? "ابحث عن الصفحات..." : "Search pages..."}
              className={cn(
                "w-full rounded-xl py-2 bg-surface-100 dark:bg-surface-800 text-sm",
                "text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500",
                "border-2 border-transparent focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
                "transition-all duration-200",
                isAr ? "pr-10 pl-4 sm:pl-16" : "pl-10 pr-4 sm:pr-16",
              )}
            />
            <kbd
              className={cn(
                "absolute top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-surface-400 dark:text-surface-500 bg-surface-200 dark:bg-surface-700 rounded-md pointer-events-none select-none",
                isAr ? "left-3" : "right-3",
              )}
            >
              <span className="text-xs">⌘</span>K
            </kbd>
          </form>

          {showSuggestions && searchSuggestions.length > 0 && (
            <div
              className={cn(
                "absolute top-full mt-2 w-full rounded-xl overflow-hidden",
                "bg-white dark:bg-surface-800",
                "border border-surface-200 dark:border-surface-700",
                "shadow-lg shadow-surface-900/10 dark:shadow-black/20",
                "animate-fade-in-scale origin-top",
                "z-50",
              )}
            >
              <div className="py-1">
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.path}
                    onClick={() => handleSuggestionClick(suggestion.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      "hover:bg-surface-50 dark:hover:bg-surface-700/50",
                      "text-surface-700 dark:text-surface-300",
                    )}
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0 text-surface-400 dark:text-surface-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                      />
                    </svg>
                    <div className="flex-1 text-start">
                      <span className="font-medium">
                        {isAr ? suggestion.labelAr : suggestion.label}
                      </span>
                    </div>
                    <span className="text-xs text-surface-400 dark:text-surface-500 font-mono">
                      {suggestion.path}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions &&
            searchQuery.trim().length > 0 &&
            searchSuggestions.length === 0 && (
              <div
                className={cn(
                  "absolute top-full mt-2 w-full rounded-xl overflow-hidden",
                  "bg-white dark:bg-surface-800",
                  "border border-surface-200 dark:border-surface-700",
                  "shadow-lg shadow-surface-900/10 dark:shadow-black/20",
                  "animate-fade-in-scale origin-top",
                  "z-50",
                )}
              >
                <div className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400 text-center">
                  {isAr ? "لا توجد نتائج" : "No results found"}
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <LanguageSwitcher variant="minimal" className="sm:hidden" />
        <LanguageSwitcher variant="navbar" className="hidden sm:flex" />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95 transition-all duration-200"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
              className="w-5 h-5 text-surface-600"
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

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            className={cn(
              "p-2 rounded-xl transition-all duration-200 relative",
              "text-surface-600 dark:text-surface-400",
              "hover:bg-surface-100 dark:hover:bg-surface-800",
              "active:scale-95",
              notificationsOpen && "bg-surface-100 dark:bg-surface-800",
            )}
            aria-label={isAr ? "الإشعارات" : "Notifications"}
          >
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
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-error-500 ring-2 ring-white dark:ring-surface-900 shadow-sm" />
            )}
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40 sm:hidden bg-black/20 backdrop-blur-sm animate-fade-in"
                onClick={() => setNotificationsOpen(false)}
                aria-hidden="true"
              />

              <div
                className={cn(
                  "fixed z-50",
                  "top-16 inset-x-4",
                  "max-w-md mx-auto",
                  "rounded-2xl overflow-hidden",
                  "animate-fade-in-scale origin-top",
                  "glass glass-elevated",
                  "sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 sm:mx-0",
                  "sm:w-80 md:w-96",
                  "sm:max-w-none sm:max-h-[32rem]",
                  "sm:rounded-2xl",
                  isAr ? "sm:left-0" : "sm:right-0",
                )}
                style={{
                  maxHeight: "calc(100vh - 5rem)",
                }}
              >
                <div className="px-4 py-3 border-b border-surface-200/50 dark:border-surface-800/50 flex justify-between items-center sticky top-0 bg-surface-50/95 dark:bg-surface-950/95 backdrop-blur-xl z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                      {isAr ? "الإشعارات" : "Notifications"}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    aria-label={isAr ? "إغلاق" : "Close"}
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

                <div
                  className="overflow-y-auto overscroll-contain"
                  style={{ maxHeight: "calc(100vh - 12rem)" }}
                >
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                        <svg
                          className="w-7 h-7 text-surface-300 dark:text-surface-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        {isAr ? "لا توجد إشعارات" : "No notifications"}
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                        {isAr
                          ? "ستظهر إشعاراتك هنا"
                          : "Your notifications will appear here"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-100 dark:divide-surface-800/30">
                      {notifications.slice(0, 5).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) markAsRead.mutate(n.id);
                            if (n.link) navigate(n.link);
                            setNotificationsOpen(false);
                          }}
                          className={cn(
                            "w-full text-start px-4 py-3 flex items-start gap-3 transition-colors",
                            "hover:bg-surface-50 dark:hover:bg-surface-800/30",
                            !n.isRead &&
                              "bg-primary-50/40 dark:bg-primary-950/15",
                            !n.isRead &&
                              "border-s-2 border-primary-500 dark:border-primary-400",
                          )}
                        >
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                              n.isRead
                                ? "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"
                                : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400",
                            )}
                          >
                            <svg
                              className="w-4.5 h-4.5"
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
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm truncate",
                                  n.isRead
                                    ? "font-medium text-surface-700 dark:text-surface-300"
                                    : "font-semibold text-surface-900 dark:text-surface-100",
                                )}
                              >
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                              )}
                            </div>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1.5 font-medium">
                              {getRelativeTime(n.createdAt)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 border-t border-surface-200/50 dark:border-surface-800/50 sticky bottom-0 bg-surface-50/95 dark:bg-surface-950/95 backdrop-blur-xl">
                    <NavLink
                      to="/dashboard/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                    >
                      {isAr ? "عرض جميع الإشعارات" : "View all notifications"}
                      <svg
                        className="w-3.5 h-3.5"
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
                              ? "M15.75 19.5 8.25 12l7.5-7.5"
                              : "m8.25 4.5 7.5 7.5-7.5 7.5"
                          }
                        />
                      </svg>
                    </NavLink>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 active:scale-95 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-sm font-bold text-white">
                {user?.fullName?.charAt(0) || (isAr ? "م" : "A")}
              </span>
            </div>
          </button>
          {userMenuOpen && (
            <div
              className={cn(
                "absolute top-full mt-2 w-56 rounded-2xl overflow-hidden animate-fade-in-scale origin-top-right glass glass-elevated",
                isAr ? "left-0" : "right-0",
              )}
            >
              <div className="p-4 border-b border-surface-200/50 dark:border-surface-800/50">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {user?.fullName || (isAr ? "المستخدم" : "User")}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  {user?.phoneNumber || ""}
                </p>
              </div>
              <div className="p-2">
                <NavLink
                  to="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
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
                  {isAr ? "الإعدادات" : "Settings"}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                >
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
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                    />
                  </svg>
                  {isAr ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================
// Store Type Selection
// ============================================

const StoreTypeSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  isAr: boolean;
}> = ({ isOpen, onClose, onComplete, isAr }) => {
  const toast = useToast();
  const { data: availableTypes = [], isLoading: typesLoading } =
    useAvailableStoreTypes();
  const addStoreType = useAddStoreType();
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId) {
      toast.error(
        isAr ? "يرجى اختيار نوع المتجر" : "Please select a store type",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addStoreType.mutateAsync(selectedTypeId);
      toast.success(
        isAr ? "تم إضافة نوع المتجر بنجاح" : "Store type added successfully",
      );
      onComplete();
    } catch (error) {
      toast.error(isAr ? "فشل إضافة نوع المتجر" : "Failed to add store type");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-scale bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-950/30 dark:to-primary-900/20">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                {isAr ? "اختر نوع المتجر" : "Select Store Type"}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {isAr
                  ? "يرجى اختيار نوع المتجر للمتابعة"
                  : "Please select a store type to continue"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
              aria-label={isAr ? "إغلاق" : "Close"}
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
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {typesLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="w-8 h-8 animate-spin text-primary-500"
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
            </div>
          ) : availableTypes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {isAr ? "لا توجد أنواع متجر متاحة" : "No store types available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedTypeId(type.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                    selectedTypeId === type.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-sm shadow-primary-500/10"
                      : "border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-surface-50 dark:hover:bg-surface-800/50",
                    isAr ? "text-right" : "text-left",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {type.iconUrl && (
                      <img
                        src={type.iconUrl}
                        alt={isAr ? type.nameAr : type.nameEn}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">
                        {isAr
                          ? type.nameAr || type.nameEn
                          : type.nameEn || type.nameAr}
                      </p>
                      {type.descriptionAr && (
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {isAr ? type.descriptionAr : type.descriptionEn}
                        </p>
                      )}
                    </div>
                    {selectedTypeId === type.id && (
                      <svg
                        className="w-5 h-5 text-primary-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!selectedTypeId || isSubmitting || typesLoading}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                "dark:bg-primary-500 dark:hover:bg-primary-600",
                "shadow-sm hover:shadow-md",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
              )}
            >
              {isSubmitting ? (
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
                  {isAr ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : isAr ? (
                "تأكيد"
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// StoreLayout — Main Export
// ============================================

export const StoreLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("store-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<StoreOrderDto[]>([]);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasShownInitialModal, setHasShownInitialModal] = useState(false);

  const [showStoreTypeModal, setShowStoreTypeModal] = useState(false);
  const [hasCheckedStoreTypes, setHasCheckedStoreTypes] = useState(false);

  // Fetch ALL orders
  const { data: allOrders = [], refetch: refetchOrders } = useStoreOrders();
  const { store, refreshStore, isOpen } = useStore();

  // Check and show pending orders whenever the store is online
  useEffect(() => {
    // Only proceed if store is online and we have orders data
    if (!isOpen || !allOrders || allOrders.length === 0) {
      // If store is closed, close the modal if open
      if (!isOpen && isNewOrderModalOpen) {
        setIsNewOrderModalOpen(false);
        setPendingOrders([]);
      }
      return;
    }

    const currentPendingOrders = allOrders.filter(
      (o) => o.status === "pending",
    );

    // If there are no pending orders, close the modal if open
    if (currentPendingOrders.length === 0) {
      if (isNewOrderModalOpen) {
        setIsNewOrderModalOpen(false);
        setPendingOrders([]);
      }
      return;
    }

    // Get IDs of pending orders
    const currentPendingIds = new Set(currentPendingOrders.map((o) => o.id));

    // On initial load, show modal if there are pending orders
    if (isInitialLoad) {
      setKnownOrderIds(currentPendingIds);
      setIsInitialLoad(false);

      // Show modal for pending orders if not already shown
      if (!hasShownInitialModal && !isNewOrderModalOpen) {
        setPendingOrders(currentPendingOrders);
        setIsNewOrderModalOpen(true);
        setHasShownInitialModal(true);
      }
      return;
    }

    // Find new orders not in knownOrderIds
    const newOrders = currentPendingOrders.filter(
      (o) => !knownOrderIds.has(o.id),
    );

    // If there are new orders, add them to the queue
    if (newOrders.length > 0 && !isNewOrderModalOpen) {
      setPendingOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const uniqueNew = newOrders.filter((o) => !existingIds.has(o.id));
        return [...prev, ...uniqueNew];
      });
      setIsNewOrderModalOpen(true);
    }

    // Update known IDs
    setKnownOrderIds(currentPendingIds);
  }, [
    allOrders,
    isOpen,
    isInitialLoad,
    isNewOrderModalOpen,
    knownOrderIds,
    hasShownInitialModal,
  ]);

  // Poll for new orders every 5 seconds (only when store is online)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      refetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, refetchOrders]);

  // When store comes online, check for pending orders
  useEffect(() => {
    if (isOpen) {
      // Reset initial load flag to re-check pending orders when store comes online
      setIsInitialLoad(true);
      setHasShownInitialModal(false);
      refetchOrders();
    } else {
      // Store is closed - close the modal
      setIsNewOrderModalOpen(false);
      setPendingOrders([]);
    }
  }, [isOpen, refetchOrders]);

  useEffect(() => {
    if (store && !hasCheckedStoreTypes) {
      const approvedTypes = (store as any)?.approvedTypes;
      const pendingTypes = (store as any)?.pendingTypes;

      const hasApprovedTypes = approvedTypes && approvedTypes.length > 0;
      const hasPendingTypes = pendingTypes && pendingTypes.length > 0;

      if (!hasApprovedTypes && !hasPendingTypes) {
        setShowStoreTypeModal(true);
      }
      setHasCheckedStoreTypes(true);
    }
  }, [store, hasCheckedStoreTypes]);

  useEffect(() => {
    if (store && hasCheckedStoreTypes) {
      const approvedTypes = (store as any)?.approvedTypes;
      const hasApprovedTypes = approvedTypes && approvedTypes.length > 0;

      if (hasApprovedTypes && showStoreTypeModal) {
        setShowStoreTypeModal(false);
      }
    }
  }, [store, hasCheckedStoreTypes, showStoreTypeModal]);

  const handleCloseNewOrderModal = () => {
    setIsNewOrderModalOpen(false);
    setPendingOrders([]);
    refetchOrders();
  };

  const handleStoreTypeComplete = () => {
    setShowStoreTypeModal(false);
    if (refreshStore) {
      refreshStore();
    }
    setHasCheckedStoreTypes(false);
    setTimeout(() => {
      setHasCheckedStoreTypes(true);
    }, 500);
  };

  // ============================================
  // Existing Layout Logic
  // ============================================

  useEffect(() => {
    try {
      localStorage.setItem("store-sidebar-collapsed", String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLoading)
    return (
      <PageLoader
        message={isAr ? "جاري التحقق من الجلسة..." : "Verifying session..."}
      />
    );
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  return (
    <div
      className="h-screen flex bg-surface-50 dark:bg-surface-950"
      dir={isAr ? "rtl" : "ltr"}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only absolute top-4 start-4 z-[60] px-4 py-2 rounded-xl bg-primary-600 text-white shadow-lg"
      >
        {isAr ? "تخطي إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:ms-[72px]" : "lg:ms-64",
        )}
      >
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-5 lg:p-8 max-w-[1600px] mx-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <PageLoader
                    variant="inline"
                    message={
                      isAr ? "جاري تحميل المحتوى..." : "Loading content..."
                    }
                  />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Show New Order Modal for pending orders when store is online */}
      {isNewOrderModalOpen && pendingOrders.length > 0 && isOpen && (
        <NewOrderModal
          orders={pendingOrders}
          onClose={handleCloseNewOrderModal}
          onOrderProcessed={(orderId) => {
            // Remove the processed order from the queue
            setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
            // Add to knownOrderIds so it won't be re-added on next poll
            setKnownOrderIds((prev) => new Set(prev).add(orderId));
            // Refetch orders to update status
            refetchOrders();
          }}
        />
      )}

      {/* Store Type Selection Modal */}
      {showStoreTypeModal && (
        <StoreTypeSelectionModal
          isOpen={showStoreTypeModal}
          onClose={() => setShowStoreTypeModal(false)}
          onComplete={handleStoreTypeComplete}
          isAr={isAr}
        />
      )}
    </div>
  );
};

export default StoreLayout;

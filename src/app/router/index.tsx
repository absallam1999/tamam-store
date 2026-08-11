import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ---- Layouts ----
import { AuthLayout } from "@app/layouts/AuthLayout";
import { StoreLayout } from "@app/layouts/StoreLayout";
import { ProtectedRoute } from "@shared/components/ProtectedRoute";

// ---- Shared Components ----
import { PageLoader } from "@shared/components/PageLoader";

// ---- Lazy-Loaded Auth Pages ----
const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);

const RegisterPage = lazy(() =>
  import("@/features/auth/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);

const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);

const ResetPasswordPage = lazy(() =>
  import("@/features/auth/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);

// ---- Lazy-Loaded Dashboard Pages ----
const DashboardHome = lazy(() =>
  import("@/features/dashboard/DashboardHome").then((m) => ({
    default: m.DashboardHome,
  })),
);

const OrdersPage = lazy(() =>
  import("@/features/orders/OrdersPage").then((m) => ({
    default: m.OrdersPage,
  })),
);

const OrderDetailsPage = lazy(() =>
  import("@/features/orders/OrderDetailsPage").then((m) => ({
    default: m.OrderDetailsPage,
  })),
);

const MenuPage = lazy(() =>
  import("@/features/menu/MenuPage").then((m) => ({
    default: m.MenuPage,
  })),
);

const MenuItemPage = lazy(() =>
  import("@/features/menu/MenuItemPage").then((m) => ({
    default: m.MenuItemPage,
  })),
);

const CategoriesPage = lazy(() =>
  import("@/features/categories/CategoriesPage").then((m) => ({
    default: m.CategoriesPage,
  })),
);

const WalletPage = lazy(() =>
  import("@/features/wallet/WalletPage").then((m) => ({
    default: m.WalletPage,
  })),
);

const OffersPage = lazy(() =>
  import("@/features/offers/OffersPage").then((m) => ({
    default: m.OffersPage,
  })),
);

const CouponsPage = lazy(() =>
  import("@/features/coupons/CouponsPage").then((m) => ({
    default: m.CouponsPage,
  })),
);

const SupportPage = lazy(() =>
  import("@/features/support/SupportPage").then((m) => ({
    default: m.SupportPage,
  })),
);

const NotificationsPage = lazy(() =>
  import("@/features/notifications/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);

const ReportsPage = lazy(() =>
  import("@/features/reports/ReportsPage").then((m) => ({
    default: m.ReportsPage,
  })),
);

const SettingsPage = lazy(() =>
  import("@/features/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

// ---- Lazy-Loaded Shared Pages ----
const NotFoundPage = lazy(() =>
  import("@shared/components/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);

/**
 * AppRouter — Store Route Configuration
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Root Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth Routes — Public */}
      <Route element={<AuthLayout />}>
        <Route
          path="/auth/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ResetPasswordPage />
            </Suspense>
          }
        />
      </Route>

      {/* Protected Routes — Auth Required */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StoreLayout />}>
          {/* Dashboard Home */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardHome />
              </Suspense>
            }
          />

          {/* Orders */}
          <Route
            path="/dashboard/orders"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrdersPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/orders/:orderId"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrderDetailsPage />
              </Suspense>
            }
          />

          {/* Menu & Categories */}
          <Route
            path="/dashboard/menu"
            element={
              <Suspense fallback={<PageLoader />}>
                <MenuPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/menu/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <MenuItemPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/menu/:itemId"
            element={
              <Suspense fallback={<PageLoader />}>
                <MenuItemPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/categories"
            element={
              <Suspense fallback={<PageLoader />}>
                <CategoriesPage />
              </Suspense>
            }
          />

          {/* Wallet */}
          <Route
            path="/dashboard/wallet"
            element={
              <Suspense fallback={<PageLoader />}>
                <WalletPage />
              </Suspense>
            }
          />

          {/* Offers */}
          <Route
            path="/dashboard/offers"
            element={
              <Suspense fallback={<PageLoader />}>
                <OffersPage />
              </Suspense>
            }
          />

          {/* Coupons */}
          <Route
            path="/dashboard/coupons"
            element={
              <Suspense fallback={<PageLoader />}>
                <CouponsPage />
              </Suspense>
            }
          />

          {/* Support */}
          <Route
            path="/dashboard/support"
            element={
              <Suspense fallback={<PageLoader />}>
                <SupportPage />
              </Suspense>
            }
          />

          {/* Notifications */}
          <Route
            path="/dashboard/notifications"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotificationsPage />
              </Suspense>
            }
          />

          {/* Reports */}
          <Route
            path="/dashboard/reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            }
          />

          {/* Settings */}
          <Route
            path="/dashboard/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* Catch-All — 404 */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default AppRouter;

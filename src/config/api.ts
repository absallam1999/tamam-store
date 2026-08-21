/**
 * API Configuration — Tamam Store Dashboard
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
  // ============================================
  // Authentication
  // ============================================
  AUTH: {
    // Public
    LOGIN: "/api/Auth/login",
    SEND_OTP: "/api/Auth/send-otp",
    VERIFY_OTP: "/api/Auth/verify-otp",
    REGISTER_STORE: "/api/Auth/register/store",
    REFRESH_TOKEN: "/api/Auth/refresh",

    // Authenticated
    CHANGE_PASSWORD: "/api/Auth/change-password",
    LOGOUT: "/api/Auth/logout",
  },

  // ============================================
  // Store Registration Request (public)
  // POST /api/requests — CreateRequestDto
  // ============================================
  REQUESTS: "/api/requests",

  // ============================================
  // Store Owner — Profile & Settings
  // ============================================
  STORE: {
    // Profile
    PROFILE: "/api/store/profile",
    TOGGLE_OPEN: "/api/store/toggle-open",
    LOGO: "/api/store/logo",
    COVER: "/api/store/cover",
    OWN_DRIVER: "/api/store/own-driver",
    GLOBAL_DISCOUNT: "/api/store/global-discount",
    REVIEWS: "/api/store/reviews",

    // Store Types
    TYPES: "/api/store/store-types",
    TYPES_AVAILABLE: "/api/store/store-types/available",
    TYPES_BY_CATEGORY: (categoryId: string) =>
      `/api/store/store-types/available?categoryId=${categoryId}`,
    ADD_TYPE: (storeTypeId: string) => `/api/store/store-types/${storeTypeId}`,
    REMOVE_TYPE: (mappingId: string) => `/api/store/store-types/${mappingId}`,

    // Categories Available
    CATEGORIES_AVAILABLE: "/api/store/categories/available",

    // Menu Categories
    CATEGORIES: "/api/store/menu-categories",
    CATEGORY_BY_ID: (categoryId: string) =>
      `/api/store/menu-categories/${categoryId}`,

    // Products
    PRODUCTS: "/api/store/products",
    PRODUCT_BY_ID: (productId: string) => `/api/store/products/${productId}`,
    PRODUCT_TOGGLE_AVAILABILITY: (productId: string) =>
      `/api/store/products/${productId}/toggle-availability`,
    PRODUCT_STOCK: (productId: string) =>
      `/api/store/products/${productId}/stock`,
    PRODUCT_OPTIONS: (productId: string) =>
      `/api/store/products/${productId}/options`,
    PRODUCT_OPTION_BY_ID: (optionId: string) =>
      `/api/store/products/options/${optionId}`,
    PRODUCT_OPTION_VALUES: (optionId: string) =>
      `/api/store/products/options/${optionId}/values`,
    PRODUCT_OPTION_VALUE_BY_ID: (valueId: string) =>
      `/api/store/products/options/values/${valueId}`,
    PRODUCT_IMAGE: (productId: string) =>
      `/api/store/products/${productId}/image`,

    // Offers
    OFFERS: "/api/store/offers",
    OFFER_BY_ID: (offerId: string) => `/api/store/offers/${offerId}`,
    OFFER_TOGGLE_ACTIVE: (offerId: string) =>
      `/api/store/offers/${offerId}/toggle-active`,
    OFFER_ADD_PRODUCT: (offerId: string, productId: string) =>
      `/api/store/offers/${offerId}/products/${productId}`,
    OFFER_REMOVE_PRODUCT: (offerId: string, productId: string) =>
      `/api/store/offers/${offerId}/products/${productId}`,

    // Coupons
    COUPONS: "/api/store/coupons",
    COUPON_BY_ID: (couponId: string) => `/api/store/coupons/${couponId}`,
    COUPON_TOGGLE_ACTIVE: (couponId: string) =>
      `/api/store/coupons/${couponId}/toggle-active`,

    // Wallet
    WALLET: "/api/store/wallet",
    WALLET_WITHDRAW: "/api/store/wallet/withdraw",

    // Orders
    ORDERS: "/api/store/orders",
    ORDER_BY_ID: (orderId: string) => `/api/store/orders/${orderId}`,
    ORDER_ACCEPT: (orderId: string) => `/api/store/orders/${orderId}/accept`,
    ORDER_REJECT: (orderId: string) => `/api/store/orders/${orderId}/reject`,
    ORDER_CANCEL: (orderId: string) => `/api/store/orders/${orderId}/cancel`,
    ORDER_STATUS: (orderId: string) => `/api/store/orders/${orderId}/status`,
    ORDER_READY_FOR_DRIVER: (orderId: string) =>
      `/api/store/orders/${orderId}/ready-for-driver`,
    ORDER_PICKED_UP: (orderId: string) =>
      `/api/store/orders/${orderId}/picked-up`,
    ORDER_OUT_FOR_DELIVERY: (orderId: string) =>
      `/api/store/orders/${orderId}/out-for-delivery`,
    ORDER_SCHEDULED: "/api/store/orders/scheduled",
    ORDER_CONFIRM_SCHEDULED: (orderId: string) =>
      `/api/store/orders/${orderId}/confirm-scheduled`,
    ORDER_CANCEL_SCHEDULED: (orderId: string) =>
      `/api/store/orders/${orderId}/cancel-scheduled`,
    ORDER_STATS: "/api/store/orders/stats",

    // Group Deals
    GROUP_DEALS: "/api/store/group-deals",
    GROUP_DEAL_BY_ID: (dealId: string) => `/api/store/group-deals/${dealId}`,

    // Quantity Bundles
    QUANTITY_BUNDLES: "/api/store/quantity-bundles",
    QUANTITY_BUNDLE_BY_ID: (bundleId: string) =>
      `/api/store/quantity-bundles/${bundleId}`,

    // Opening Hours
    OPENING_HOURS: "/api/store/opening-hours",
    OPENING_HOUR_BY_ID: (hourId: string) =>
      `/api/store/opening-hours/${hourId}`,
  },

  // ============================================
  // Public Browse Endpoints
  // ============================================
  BROWSE: {
    STORE_CATEGORIES: "/api/browse/store-categories",
  },

  // ============================================
  // Notifications (authenticated)
  // ============================================
  NOTIFICATIONS: {
    BASE: "/api/notifications",
    UNREAD_COUNT: "/api/notifications/unread-count",
    MARK_READ: (notificationId: string) =>
      `/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: "/api/notifications/read-all",
    DELETE: (notificationId: string) => `/api/notifications/${notificationId}`,
    DELETE_ALL: "/api/notifications/clear-all",
  },

  // ============================================
  // Upload (authenticated)
  // ============================================
  UPLOAD: {
    IMAGE: "/api/upload/image",
    IMAGE_URL: "/api/upload/image/url",
    DOCUMENT: "/api/upload/document",
    MULTIPLE: "/api/upload/multiple",
  },

  // ============================================
  // Wallet Top-Up (customer side)
  // ============================================
  WALLET: {
    TOPUP: "/api/wallet/topup/with-screenshot",
  },
} as const;

export const getApiUrl = (endpoint: string): string => {
  if (import.meta.env.DEV) {
    return endpoint;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

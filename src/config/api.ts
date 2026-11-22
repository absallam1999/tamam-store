/**
 * API Configuration — Tamam Store Dashboard
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
  // ═══════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════
  AUTH: {
    LOGIN: "/api/auth/login", // POST  @response envelope (AuthResponseDto)
    REFRESH_TOKEN: "/api/auth/refresh", // POST  @response envelope
    SOCIAL_LOGIN: "/api/auth/social-login", // POST  @response envelope

    SEND_OTP: "/api/auth/otp/send", // POST  @response envelope (OtpSentResponseDto)
    VERIFY_OTP: "/api/auth/otp/verify", // POST  @response envelope (AuthResponseDto)

    CHANGE_PASSWORD: "/api/auth/change-password", // POST  @response envelope
    LOGOUT: "/api/auth/logout", // POST  @response void
  },

  // ═══════════════════════════════════════════════════════════════════
  // ONBOARDING
  // ═══════════════════════════════════════════════════════════════════
  ONBOARDING: {
    SUBMIT: "/api/onboarding/store", // POST  @response envelope (OnboardingSubmissionResultDto)
  },

  // ═══════════════════════════════════════════════════════════════════
  // FILES
  // ═══════════════════════════════════════════════════════════════════
  FILES: {
    UPLOAD: "/api/files/upload", // POST multipart: file + ?category=
    UPLOAD_WITH_CATEGORY: (category: string) =>
      `/api/files/upload?category=${encodeURIComponent(category)}`,

    UPLOAD_MULTIPLE: "/api/files/upload-multiple", // POST multipart: files[] + ?category=

    DELETE: (relativePath: string) =>
      `/api/files/${relativePath.replace(/^\/+/, "")}`,

    INFO: (relativePath: string) =>
      `/api/files/info?path=${encodeURIComponent(relativePath)}`,

    CATEGORIES: {
      AVATARS: "avatars",
      STORE_LOGOS: "store-logos",
      STORE_COVERS: "store-covers",
      PRODUCT_IMAGES: "product-images",
      DRIVER_DOCUMENTS: "driver-documents",
      GENERAL: "general",
    } as const,
  },

  // ═══════════════════════════════════════════════════════════════════
  // STORE OWNER — Profile, Assets
  // ═══════════════════════════════════════════════════════════════════
  STORE: {
    // ── Dashboard & Profile ────────────────────────────────────────
    DASHBOARD: "/api/store/dashboard", // GET  @response envelope (StoreDashboardDto)

    PROFILE: "/api/store/profile", // GET / PUT  @response envelope (StoreProfileDto)
    TOGGLE_OPEN: "/api/store/profile/open", // PATCH { isOpen: boolean }  @response envelope
    TOGGLE_BUSY: "/api/store/profile/busy", // PATCH { isBusy: boolean }  @response envelope — NOT in OpenAPI yet; verify

    LOGO: "/api/store/profile/logo", // PUT { imageUrl }  @response envelope
    COVER: "/api/store/profile/cover", // PUT { imageUrl }  @response envelope

    // ── Store Type Applications ───────────────────────────────────
    TYPE_APPLICATIONS: "/api/store/type-applications", // GET  @response envelope
    REQUEST_TYPE: "/api/store/type-applications", // POST { storeTypeId }  @response envelope
    CANCEL_TYPE_APPLICATION: (mappingId: string) =>
      `/api/store/type-applications/${mappingId}`, // DELETE  @response void

    TYPES_AVAILABLE: "/api/store-types/active", // GET public  @response envelope
    TYPES_BY_CATEGORY: (categoryId: string) =>
      `/api/store-types/active?categoryId=${categoryId}`,
    TYPES_GROUPED: "/api/store-types/grouped-by-category",

    CATEGORIES_AVAILABLE: "/api/browse/store-categories",

    // ── Menu Categories ────────────────────────────────────────────
    MENU_CATEGORIES: "/api/store/menu-categories", // GET / POST  @response envelope
    MENU_CATEGORY_BY_ID: (id: string) => `/api/store/menu-categories/${id}`, // GET / PUT  @response envelope; DELETE  @response void
    MENU_CATEGORY_TOGGLE: (id: string) =>
      `/api/store/menu-categories/${id}/toggle`, // PATCH  @response envelope

    // ── Products ───────────────────────────────────────────────────
    PRODUCTS: "/api/store/products", // GET (paged) / POST  @response envelope
    PRODUCT_BY_ID: (id: string) => `/api/store/products/${id}`, // GET / PUT  @response envelope; DELETE  @response void

    PRODUCT_AVAILABILITY: (id: string) =>
      `/api/store/products/${id}/availability`, // PATCH { isAvailable }  @response envelope
    PRODUCT_FEATURED: (id: string) =>
      `/api/store/products/${id}/featured`, // PATCH { isFeatured }  @response envelope
    PRODUCT_DISCOUNT: (id: string) =>
      `/api/store/products/${id}/discount`, // PATCH { discountedPrice:number|null } clears via null; DELETE also clears  @response envelope / void
    PRODUCT_IMAGE: (id: string) =>
      `/api/store/products/${id}/image`, // PUT { imageUrl }  @response envelope — verify route ships

    // ── Product Options ────────────────────────────────────────────
    PRODUCT_OPTIONS_CREATE: (productId: string) =>
      `/api/store/products/${productId}/options`, // POST  @response envelope
    PRODUCT_OPTION_BY_ID: (optionId: string) =>
      `/api/store/product-options/${optionId}`, // PUT  @response envelope; DELETE  @response void
    PRODUCT_OPTION_VALUES_CREATE: (optionId: string) =>
      `/api/store/product-options/${optionId}/values`, // POST  @response envelope

    // ── Product Option Values ──────────────────────────────────────
    PRODUCT_OPTION_VALUE_BY_ID: (valueId: string) =>
      `/api/store/product-option-values/${valueId}`, // PUT  @response envelope; DELETE  @response void
    PRODUCT_OPTION_VALUE_SET_DEFAULT: (valueId: string) =>
      `/api/store/product-option-values/${valueId}/default`, // POST  @response void

    // ── Offers ─────────────────────────────────────────────────────
    OFFERS: "/api/store/offers", // GET / POST  @response envelope
    OFFER_BY_ID: (offerId: string) => `/api/store/offers/${offerId}`, // GET / PUT  @response envelope; DELETE  @response void
    OFFER_TOGGLE: (offerId: string) =>
      `/api/store/offers/${offerId}/toggle`, // PATCH  @response envelope
    OFFER_ADD_PRODUCT: (offerId: string) =>
      `/api/store/offers/${offerId}/products`, // POST { productId, quantity }  @response envelope (OfferDto)
    OFFER_REMOVE_PRODUCT: (offerId: string, productId: string) =>
      `/api/store/offers/${offerId}/products/${productId}`, // DELETE  @response envelope (OfferDto) — NOT bare 200!

    // ── Coupons ────────────────────────────────────────────────────
    COUPONS: "/api/store/coupons", // GET / POST  @response envelope
    COUPON_BY_ID: (couponId: string) =>
      `/api/store/coupons/${couponId}`, // GET / PUT  @response envelope; DELETE  @response void
    COUPON_TOGGLE: (couponId: string) =>
      `/api/store/coupons/${couponId}/toggle`, // PATCH  @response envelope

    // ── Opening Hours ──────────────────────────────────────────────
    OPENING_HOURS: "/api/store/opening-hours", // GET / POST  @response envelope
    OPENING_HOUR_BY_ID: (id: string) =>
      `/api/store/opening-hours/${id}`, // PUT  @response envelope; DELETE  @response void

    // ── City Delivery Fees (overrides) ─────────────────────────────
    CITY_DELIVERY_FEES: "/api/store/city-delivery-fees", // GET / POST  @response envelope
    CITY_DELIVERY_FEE_BY_ID: (id: string) =>
      `/api/store/city-delivery-fees/${id}`, // PUT  @response envelope; DELETE  @response void

    // ── Reviews (store owner view) ─────────────────────────────────
    REVIEWS: "/api/store/reviews", // GET ?onlyUnanswered=&pageIndex=&pageSize=  @response envelope (PagedResult<ReviewDto>)
    REVIEW_REPLY: (reviewId: string) =>
      `/api/store/reviews/${reviewId}/reply`, // POST { reply }  @response envelope
  },

  // ═══════════════════════════════════════════════════════════════════
  // STORE OWNER — Orders
  // ═══════════════════════════════════════════════════════════════════
  STORE_ORDERS: {
    LIST: "/api/store/orders", // GET ?status=  @response envelope (StoreOrderDto[])
    STATS: "/api/store/orders/stats", // GET  @response envelope (StoreOrderStatsDto)
    SCHEDULED: "/api/store/orders/scheduled", // GET  @response envelope (StoreOrderDto[])
    BY_ID: (orderId: string) => `/api/store/orders/${orderId}`, // GET  @response envelope

    ACCEPT: (orderId: string) => `/api/store/orders/${orderId}/accept`, // POST  @response void
    REJECT: (orderId: string) => `/api/store/orders/${orderId}/reject`, // POST { reason }  @response void
    CANCEL: (orderId: string) => `/api/store/orders/${orderId}/cancel`, // POST { reason }  @response void

    PREPARING: (orderId: string) => `/api/store/orders/${orderId}/preparing`, // POST  @response void
    READY_FOR_DRIVER: (orderId: string) =>
      `/api/store/orders/${orderId}/ready-for-driver`, // POST  @response void
    PICKED_UP: (orderId: string) => `/api/store/orders/${orderId}/picked-up`, // POST  @response void
    OUT_FOR_DELIVERY: (orderId: string) =>
      `/api/store/orders/${orderId}/out-for-delivery`, // POST  @response void

    SET_STATUS: (orderId: string) =>
      `/api/store/orders/${orderId}/status`, // PATCH { status, rejectionReason? }  @response void

    CONFIRM_SCHEDULED: (orderId: string) =>
      `/api/store/orders/${orderId}/scheduled/confirm`, // POST  @response void
    CANCEL_SCHEDULED: (orderId: string) =>
      `/api/store/orders/${orderId}/scheduled/cancel`, // POST { reason }  @response void

    ACCEPT_CANCELLATION: (orderId: string) =>
      `/api/store/orders/${orderId}/cancellation/accept`, // POST (no body)  @response void
    REJECT_CANCELLATION: (orderId: string) =>
      `/api/store/orders/${orderId}/cancellation/reject`, // POST (no body)  @response void
  },

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC BROWSE (no auth)
  // ═══════════════════════════════════════════════════════════════════
  BROWSE: {
    STORE_CATEGORIES: "/api/browse/store-categories",
    STORES_NEARBY: "/api/browse/stores/nearby",
    STORES_SEARCH: "/api/browse/stores/search",
    STORES_FEATURED: "/api/browse/stores/featured",
    OFFERS: "/api/browse/offers",

    CITIES_BROWSE: "/api/cities/browse",
    CITIES_LOOKUP: "/api/cities/lookup", // GET  @response envelope (CityListDto[])

    STORE_TYPES_ACTIVE: "/api/store-types/active",
    STORE_TYPES_GROUPED: "/api/store-types/grouped-by-category",
    STORE_TYPES_POPULAR: "/api/store-types/popular",

    PRODUCTS_BY_STORE: (storeId: string, query?: {
      MenuCategoryId?: string;
      IsAvailable?: boolean;
      IsFeatured?: boolean;
      Search?: string;
      SortBy?: string;
      PageIndex?: number;
      PageSize?: number;
    }) => {
      const qs = query ? `?${new URLSearchParams(
        Object.entries(query).reduce<Record<string, string>>((acc, [k, v]) => {
          if (v !== undefined && v !== null) acc[k] = String(v);
          return acc;
        }, {}),
      ).toString()}` : "";
      return `/api/products/by-store/${storeId}${qs}`;
    }, // GET  @response envelope (PagedResult<ProductBrowseDto>)

    PRODUCTS_BY_CATEGORY: (menuCategoryId: string, query?: {
      IsAvailable?: boolean;
      IsFeatured?: boolean;
      Search?: string;
      SortBy?: string;
      PageIndex?: number;
      PageSize?: number;
    }) => {
      const qs = query ? `?${new URLSearchParams(
        Object.entries(query).reduce<Record<string, string>>((acc, [k, v]) => {
          if (v !== undefined && v !== null) acc[k] = String(v);
          return acc;
        }, {}),
      ).toString()}` : "";
      return `/api/products/by-category/${menuCategoryId}${qs}`;
    }, // GET  @response envelope (PagedResult<ProductBrowseDto>)

    PRODUCT_DETAIL: (productId: string) => `/api/products/${productId}`, // GET  @response envelope (ProductDto)

    // ✚ ADDED — public review reads
    REVIEWS_STORE: (storeId: string, pageIndex = 1, pageSize = 20) =>
      `/api/reviews/stores/${storeId}?pageIndex=${pageIndex}&pageSize=${pageSize}`, // GET  @response envelope (ReviewSummaryDto)

    REVIEWS_DRIVER: (driverId: string, pageIndex = 1, pageSize = 20) =>
      `/api/reviews/drivers/${driverId}?pageIndex=${pageIndex}&pageSize=${pageSize}`, // GET  @response envelope (ReviewSummaryDto)
  },

  // ═══════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════
  NOTIFICATIONS: {
    LIST: "/api/notifications",
    UNREAD_COUNT: "/api/notifications/unread-count",
    BY_ID: (id: string) => `/api/notifications/${id}`,
    MARK_READ: (id: string) => `/api/notifications/${id}/read`, // POST  @response void
    MARK_ALL_READ: "/api/notifications/read-all", // POST  @response envelope (MarkAllAsReadResultDto)
    DELETE: (id: string) => `/api/notifications/${id}`,
    PREFERENCES: "/api/notifications/preferences", // GET / PUT  @response envelope
  },

  // ═══════════════════════════════════════════════════════════════════
  // WALLET
  // ═══════════════════════════════════════════════════════════════════
  WALLET: {
    SUMMARY: "/api/wallet", // GET  @response envelope (WalletSummaryDto)
    TRANSACTIONS: "/api/wallet/transactions", // GET  @response envelope (PagedResult<WalletTransactionDto>)
    TRANSACTION_BY_ID: (id: string) => `/api/wallet/transactions/${id}`,

    WITHDRAWALS: "/api/wallet/withdrawals", // GET / POST { amount }  @response envelope
    WITHDRAWAL_BY_ID: (id: string) => `/api/wallet/withdrawals/${id}`, // GET  @response envelope; DELETE  @response void

    PAYMENT_NUMBERS: "/api/wallet/payment-numbers",
    TOPUP: "/api/wallet/topup", // GET / POST  @response envelope
    TOPUP_BY_ID: (id: string) => `/api/wallet/topup/${id}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════════
  CHAT: {
    CONVERSATIONS: "/api/chat", // GET  @response envelope (PagedResult<ConversationListItemDto>); POST  @response envelope (ConversationDto)
    CONVERSATION_BY_ID: (id: string) => `/api/chat/${id}`, // GET  @response envelope (ConversationDto)
    MESSAGES: (id: string) => `/api/chat/${id}/messages`, // GET  @response envelope (PagedResult<MessageDto>); POST  @response created (MessageDto)
    SEND_ATTACHMENT: (id: string) => `/api/chat/${id}/messages/attachment`, // POST multipart: File + MessageType  @response created (MessageDto)
    UPLOAD_ONLY: (id: string) => `/api/chat/${id}/attachments`, // POST multipart: file + messageType  @response envelope (AttachmentUploadResultDto)
    MARK_READ: (id: string) => `/api/chat/${id}/read`, // POST  @response no-content (204)
    CLOSE: (id: string) => `/api/chat/${id}/close`, // POST { reason? }  @response envelope (ConversationDto)
    UNREAD_COUNT: "/api/chat/unread-count", // GET  @response envelope (ChatUnreadCountDto)
  },
} as const;

// ═════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════
export const getApiUrl = (endpoint: string): string => {
  if (import.meta.env.DEV) return endpoint;
  return `${API_BASE_URL}${endpoint}`;
};

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

// ═════════════════════════════════════════════════════════════════════
// Response-kind helpers
// ═════════════════════════════════════════════════════════════════════
export type ResponseKind = "envelope" | "void" | "no-content" | "created";

export const VOID_ENDPOINTS = {
  // Order state transitions
  ORDER_ACCEPT: "POST",
  ORDER_REJECT: "POST",
  ORDER_PREPARING: "POST",
  ORDER_READY_FOR_DRIVER: "POST",
  ORDER_PICKED_UP: "POST",
  ORDER_OUT_FOR_DELIVERY: "POST",
  ORDER_SET_STATUS: "PATCH",
  ORDER_CANCEL: "POST",
  ORDER_CANCELLATION_ACCEPT: "POST",
  ORDER_CANCELLATION_REJECT: "POST",
  ORDER_SCHEDULED_CONFIRM: "POST",
  ORDER_SCHEDULED_CANCEL: "POST",

  // Deletes (bare 200)
  MENU_CATEGORY_DELETE: "DELETE",
  PRODUCT_DELETE: "DELETE",
  PRODUCT_OPTION_DELETE: "DELETE",
  PRODUCT_OPTION_VALUE_DELETE: "DELETE",
  PRODUCT_OPTION_VALUE_SET_DEFAULT: "POST",
  OFFER_DELETE: "DELETE",
  COUPON_DELETE: "DELETE",
  OPENING_HOUR_DELETE: "DELETE",
  CITY_DELIVERY_FEE_DELETE: "DELETE",
  TYPE_APPLICATION_DELETE: "DELETE",

  // Notifications
  NOTIFICATION_MARK_READ: "POST",

  // Wallet
  WITHDRAWAL_CANCEL: "DELETE",
} as const;
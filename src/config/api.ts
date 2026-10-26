/**
 * API Configuration — Tamam Store Dashboard
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
  // ═══════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════
  AUTH: {
    // Public
    LOGIN: "/api/auth/login", // POST { phoneNumber, password, role: "StoreOwner" }
    REFRESH_TOKEN: "/api/auth/refresh", // POST { token, refreshToken }
    SOCIAL_LOGIN: "/api/auth/social-login", // POST

    // OTP — dedicated path per flow
    SEND_OTP: "/api/auth/otp/send", // POST { phoneNumber, role: "StoreOwner" }
    VERIFY_OTP: "/api/auth/otp/verify", // POST { phoneNumber, code, role }

    // Registration flow (two-step)
    REGISTER_SEND_OTP: "/api/auth/register/send-otp", // POST { phoneNumber, fullName, email, password }
    REGISTER_VERIFY_OTP: "/api/auth/register/verify-otp", // POST { phoneNumber, code }

    // Authenticated
    CHANGE_PASSWORD: "/api/auth/change-password", // POST { newPassword }
    LOGOUT: "/api/auth/logout", // POST (Bearer)
  },

  // ═══════════════════════════════════════════════════════════════════
  // FILES — generic upload (all roles)
  // ═══════════════════════════════════════════════════════════════════
  FILES: {
    // POST multipart: file + ?category=<see below>
    // Returns { url, relativePath, fileName, sizeInBytes, contentType }
    UPLOAD: "/api/files/upload",
    UPLOAD_WITH_CATEGORY: (category: string) =>
      `/api/files/upload?category=${encodeURIComponent(category)}`,

    // POST multipart: files[] + ?category=… (max 10)
    UPLOAD_MULTIPLE: "/api/files/upload-multiple",

    // DELETE /api/files/{**path} — path is the returned relativePath
    DELETE: (relativePath: string) =>
      `/api/files/${relativePath.replace(/^\/+/, "")}`,

    // GET /api/files/info?path=… (query-string form — the routing-safe version)
    INFO: (relativePath: string) =>
      `/api/files/info?path=${encodeURIComponent(relativePath)}`,

    // Categories accepted by POST /api/files/upload
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
  // STORE OWNER — Profile, Assets, Onboarding
  // ═══════════════════════════════════════════════════════════════════
  STORE: {
    // ── Dashboard & Profile ────────────────────────────────────────
    DASHBOARD: "/api/store/dashboard", // GET
    PROFILE: "/api/store/profile", // GET / PUT
    TOGGLE_OPEN: "/api/store/profile/open", // PATCH { isOpen: boolean }
    TOGGLE_BUSY: "/api/store/profile/busy",

    LOGO: "/api/store/profile/logo", // PUT { imageUrl }
    COVER: "/api/store/profile/cover", // PUT { imageUrl }

    // ── Store Type Applications ───────────────────────────────────
    TYPE_APPLICATIONS: "/api/store/type-applications", // GET (list mine)
    REQUEST_TYPE: "/api/store/type-applications", // POST { storeTypeId }
    CANCEL_TYPE_APPLICATION: (mappingId: string) =>
      `/api/store/type-applications/${mappingId}`, // DELETE

    // Public browse of types (used by the onboarding wizard)
    TYPES_AVAILABLE: "/api/store-types/active",
    TYPES_BY_CATEGORY: (categoryId: string) =>
      `/api/store-types/active?categoryId=${categoryId}`,
    TYPES_GROUPED: "/api/store-types/grouped-by-category",

    // Store categories (public browse)
    CATEGORIES_AVAILABLE: "/api/browse/store-categories",

    // ── Menu Categories ────────────────────────────────────────────
    MENU_CATEGORIES: "/api/store/menu-categories", // GET / POST
    MENU_CATEGORY_BY_ID: (id: string) => `/api/store/menu-categories/${id}`, // GET / PUT / DELETE
    MENU_CATEGORY_TOGGLE: (id: string) =>
      `/api/store/menu-categories/${id}/toggle`, // PATCH

    // ── Products ───────────────────────────────────────────────────
    PRODUCTS: "/api/store/products", // GET (paged) / POST
    PRODUCT_BY_ID: (id: string) => `/api/store/products/${id}`, // GET / PUT / DELETE

    PRODUCT_AVAILABILITY: (id: string) =>
      `/api/store/products/${id}/availability`, // PATCH { isAvailable }
    PRODUCT_FEATURED: (id: string) => `/api/store/products/${id}/featured`, // PATCH { isFeatured }
    PRODUCT_DISCOUNT: (id: string) => `/api/store/products/${id}/discount`, // PATCH { discountedPrice } / DELETE (clear)
    PRODUCT_IMAGE: (id: string) => `/api/store/products/${id}/image`, // PUT { imageUrl }

    // NOTE: "stock" is not a concept in this API yet — Product has isAvailable only.

    // ── Product Options ────────────────────────────────────────────
    // CREATE an option under a product:
    PRODUCT_OPTIONS_CREATE: (productId: string) =>
      `/api/store/products/${productId}/options`, // POST
    // UPDATE / DELETE an option:
    PRODUCT_OPTION_BY_ID: (optionId: string) =>
      `/api/store/product-options/${optionId}`, // PUT / DELETE
    // CREATE a value under an option:
    PRODUCT_OPTION_VALUES_CREATE: (optionId: string) =>
      `/api/store/product-options/${optionId}/values`, // POST

    // ── Product Option Values ──────────────────────────────────────
    PRODUCT_OPTION_VALUE_BY_ID: (valueId: string) =>
      `/api/store/product-option-values/${valueId}`, // PUT / DELETE
    PRODUCT_OPTION_VALUE_SET_DEFAULT: (valueId: string) =>
      `/api/store/product-option-values/${valueId}/default`, // POST

    // ── Offers ─────────────────────────────────────────────────────
    OFFERS: "/api/store/offers", // GET / POST
    OFFER_BY_ID: (offerId: string) => `/api/store/offers/${offerId}`, // GET / PUT / DELETE
    OFFER_TOGGLE: (offerId: string) => `/api/store/offers/${offerId}/toggle`, // PATCH
    OFFER_ADD_PRODUCT: (offerId: string) =>
      `/api/store/offers/${offerId}/products`, // POST { productId, quantity }
    OFFER_REMOVE_PRODUCT: (offerId: string, productId: string) =>
      `/api/store/offers/${offerId}/products/${productId}`, // DELETE
    // Group deals are Offers with type = "GroupDeal" — no separate endpoint.

    // ── Coupons ────────────────────────────────────────────────────
    COUPONS: "/api/store/coupons", // GET / POST
    COUPON_BY_ID: (couponId: string) => `/api/store/coupons/${couponId}`, // GET / PUT / DELETE
    COUPON_TOGGLE: (couponId: string) =>
      `/api/store/coupons/${couponId}/toggle`, // PATCH

    // ── Opening Hours ──────────────────────────────────────────────
    OPENING_HOURS: "/api/store/opening-hours", // GET / POST
    OPENING_HOUR_BY_ID: (id: string) => `/api/store/opening-hours/${id}`, // PUT / DELETE

    // ── City Delivery Fees (overrides) ─────────────────────────────
    CITY_DELIVERY_FEES: "/api/store/city-delivery-fees", // GET / POST
    CITY_DELIVERY_FEE_BY_ID: (id: string) =>
      `/api/store/city-delivery-fees/${id}`, // PUT / DELETE

    // ── Reviews ────────────────────────────────────────────────────
    REVIEWS: "/api/store/reviews", // GET ?onlyUnanswered=&pageIndex=&pageSize=
    REVIEW_REPLY: (reviewId: string) => `/api/store/reviews/${reviewId}/reply`, // POST { reply }
  },

  // ═══════════════════════════════════════════════════════════════════
  // STORE OWNER — Orders
  // ═══════════════════════════════════════════════════════════════════
  STORE_ORDERS: {
    LIST: "/api/store/orders", // GET ?status=
    STATS: "/api/store/orders/stats", // GET
    SCHEDULED: "/api/store/orders/scheduled", // GET
    BY_ID: (orderId: string) => `/api/store/orders/${orderId}`, // GET

    ACCEPT: (orderId: string) => `/api/store/orders/${orderId}/accept`, // POST
    REJECT: (orderId: string) => `/api/store/orders/${orderId}/reject`, // POST { reason }
    CANCEL: (orderId: string) => `/api/store/orders/${orderId}/cancel`, // POST { reason }

    PREPARING: (orderId: string) => `/api/store/orders/${orderId}/preparing`, // POST (accept → preparing)
    READY_FOR_DRIVER: (orderId: string) =>
      `/api/store/orders/${orderId}/ready-for-driver`, // POST
    PICKED_UP: (orderId: string) => `/api/store/orders/${orderId}/picked-up`, // POST
    OUT_FOR_DELIVERY: (orderId: string) =>
      `/api/store/orders/${orderId}/out-for-delivery`, // POST

    // Explicit status transition (fallback / admin-like)
    SET_STATUS: (orderId: string) => `/api/store/orders/${orderId}/status`, // PATCH { status, rejectionReason? }

    // Scheduled-order handshake
    CONFIRM_SCHEDULED: (orderId: string) =>
      `/api/store/orders/${orderId}/scheduled/confirm`, // POST
    CANCEL_SCHEDULED: (orderId: string) =>
      `/api/store/orders/${orderId}/scheduled/cancel`, // POST { reason }

    // Customer-initiated cancellation requests
    ACCEPT_CANCELLATION: (orderId: string) =>
      `/api/store/orders/${orderId}/cancellation/accept`, // POST
    REJECT_CANCELLATION: (orderId: string) =>
      `/api/store/orders/${orderId}/cancellation/reject`, // POST
  },

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC BROWSE (no auth)
  // ═══════════════════════════════════════════════════════════════════
  BROWSE: {
    STORE_CATEGORIES: "/api/browse/store-categories",
    STORES_NEARBY: "/api/browse/stores/nearby", // ?latitude=&longitude=&radiusKm=
    STORES_SEARCH: "/api/browse/stores/search", // ?q=&latitude=&longitude=
    STORES_FEATURED: "/api/browse/stores/featured",
    OFFERS: "/api/browse/offers",

    CITIES_BROWSE: "/api/cities/browse", // ?latitude=&longitude=
    CITIES_LOOKUP: "/api/cities/lookup",

    STORE_TYPES_ACTIVE: "/api/store-types/active", // ?categoryId=
    STORE_TYPES_GROUPED: "/api/store-types/grouped-by-category",
    STORE_TYPES_POPULAR: "/api/store-types/popular", // ?count=
  },

  // ═══════════════════════════════════════════════════════════════════
  // NOTIFICATIONS (all roles)
  // ═══════════════════════════════════════════════════════════════════
  NOTIFICATIONS: {
    LIST: "/api/notifications", // GET ?Type=&IsRead=&From=&To=&pageIndex=&pageSize=
    UNREAD_COUNT: "/api/notifications/unread-count", // GET
    BY_ID: (id: string) => `/api/notifications/${id}`, // GET
    MARK_READ: (id: string) => `/api/notifications/${id}/read`, // POST
    MARK_ALL_READ: "/api/notifications/read-all", // POST
    DELETE: (id: string) => `/api/notifications/${id}`, // DELETE

    // Notification preferences (per-user)
    PREFERENCES: "/api/notifications/preferences", // GET / PUT
  },

  // ═══════════════════════════════════════════════════════════════════
  // WALLET (shared — role determined from JWT)
  // ═══════════════════════════════════════════════════════════════════
  WALLET: {
    SUMMARY: "/api/wallet", // GET { balance, totalIn, totalOut, … }
    TRANSACTIONS: "/api/wallet/transactions", // GET ?Type=&OrderId=&From=&To=&pageIndex=&pageSize=
    TRANSACTION_BY_ID: (id: string) => `/api/wallet/transactions/${id}`, // GET

    WITHDRAWALS: "/api/wallet/withdrawals", // GET (list mine) / POST { amount }
    WITHDRAWAL_BY_ID: (id: string) => `/api/wallet/withdrawals/${id}`, // GET / DELETE (cancel pending)

    PAYMENT_NUMBERS: "/api/wallet/payment-numbers", // GET (active numbers I can send to)
    TOPUP: "/api/wallet/topup", // GET (list mine) / POST (submit proof)
    TOPUP_BY_ID: (id: string) => `/api/wallet/topup/${id}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CHAT (store owner participates like any other role)
  // ═══════════════════════════════════════════════════════════════════
  CHAT: {
    CONVERSATIONS: "/api/chat", // GET (mine) / POST (start)
    CONVERSATION_BY_ID: (id: string) => `/api/chat/${id}`, // GET
    MESSAGES: (id: string) => `/api/chat/${id}/messages`, // GET (paged) / POST (send)
    SEND_ATTACHMENT: (id: string) => `/api/chat/${id}/messages/attachment`, // POST multipart: file + messageType
    UPLOAD_ONLY: (id: string) => `/api/chat/${id}/attachments`, // POST multipart → { url } (no message)
    MARK_READ: (id: string) => `/api/chat/${id}/read`, // POST
    CLOSE: (id: string) => `/api/chat/${id}/close`, // POST { reason? }
    UNREAD_COUNT: "/api/chat/unread-count", // GET
  },
} as const;

// ═════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════
export const getApiUrl = (endpoint: string): string => {
  if (import.meta.env.DEV) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
};

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

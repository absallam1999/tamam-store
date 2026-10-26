import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  // Profile & Dashboard
  StoreProfileDto,
  UpdateStoreProfileDto,
  StoreDashboardDto,
  ToggleStoreOpenDto,
  UpdateStoreImageDto,

  // Store Types
  StoreTypeProfileDto,
  StoreTypeListDto,
  CategoryWithTypesDto,
  StoreCategoryDto,

  // Menu Categories
  MenuCategoryDto,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,

  // Products
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  SetProductAvailabilityDto,
  SetProductFeaturedDto,
  SetProductDiscountDto,

  // Options
  ProductOptionDto,
  ProductOptionValueDto,
  CreateProductOptionDto,
  CreateProductOptionValueDto,
  UpdateProductOptionDto,
  UpdateProductOptionValueDto,

  // Offers & Coupons
  OfferDto,
  CreateOfferDto,
  UpdateOfferDto,
  AddOfferProductRequest,
  StoreCouponDto,
  CreateCouponDto,
  UpdateCouponDto,

  // Orders
  StoreOrderDto,
  StoreOrderStatsDto,
  UpdateOrderStatusDto,
  RejectOrderRequest,
  CancelOrderRequest,

  // Opening Hours
  StoreOpeningHourDto,
  CreateStoreOpeningHourDto,
  UpdateStoreOpeningHourDto,

  // City Delivery Fees
  StoreCityDeliveryFeeDto,
  CreateStoreCityDeliveryFeeDto,
  UpdateStoreCityDeliveryFeeDto,

  // Reviews
  ReviewDto,
  ReplyToReviewRequest,

  // Wallet (shared)
  WalletSummaryDto,
  WalletTransactionDto,
  WithdrawalDto,
  RequestWithdrawalDto,
  PaymentNumberDto,
  SubmitTopUpRequestDto,
  TopUpRequestDto,
  TopUpFilterDto,

  // Files
  FileUploadResultDto,
  FileCategory,

  // Pagination
  PagedResult,
} from "@shared/types";

async function uploadFile(
  file: File,
  category: FileCategory,
): Promise<FileUploadResultDto> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<FileUploadResultDto>(
    ENDPOINTS.FILES.UPLOAD_WITH_CATEGORY(category),
    formData,
  );
  return response.data;
}

// ═════════════════════════════════════════════════════════════════════
// Store API
// ═════════════════════════════════════════════════════════════════════
export const storeApi = {
  // ═══════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════
  dashboard: {
    get: () =>
      apiClient
        .get<StoreDashboardDto>(ENDPOINTS.STORE.DASHBOARD)
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════
  profile: {
    get: () =>
      apiClient
        .get<StoreProfileDto>(ENDPOINTS.STORE.PROFILE)
        .then((r) => r.data),

    update: (dto: UpdateStoreProfileDto) =>
      apiClient
        .put<StoreProfileDto>(ENDPOINTS.STORE.PROFILE, dto)
        .then((r) => r.data),

    /** PATCH /api/store/profile/open — body { isOpen: boolean } */
    toggleOpen: (isOpen: boolean) =>
      apiClient
        .patch<StoreProfileDto>(ENDPOINTS.STORE.TOGGLE_OPEN, {
          isOpen,
        } satisfies ToggleStoreOpenDto)
        .then((r) => r.data),

    /**
     * Store logo — TWO-STEP:
     *   1. POST /api/files/upload?category=store-logos → { url }
     *   2. PUT  /api/store/profile/logo { imageUrl }
     */
    uploadLogo: async (file: File) => {
      const uploaded = await uploadFile(file, "store-logos");
      return apiClient
        .put<StoreProfileDto>(ENDPOINTS.STORE.LOGO, {
          imageUrl: uploaded.url,
        } satisfies UpdateStoreImageDto)
        .then((r) => r.data);
    },

    /** Same two-step flow, category = store-covers. */
    uploadCover: async (file: File) => {
      const uploaded = await uploadFile(file, "store-covers");
      return apiClient
        .put<StoreProfileDto>(ENDPOINTS.STORE.COVER, {
          imageUrl: uploaded.url,
        } satisfies UpdateStoreImageDto)
        .then((r) => r.data);
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // STORE TYPES (applications — onboarding)
  // ═══════════════════════════════════════════════════════════════════
  storeTypes: {
    /** My submitted applications: /api/store/type-applications */
    getMyApplications: () =>
      apiClient
        .get<StoreTypeProfileDto[]>(ENDPOINTS.STORE.TYPE_APPLICATIONS)
        .then((r) => r.data),

    /** Submit an application — POST { storeTypeId }. */
    requestType: (storeTypeId: string) =>
      apiClient
        .post<StoreTypeProfileDto>(ENDPOINTS.STORE.REQUEST_TYPE, {
          storeTypeId,
        })
        .then((r) => r.data),

    /** Withdraw a pending application. */
    cancelApplication: (mappingId: string) =>
      apiClient.delete<void>(
        ENDPOINTS.STORE.CANCEL_TYPE_APPLICATION(mappingId),
      ),

    /** Browse active types (from the public store-types endpoint). */
    getAvailable: () =>
      apiClient
        .get<StoreTypeListDto[]>(ENDPOINTS.BROWSE.STORE_TYPES_ACTIVE)
        .then((r) => r.data),

    getAvailableByCategory: (categoryId: string) =>
      apiClient
        .get<StoreTypeListDto[]>(ENDPOINTS.BROWSE.STORE_TYPES_ACTIVE, {
          categoryId,
        })
        .then((r) => r.data),

    /** Grouped view — categories with their types nested. */
    getGrouped: () =>
      apiClient
        .get<CategoryWithTypesDto[]>(ENDPOINTS.BROWSE.STORE_TYPES_GROUPED)
        .then((r) => r.data),

    /** Public store categories (category icon/text). */
    getCategories: () =>
      apiClient
        .get<StoreCategoryDto[]>(ENDPOINTS.BROWSE.STORE_CATEGORIES)
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // MENU CATEGORIES
  // ═══════════════════════════════════════════════════════════════════
  menuCategories: {
    list: () =>
      apiClient
        .get<MenuCategoryDto[]>(ENDPOINTS.STORE.MENU_CATEGORIES)
        .then((r) => r.data),

    get: (categoryId: string) =>
      apiClient
        .get<MenuCategoryDto>(ENDPOINTS.STORE.MENU_CATEGORY_BY_ID(categoryId))
        .then((r) => r.data),

    create: (dto: CreateMenuCategoryDto) =>
      apiClient
        .post<MenuCategoryDto>(ENDPOINTS.STORE.MENU_CATEGORIES, dto)
        .then((r) => r.data),

    update: (categoryId: string, dto: UpdateMenuCategoryDto) =>
      apiClient
        .put<MenuCategoryDto>(
          ENDPOINTS.STORE.MENU_CATEGORY_BY_ID(categoryId),
          dto,
        )
        .then((r) => r.data),

    remove: (categoryId: string) =>
      apiClient.delete<void>(ENDPOINTS.STORE.MENU_CATEGORY_BY_ID(categoryId)),

    toggleAvailability: (categoryId: string) =>
      apiClient
        .patch<MenuCategoryDto>(
          ENDPOINTS.STORE.MENU_CATEGORY_TOGGLE(categoryId),
        )
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════════
  products: {
    list: (params?: {
      menuCategoryId?: string;
      isAvailable?: boolean;
      isFeatured?: boolean;
      search?: string;
      sortBy?: string;
      pageIndex?: number;
      pageSize?: number;
    }) =>
      apiClient
        .get<PagedResult<ProductDto>>(ENDPOINTS.STORE.PRODUCTS, params)
        .then((r) => r.data),

    get: (productId: string) =>
      apiClient
        .get<ProductDto>(ENDPOINTS.STORE.PRODUCT_BY_ID(productId))
        .then((r) => r.data),

    create: (dto: CreateProductDto) =>
      apiClient
        .post<ProductDto>(ENDPOINTS.STORE.PRODUCTS, dto)
        .then((r) => r.data),

    update: (productId: string, dto: UpdateProductDto) =>
      apiClient
        .put<ProductDto>(ENDPOINTS.STORE.PRODUCT_BY_ID(productId), dto)
        .then((r) => r.data),

    remove: (productId: string) =>
      apiClient.delete<void>(ENDPOINTS.STORE.PRODUCT_BY_ID(productId)),

    /** PATCH { isAvailable } — separate from create/update. */
    setAvailability: (productId: string, isAvailable: boolean) =>
      apiClient
        .patch<ProductDto>(ENDPOINTS.STORE.PRODUCT_AVAILABILITY(productId), {
          isAvailable,
        } satisfies SetProductAvailabilityDto)
        .then((r) => r.data),

    /** PATCH { isFeatured } */
    setFeatured: (productId: string, isFeatured: boolean) =>
      apiClient
        .patch<ProductDto>(ENDPOINTS.STORE.PRODUCT_FEATURED(productId), {
          isFeatured,
        } satisfies SetProductFeaturedDto)
        .then((r) => r.data),

    /** PATCH { discountedPrice } — null clears the discount. */
    setDiscount: (productId: string, discountedPrice: number | null) =>
      apiClient
        .patch<ProductDto>(ENDPOINTS.STORE.PRODUCT_DISCOUNT(productId), {
          discountedPrice,
        } satisfies SetProductDiscountDto)
        .then((r) => r.data),

    /** Convenience — same endpoint, discount = null. */
    clearDiscount: (productId: string) =>
      apiClient
        .patch<ProductDto>(ENDPOINTS.STORE.PRODUCT_DISCOUNT(productId), {
          discountedPrice: null,
        } satisfies SetProductDiscountDto)
        .then((r) => r.data),

    /** Two-step product image — upload first, then PUT the URL. */
    uploadImage: async (productId: string, file: File) => {
      const uploaded = await uploadFile(file, "product-images");
      return apiClient
        .put<ProductDto>(ENDPOINTS.STORE.PRODUCT_IMAGE(productId), {
          imageUrl: uploaded.url,
        } satisfies UpdateStoreImageDto)
        .then((r) => r.data);
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // PRODUCT OPTIONS
  // ═══════════════════════════════════════════════════════════════════
  productOptions: {
    /**
     * Options are returned inside `ProductDto.options`. There is no
     * dedicated GET — this helper exists so callers don't need to know.
     */
    listForProduct: (productId: string) =>
      apiClient
        .get<ProductDto>(ENDPOINTS.STORE.PRODUCT_BY_ID(productId))
        .then((r) => r.data.options ?? []),

    create: (productId: string, dto: CreateProductOptionDto) =>
      apiClient
        .post<ProductOptionDto>(
          ENDPOINTS.STORE.PRODUCT_OPTIONS_CREATE(productId),
          dto,
        )
        .then((r) => r.data),

    update: (optionId: string, dto: UpdateProductOptionDto) =>
      apiClient
        .put<ProductOptionDto>(
          ENDPOINTS.STORE.PRODUCT_OPTION_BY_ID(optionId),
          dto,
        )
        .then((r) => r.data),

    remove: (optionId: string) =>
      apiClient.delete<void>(ENDPOINTS.STORE.PRODUCT_OPTION_BY_ID(optionId)),

    createValue: (optionId: string, dto: CreateProductOptionValueDto) =>
      apiClient
        .post<ProductOptionValueDto>(
          ENDPOINTS.STORE.PRODUCT_OPTION_VALUES_CREATE(optionId),
          dto,
        )
        .then((r) => r.data),

    updateValue: (valueId: string, dto: UpdateProductOptionValueDto) =>
      apiClient
        .put<ProductOptionValueDto>(
          ENDPOINTS.STORE.PRODUCT_OPTION_VALUE_BY_ID(valueId),
          dto,
        )
        .then((r) => r.data),

    removeValue: (valueId: string) =>
      apiClient.delete<void>(
        ENDPOINTS.STORE.PRODUCT_OPTION_VALUE_BY_ID(valueId),
      ),

    /** Marks this value as the default within its option group. */
    setValueDefault: (valueId: string) =>
      apiClient
        .post<ProductOptionValueDto>(
          ENDPOINTS.STORE.PRODUCT_OPTION_VALUE_SET_DEFAULT(valueId),
        )
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // OFFERS  (Standard + GroupDeal — same endpoints, different `type`)
  // ═══════════════════════════════════════════════════════════════════
  offers: {
    list: () =>
      apiClient.get<OfferDto[]>(ENDPOINTS.STORE.OFFERS).then((r) => r.data),

    get: (offerId: string) =>
      apiClient
        .get<OfferDto>(ENDPOINTS.STORE.OFFER_BY_ID(offerId))
        .then((r) => r.data),

    create: (dto: CreateOfferDto) =>
      apiClient.post<OfferDto>(ENDPOINTS.STORE.OFFERS, dto).then((r) => r.data),

    update: (offerId: string, dto: UpdateOfferDto) =>
      apiClient
        .put<OfferDto>(ENDPOINTS.STORE.OFFER_BY_ID(offerId), dto)
        .then((r) => r.data),

    remove: (offerId: string) =>
      apiClient.delete<void>(ENDPOINTS.STORE.OFFER_BY_ID(offerId)),

    /** PATCH /toggle — endpoint takes no body. */
    toggle: (offerId: string) =>
      apiClient
        .patch<OfferDto>(ENDPOINTS.STORE.OFFER_TOGGLE(offerId))
        .then((r) => r.data),

    /** POST /products with { productId, quantity } — body, not path. */
    addProduct: (offerId: string, body: AddOfferProductRequest) =>
      apiClient
        .post<OfferDto>(ENDPOINTS.STORE.OFFER_ADD_PRODUCT(offerId), body)
        .then((r) => r.data),

    removeProduct: (offerId: string, productId: string) =>
      apiClient
        .delete<OfferDto>(
          ENDPOINTS.STORE.OFFER_REMOVE_PRODUCT(offerId, productId),
        )
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // COUPONS
  // ═══════════════════════════════════════════════════════════════════
  coupons: {
    list: () =>
      apiClient
        .get<StoreCouponDto[]>(ENDPOINTS.STORE.COUPONS)
        .then((r) => r.data),

    get: (couponId: string) =>
      apiClient
        .get<StoreCouponDto>(ENDPOINTS.STORE.COUPON_BY_ID(couponId))
        .then((r) => r.data),

    create: (dto: CreateCouponDto) =>
      apiClient
        .post<StoreCouponDto>(ENDPOINTS.STORE.COUPONS, dto)
        .then((r) => r.data),

    update: (couponId: string, dto: UpdateCouponDto) =>
      apiClient
        .put<StoreCouponDto>(ENDPOINTS.STORE.COUPON_BY_ID(couponId), dto)
        .then((r) => r.data),

    remove: (couponId: string) =>
      apiClient.delete<void>(ENDPOINTS.STORE.COUPON_BY_ID(couponId)),

    /** PATCH /toggle — endpoint takes no body. */
    toggle: (couponId: string) =>
      apiClient
        .patch<StoreCouponDto>(ENDPOINTS.STORE.COUPON_TOGGLE(couponId))
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════════
  orders: {
    list: (status?: string) =>
      apiClient
        .get<
          StoreOrderDto[]
        >(ENDPOINTS.STORE_ORDERS.LIST, status ? { status } : undefined)
        .then((r) => r.data),

    get: (orderId: string) =>
      apiClient
        .get<StoreOrderDto>(ENDPOINTS.STORE_ORDERS.BY_ID(orderId))
        .then((r) => r.data),

    stats: () =>
      apiClient
        .get<StoreOrderStatsDto>(ENDPOINTS.STORE_ORDERS.STATS)
        .then((r) => r.data),

    scheduled: () =>
      apiClient
        .get<StoreOrderDto[]>(ENDPOINTS.STORE_ORDERS.SCHEDULED)
        .then((r) => r.data),

    // ── State transitions ──────────────────────────────────────────
    accept: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.ACCEPT(orderId)),

    reject: (orderId: string, reason: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.REJECT(orderId), {
        reason,
      } satisfies RejectOrderRequest),

    cancel: (orderId: string, reason: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.CANCEL(orderId), {
        reason,
      } satisfies CancelOrderRequest),

    markPreparing: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.PREPARING(orderId)),

    readyForDriver: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.READY_FOR_DRIVER(orderId)),

    pickedUp: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.PICKED_UP(orderId)),

    outForDelivery: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.OUT_FOR_DELIVERY(orderId)),

    /** PATCH /status — not PUT. */
    setStatus: (orderId: string, dto: UpdateOrderStatusDto) =>
      apiClient.patch<void>(ENDPOINTS.STORE_ORDERS.SET_STATUS(orderId), dto),

    // ── Scheduled-order handshake ──────────────────────────────────
    confirmScheduled: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.CONFIRM_SCHEDULED(orderId)),

    cancelScheduled: (orderId: string, reason: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.CANCEL_SCHEDULED(orderId), {
        reason,
      } satisfies CancelOrderRequest),

    // ── Customer-initiated cancellation ────────────────────────────
    acceptCancellation: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.ACCEPT_CANCELLATION(orderId)),

    rejectCancellation: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.REJECT_CANCELLATION(orderId)),
  },

  // ═══════════════════════════════════════════════════════════════════
  // OPENING HOURS
  // ═══════════════════════════════════════════════════════════════════
  openingHours: {
    list: () =>
      apiClient
        .get<StoreOpeningHourDto[]>(ENDPOINTS.STORE.OPENING_HOURS)
        .then((r) => r.data),

    create: (dto: CreateStoreOpeningHourDto) =>
      apiClient
        .post<StoreOpeningHourDto>(ENDPOINTS.STORE.OPENING_HOURS, dto)
        .then((r) => r.data),

    update: (hourId: string, dto: UpdateStoreOpeningHourDto) =>
      apiClient
        .put<StoreOpeningHourDto>(
          ENDPOINTS.STORE.OPENING_HOUR_BY_ID(hourId),
          dto,
        )
        .then((r) => r.data),

    remove: (hourId: string) =>
      apiClient.delete<void>(ENDPOINTS.STORE.OPENING_HOUR_BY_ID(hourId)),
  },

  // ═══════════════════════════════════════════════════════════════════
  // CITY DELIVERY FEES (per-store overrides)
  // ═══════════════════════════════════════════════════════════════════
  cityDeliveryFees: {
    list: () =>
      apiClient
        .get<StoreCityDeliveryFeeDto[]>(ENDPOINTS.STORE.CITY_DELIVERY_FEES)
        .then((r) => r.data),

    create: (dto: CreateStoreCityDeliveryFeeDto) =>
      apiClient
        .post<StoreCityDeliveryFeeDto>(ENDPOINTS.STORE.CITY_DELIVERY_FEES, dto)
        .then((r) => r.data),

    update: (id: string, dto: UpdateStoreCityDeliveryFeeDto) =>
      apiClient
        .put<StoreCityDeliveryFeeDto>(
          ENDPOINTS.STORE.CITY_DELIVERY_FEE_BY_ID(id),
          dto,
        )
        .then((r) => r.data),

    remove: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.STORE.CITY_DELIVERY_FEE_BY_ID(id)),
  },

  // ═══════════════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════════════
  reviews: {
    list: (params?: {
      onlyUnanswered?: boolean;
      pageIndex?: number;
      pageSize?: number;
    }) =>
      apiClient
        .get<PagedResult<ReviewDto>>(ENDPOINTS.STORE.REVIEWS, params)
        .then((r) => r.data),

    reply: (reviewId: string, reply: string) =>
      apiClient
        .post<ReviewDto>(ENDPOINTS.STORE.REVIEW_REPLY(reviewId), {
          reply,
        } satisfies ReplyToReviewRequest)
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // WALLET (shared — endpoint is /api/wallet, not /api/store/wallet)
  // ═══════════════════════════════════════════════════════════════════
  wallet: {
    // ── Summary ────────────────────────────────────────────────────
    get: () =>
      apiClient
        .get<WalletSummaryDto>(ENDPOINTS.WALLET.SUMMARY)
        .then((r) => r.data),

    // ── Transactions ───────────────────────────────────────────────
    transactions: (params?: {
      type?: string;
      orderId?: string;
      from?: string;
      to?: string;
      pageIndex?: number;
      pageSize?: number;
    }) =>
      apiClient
        .get<
          PagedResult<WalletTransactionDto>
        >(ENDPOINTS.WALLET.TRANSACTIONS, params)
        .then((r) => r.data),

    transaction: (id: string) =>
      apiClient
        .get<WalletTransactionDto>(ENDPOINTS.WALLET.TRANSACTION_BY_ID(id))
        .then((r) => r.data),

    // ── Withdrawals ────────────────────────────────────────────────
    withdrawals: (params?: {
      status?: string;
      from?: string;
      to?: string;
      pageIndex?: number;
      pageSize?: number;
    }) =>
      apiClient
        .get<PagedResult<WithdrawalDto>>(ENDPOINTS.WALLET.WITHDRAWALS, params)
        .then((r) => r.data),

    /** POST /api/wallet/withdrawals { amount } — returns the new withdrawal. */
    requestWithdrawal: (dto: RequestWithdrawalDto) =>
      apiClient
        .post<WithdrawalDto>(ENDPOINTS.WALLET.WITHDRAWALS, dto)
        .then((r) => r.data),

    /** Cancel a pending withdrawal. */
    cancelWithdrawal: (id: string) =>
      apiClient
        .delete<WithdrawalDto>(ENDPOINTS.WALLET.WITHDRAWAL_BY_ID(id))
        .then((r) => r.data),

    // ── Top-up / Deposit ───────────────────────────────────────────
    /**
     * GET /api/wallet/payment-numbers
     * Active admin-owned payment numbers the caller can send money to.
     * Backs the "where do I transfer?" step of the deposit flow.
     */
    getPaymentNumbers: () =>
      apiClient
        .get<PaymentNumberDto[]>(ENDPOINTS.WALLET.PAYMENT_NUMBERS)
        .then((r) => r.data),

    /**
     * POST /api/wallet/topup
     * Submits proof of payment. Creates a `Pending` PaymentConfirmation
     * that enters the admin verification queue.
     */
    submitTopUp: (dto: SubmitTopUpRequestDto) =>
      apiClient
        .post<TopUpRequestDto>(ENDPOINTS.WALLET.TOPUP, dto)
        .then((r) => r.data),

    /**
     * GET /api/wallet/topup
     * Paginated list of the caller's own top-up requests, newest first.
     */
    getTopUps: (params?: TopUpFilterDto) =>
      apiClient
        .get<PagedResult<TopUpRequestDto>>(ENDPOINTS.WALLET.TOPUP, params)
        .then((r) => r.data),

    /**
     * GET /api/wallet/topup/{id}
     * Single top-up request — used by the client to poll status while
     * the admin reviews the proof.
     */
    getTopUpById: (id: string) =>
      apiClient
        .get<TopUpRequestDto>(ENDPOINTS.WALLET.TOPUP_BY_ID(id))
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // FILES (generic helpers for anything that uploads then references)
  // ═══════════════════════════════════════════════════════════════════
  files: {
    upload: (file: File, category: FileCategory = "general") =>
      uploadFile(file, category),

    uploadMany: async (files: File[], category: FileCategory = "general") => {
      const formData = new FormData();
      // Server parameter is `List<IFormFile> files` → field name = "files"
      files.forEach((f) => formData.append("files", f));

      const url =
        ENDPOINTS.FILES.UPLOAD_MULTIPLE +
        `?category=${encodeURIComponent(category)}`;

      return apiClient
        .post<{
          files: FileUploadResultDto[];
          successCount: number;
          failureCount: number;
          errors: string[];
        }>(url, formData)
        .then((r) => r.data);
    },

    remove: (relativePath: string) =>
      apiClient.delete<void>(ENDPOINTS.FILES.DELETE(relativePath)),
  },
};

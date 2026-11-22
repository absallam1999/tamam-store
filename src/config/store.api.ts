import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  // Profile & Dashboard
  StoreProfileDto,
  UpdateStoreProfileDto,
  StoreDashboardDto,
  ToggleStoreOpenDto,
  ToggleStoreBusyDto,
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
  OrderStatus,
  UpdateOrderStatusDto,
  RejectOrderRequest,
  CancelOrderRequest,

  // Opening Hours
  StoreOpeningHourDto,
  CreateStoreOpeningHourDto,
  UpdateStoreOpeningHourDto,

  // City Delivery Fees + Cities
  CityListDto,
  StoreCityDeliveryFeeDto,
  CreateStoreCityDeliveryFeeDto,
  UpdateStoreCityDeliveryFeeDto,

  // Reviews
  ReviewDto,
  ReplyToReviewRequest,

  // Wallet
  WithdrawalStatus,
  WalletSummaryDto,
  WalletTransactionDto,
  WithdrawalDto,
  RequestWithdrawalDto,
  PaymentNumberDto,
  SubmitTopUpRequestDto,
  TopUpRequestDto,
  TopUpFilterDto,

  // Notifications
  NotificationDto,
  NotificationFilterDto,
  UnreadCountDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
  MarkAllAsReadResultDto,

  // Chat
  ConversationDto,
  ConversationListItemDto,
  MessageDto,
  SendMessageDto,
  CreateConversationDto,
  CloseConversationDto,
  AttachmentUploadResultDto,
  ChatUnreadCountDto,
  MessageType,

  // Files
  FileUploadResultDto,
  MultipleFileUploadResultDto,
  FileInfoDto,
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

    /** PATCH /api/store/profile/open */
    toggleOpen: (isOpen: boolean) =>
      apiClient
        .patch<StoreProfileDto>(ENDPOINTS.STORE.TOGGLE_OPEN, {
          isOpen,
        } satisfies ToggleStoreOpenDto)
        .then((r) => r.data),

    /** PATCH /api/store/profile/busy */
    toggleBusy: (isBusy: boolean) =>
      apiClient
        .patch<StoreProfileDto>(ENDPOINTS.STORE.TOGGLE_BUSY, {
          isBusy,
        } satisfies ToggleStoreBusyDto)
        .then((r) => r.data),

    uploadLogo: async (file: File) => {
      const uploaded = await uploadFile(file, "store-logos");
      return apiClient
        .put<StoreProfileDto>(ENDPOINTS.STORE.LOGO, {
          imageUrl: uploaded.url,
        } satisfies UpdateStoreImageDto)
        .then((r) => r.data);
    },

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
  // STORE TYPES
  // ═══════════════════════════════════════════════════════════════════
  storeTypes: {
    getMyApplications: () =>
      apiClient
        .get<StoreTypeProfileDto[]>(ENDPOINTS.STORE.TYPE_APPLICATIONS)
        .then((r) => r.data),

    requestType: (storeTypeId: string) =>
      apiClient
        .post<StoreTypeProfileDto>(ENDPOINTS.STORE.REQUEST_TYPE, {
          storeTypeId,
        })
        .then((r) => r.data),

    cancelApplication: (mappingId: string) =>
      apiClient.delete<void>(
        ENDPOINTS.STORE.CANCEL_TYPE_APPLICATION(mappingId),
      ),

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

    getGrouped: () =>
      apiClient
        .get<CategoryWithTypesDto[]>(ENDPOINTS.BROWSE.STORE_TYPES_GROUPED)
        .then((r) => r.data),

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

    /** PATCH { isAvailable } */
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

    /** PATCH { discountedPrice } */
    setDiscount: (productId: string, discountedPrice: number | null) =>
      apiClient
        .patch<ProductDto>(ENDPOINTS.STORE.PRODUCT_DISCOUNT(productId), {
          discountedPrice,
        } satisfies SetProductDiscountDto)
        .then((r) => r.data),

    /** Convenience */
    clearDiscount: (productId: string) =>
      apiClient
        .patch<ProductDto>(ENDPOINTS.STORE.PRODUCT_DISCOUNT(productId), {
          discountedPrice: null,
        } satisfies SetProductDiscountDto)
        .then((r) => r.data),

    /** Two-step product image */
    uploadImage: async (productId: string, file: File) => {
      const uploaded = await uploadFile(file, "product-images");
      return apiClient
        .put<ProductDto>(ENDPOINTS.STORE.PRODUCT_IMAGE(productId), {
          imageUrl: uploaded.url,
        } satisfies UpdateStoreImageDto)
        .then((r) => r.data);
    },

    /** Sets the image URL directly */
    setImage: (productId: string, imageUrl: string) =>
      apiClient
        .put<ProductDto>(ENDPOINTS.STORE.PRODUCT_IMAGE(productId), {
          imageUrl,
        } satisfies UpdateStoreImageDto)
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // PRODUCT OPTIONS
  // ═══════════════════════════════════════════════════════════════════
  productOptions: {
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

    setValueDefault: (valueId: string) =>
      apiClient.post<void>(
        ENDPOINTS.STORE.PRODUCT_OPTION_VALUE_SET_DEFAULT(valueId),
      ),
  },

  // ═══════════════════════════════════════════════════════════════════
  // OFFERS
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

    /** PATCH /toggle */
    toggle: (offerId: string) =>
      apiClient
        .patch<OfferDto>(ENDPOINTS.STORE.OFFER_TOGGLE(offerId))
        .then((r) => r.data),

    /** POST /products with { productId, quantity } */
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

    /** PATCH /toggle */
    toggle: (couponId: string) =>
      apiClient
        .patch<StoreCouponDto>(ENDPOINTS.STORE.COUPON_TOGGLE(couponId))
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════════
  orders: {
    list: (status?: OrderStatus) =>
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

    // ── State transitions ────────────────────
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

    /**
     * PATCH /status
     */
    setStatus: (orderId: string, dto: UpdateOrderStatusDto) =>
      apiClient.patch<void>(ENDPOINTS.STORE_ORDERS.SET_STATUS(orderId), dto),

    // ── Scheduled-order handshake ──────────────────────────────────
    confirmScheduled: (orderId: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.CONFIRM_SCHEDULED(orderId)),

    cancelScheduled: (orderId: string, reason: string) =>
      apiClient.post<void>(ENDPOINTS.STORE_ORDERS.CANCEL_SCHEDULED(orderId), {
        reason,
      } satisfies CancelOrderRequest),

    // ── Customer-initiated cancellation (no body) ──────────────────
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
  // CITY DELIVERY FEES
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

    getCities: () =>
      apiClient
        .get<CityListDto[]>(ENDPOINTS.BROWSE.CITIES_LOOKUP)
        .then((r) => r.data),
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
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════
  notifications: {
    list: (params?: NotificationFilterDto) =>
      apiClient
        .get<PagedResult<NotificationDto>>(ENDPOINTS.NOTIFICATIONS.LIST, params)
        .then((r) => r.data),

    unreadCount: () =>
      apiClient
        .get<UnreadCountDto>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT)
        .then((r) => r.data),

    get: (id: string) =>
      apiClient
        .get<NotificationDto>(ENDPOINTS.NOTIFICATIONS.BY_ID(id))
        .then((r) => r.data),

    markRead: (id: string) =>
      apiClient.post<void>(ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),

    markAllRead: () =>
      apiClient
        .post<MarkAllAsReadResultDto>(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ)
        .then((r) => r.data),

    remove: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.NOTIFICATIONS.DELETE(id)),

    getPreferences: () =>
      apiClient
        .get<NotificationPreferencesDto>(ENDPOINTS.NOTIFICATIONS.PREFERENCES)
        .then((r) => r.data),

    updatePreferences: (dto: UpdateNotificationPreferencesDto) =>
      apiClient
        .put<NotificationPreferencesDto>(
          ENDPOINTS.NOTIFICATIONS.PREFERENCES,
          dto,
        )
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════════
  chat: {
    listConversations: (params?: {
      status?: string;
      search?: string;
      sortBy?: string;
      pageIndex?: number;
      pageSize?: number;
    }) =>
      apiClient
        .get<
          PagedResult<ConversationListItemDto>
        >(ENDPOINTS.CHAT.CONVERSATIONS, params)
        .then((r) => r.data),

    getConversation: (id: string) =>
      apiClient
        .get<ConversationDto>(ENDPOINTS.CHAT.CONVERSATION_BY_ID(id))
        .then((r) => r.data),

    createConversation: (dto: CreateConversationDto) =>
      apiClient
        .post<ConversationDto>(ENDPOINTS.CHAT.CONVERSATIONS, dto)
        .then((r) => r.data),

    listMessages: (
      id: string,
      params?: {
        since?: string;
        before?: string;
        messageType?: MessageType;
        order?: string;
        pageIndex?: number;
        pageSize?: number;
      },
    ) =>
      apiClient
        .get<PagedResult<MessageDto>>(ENDPOINTS.CHAT.MESSAGES(id), params)
        .then((r) => r.data),

    sendMessage: (id: string, dto: SendMessageDto) =>
      apiClient
        .post<MessageDto>(ENDPOINTS.CHAT.MESSAGES(id), dto)
        .then((r) => r.data),

    /** Sends an attachment as a chat message */
    sendAttachment: async (
      id: string,
      file: File,
      messageType: MessageType = "Image",
    ) => {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("MessageType", messageType);

      return apiClient
        .post<MessageDto>(ENDPOINTS.CHAT.SEND_ATTACHMENT(id), formData)
        .then((r) => r.data);
    },

    /** Upload-only */
    uploadOnly: async (
      id: string,
      file: File,
      messageType: MessageType = "Image",
    ) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("messageType", messageType);

      return apiClient
        .post<AttachmentUploadResultDto>(
          ENDPOINTS.CHAT.UPLOAD_ONLY(id),
          formData,
        )
        .then((r) => r.data);
    },

    /** POST /{id}/read — 204 no content. */
    markRead: (id: string) =>
      apiClient.post<void>(ENDPOINTS.CHAT.MARK_READ(id)),

    /** POST /{id}/close — returns the updated ConversationDto. */
    close: (id: string, reason?: string) =>
      apiClient
        .post<ConversationDto>(ENDPOINTS.CHAT.CLOSE(id), {
          reason,
        } satisfies CloseConversationDto)
        .then((r) => r.data),

    unreadCount: () =>
      apiClient
        .get<ChatUnreadCountDto>(ENDPOINTS.CHAT.UNREAD_COUNT)
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // WALLET
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
      status?: WithdrawalStatus;
      from?: string;
      to?: string;
      pageIndex?: number;
      pageSize?: number;
    }) =>
      apiClient
        .get<PagedResult<WithdrawalDto>>(ENDPOINTS.WALLET.WITHDRAWALS, params)
        .then((r) => r.data),

    /** POST /api/wallet/withdrawals */
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
     */
    getPaymentNumbers: () =>
      apiClient
        .get<PaymentNumberDto[]>(ENDPOINTS.WALLET.PAYMENT_NUMBERS)
        .then((r) => r.data),

    /**
     * POST /api/wallet/topup
     */
    submitTopUp: (dto: SubmitTopUpRequestDto) =>
      apiClient
        .post<TopUpRequestDto>(ENDPOINTS.WALLET.TOPUP, dto)
        .then((r) => r.data),

    /** GET /api/wallet/topup */
    getTopUps: (params?: TopUpFilterDto) =>
      apiClient
        .get<PagedResult<TopUpRequestDto>>(ENDPOINTS.WALLET.TOPUP, params)
        .then((r) => r.data),

    /** GET /api/wallet/topup/{id} */
    getTopUpById: (id: string) =>
      apiClient
        .get<TopUpRequestDto>(ENDPOINTS.WALLET.TOPUP_BY_ID(id))
        .then((r) => r.data),
  },

  // ═══════════════════════════════════════════════════════════════════
  // FILES
  // ═══════════════════════════════════════════════════════════════════
  files: {
    upload: (file: File, category: FileCategory = "general") =>
      uploadFile(file, category),

    uploadMany: async (
      files: File[],
      category: FileCategory = "general",
    ): Promise<MultipleFileUploadResultDto> => {
      const formData = new FormData();
      // Server parameter is `List<IFormFile> files` → field name = "files"
      files.forEach((f) => formData.append("files", f));

      const url =
        ENDPOINTS.FILES.UPLOAD_MULTIPLE +
        `?category=${encodeURIComponent(category)}`;

      return apiClient
        .post<MultipleFileUploadResultDto>(url, formData)
        .then((r) => r.data);
    },

    remove: (relativePath: string) =>
      apiClient.delete<void>(ENDPOINTS.FILES.DELETE(relativePath)),

    info: (relativePath: string) =>
      apiClient
        .get<FileInfoDto>(ENDPOINTS.FILES.INFO(relativePath))
        .then((r) => r.data),
  },
};

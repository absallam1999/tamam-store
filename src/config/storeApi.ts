import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  StoreProfileDto,
  UpdateStoreProfileDto,
  StoreTypeDto,
  StoreTypeMappingDto,
  MenuCategoryDto,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  ProductOptionGroupDto,
  CreateProductOptionDto,
  CreateProductOptionValueDto,
  OfferDto,
  CreateOfferDto,
  UpdateOfferDto,
  CouponDto,
  CreateCouponDto,
  UpdateCouponDto,
  StoreOrderDto,
  UpdateOrderStatusDto,
  StoreOrderStatsDto,
  StoreWalletDto,
  GroupDealDto,
  CreateGroupDealDto,
  UpdateGroupDealDto,
} from "@shared/types";

export const storeApi = {
  // ============================================================
  // Profile
  // ============================================================

  getProfile: () =>
    apiClient.get<StoreProfileDto>(ENDPOINTS.STORE.PROFILE).then((r) => r.data),

  updateProfile: (dto: UpdateStoreProfileDto) =>
    apiClient
      .put<StoreProfileDto>(ENDPOINTS.STORE.PROFILE, dto)
      .then((r) => r.data),

  toggleOpen: (isOpen: boolean) =>
    apiClient.patch<void>(ENDPOINTS.STORE.TOGGLE_OPEN, { isOpen }),

  uploadLogo: (formData: FormData) =>
    apiClient
      .post<{ url: string }>(ENDPOINTS.STORE.LOGO, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      } as any)
      .then((r) => r.data),

  uploadCover: (formData: FormData) =>
    apiClient
      .post<{ url: string }>(ENDPOINTS.STORE.COVER, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      } as any)
      .then((r) => r.data),

  // ============================================================
  // Store Types
  // ============================================================

  getStoreTypes: () =>
    apiClient
      .get<StoreTypeMappingDto[]>(ENDPOINTS.STORE.TYPES)
      .then((r) => r.data),

  getAvailableStoreTypes: () =>
    apiClient
      .get<StoreTypeDto[]>(ENDPOINTS.STORE.TYPES_AVAILABLE)
      .then((r) => r.data),

  getAvailableCategories: () =>
    apiClient
      .get<any[]>(ENDPOINTS.STORE.CATEGORIES_AVAILABLE)
      .then((r) => r.data),

  getAvailableStoreTypesByCategory: (categoryId: string) =>
    apiClient
      .get<StoreTypeDto[]>(ENDPOINTS.STORE.TYPES_BY_CATEGORY(categoryId))
      .then((r) => r.data),

  addStoreType: (storeTypeId: string) =>
    apiClient.post<void>(ENDPOINTS.STORE.ADD_TYPE(storeTypeId)),

  removeStoreType: (mappingId: string) =>
    apiClient.delete<void>(ENDPOINTS.STORE.REMOVE_TYPE(mappingId)),

  // ============================================================
  // Menu Categories
  // ============================================================

  getMenuCategories: () =>
    apiClient
      .get<MenuCategoryDto[]>(ENDPOINTS.STORE.CATEGORIES)
      .then((r) => r.data),

  getMenuCategory: (categoryId: string) =>
    apiClient
      .get<MenuCategoryDto>(ENDPOINTS.STORE.CATEGORY_BY_ID(categoryId))
      .then((r) => r.data),

  createMenuCategory: (dto: CreateMenuCategoryDto) =>
    apiClient
      .post<MenuCategoryDto>(ENDPOINTS.STORE.CATEGORIES, dto)
      .then((r) => r.data),

  updateMenuCategory: (categoryId: string, dto: UpdateMenuCategoryDto) =>
    apiClient
      .put<MenuCategoryDto>(ENDPOINTS.STORE.CATEGORY_BY_ID(categoryId), dto)
      .then((r) => r.data),

  deleteMenuCategory: (categoryId: string) =>
    apiClient.delete<void>(ENDPOINTS.STORE.CATEGORY_BY_ID(categoryId)),

  // ============================================================
  // Products
  // ============================================================

  getProducts: (categoryId?: string) => {
    const params = categoryId ? { categoryId } : undefined;
    return apiClient
      .get<ProductDto[]>(ENDPOINTS.STORE.PRODUCTS, params)
      .then((r) => r.data);
  },

  getProduct: (productId: string) =>
    apiClient
      .get<ProductDto>(ENDPOINTS.STORE.PRODUCT_BY_ID(productId))
      .then((r) => r.data),

  createProduct: (dto: CreateProductDto) =>
    apiClient
      .post<ProductDto>(ENDPOINTS.STORE.PRODUCTS, dto)
      .then((r) => r.data),

  updateProduct: (productId: string, dto: UpdateProductDto) =>
    apiClient
      .put<ProductDto>(ENDPOINTS.STORE.PRODUCT_BY_ID(productId), dto)
      .then((r) => r.data),

  deleteProduct: (productId: string) =>
    apiClient.delete<void>(ENDPOINTS.STORE.PRODUCT_BY_ID(productId)),

  toggleProductAvailability: (productId: string) =>
    apiClient.patch<void>(
      ENDPOINTS.STORE.PRODUCT_TOGGLE_AVAILABILITY(productId),
    ),

  uploadProductImage: (productId: string, formData: FormData) =>
    apiClient
      .post<{ url: string }>(
        ENDPOINTS.STORE.PRODUCT_IMAGE(productId),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        } as any,
      )
      .then((r) => r.data),

  // ============================================================
  // Product Options
  // ============================================================

  getProductOptions: (productId: string) =>
    apiClient
      .get<ProductOptionGroupDto[]>(ENDPOINTS.STORE.PRODUCT_OPTIONS(productId))
      .then((r) => r.data),

  createProductOption: (productId: string, dto: CreateProductOptionDto) =>
    apiClient
      .post<ProductOptionGroupDto>(
        ENDPOINTS.STORE.PRODUCT_OPTIONS(productId),
        dto,
      )
      .then((r) => r.data),

  deleteProductOption: (optionId: string) =>
    apiClient.delete<void>(ENDPOINTS.STORE.PRODUCT_OPTION_BY_ID(optionId)),

  createProductOptionValue: (
    optionId: string,
    dto: CreateProductOptionValueDto,
  ) =>
    apiClient.post<void>(ENDPOINTS.STORE.PRODUCT_OPTION_VALUES(optionId), dto),

  deleteProductOptionValue: (valueId: string) =>
    apiClient.delete<void>(ENDPOINTS.STORE.PRODUCT_OPTION_VALUE_BY_ID(valueId)),

  // ============================================================
  // Offers
  // ============================================================

  getOffers: () =>
    apiClient.get<OfferDto[]>(ENDPOINTS.STORE.OFFERS).then((r) => r.data),

  getOffer: (offerId: string) =>
    apiClient
      .get<OfferDto>(ENDPOINTS.STORE.OFFER_BY_ID(offerId))
      .then((r) => r.data),

  createOffer: (dto: CreateOfferDto) =>
    apiClient.post<OfferDto>(ENDPOINTS.STORE.OFFERS, dto).then((r) => r.data),

  updateOffer: (offerId: string, dto: UpdateOfferDto) =>
    apiClient
      .put<OfferDto>(ENDPOINTS.STORE.OFFER_BY_ID(offerId), dto)
      .then((r) => r.data),

  deleteOffer: (offerId: string) =>
    apiClient.delete<void>(ENDPOINTS.STORE.OFFER_BY_ID(offerId)),

  toggleOfferActive: (offerId: string) =>
    apiClient.patch<void>(ENDPOINTS.STORE.OFFER_TOGGLE_ACTIVE(offerId)),

  addProductToOffer: (offerId: string, productId: string) =>
    apiClient.post<void>(ENDPOINTS.STORE.OFFER_ADD_PRODUCT(offerId, productId)),

  removeProductFromOffer: (offerId: string, productId: string) =>
    apiClient.delete<void>(
      ENDPOINTS.STORE.OFFER_REMOVE_PRODUCT(offerId, productId),
    ),

  // ============================================================
  // Coupons
  // ============================================================

  getCoupons: () =>
    apiClient.get<CouponDto[]>(ENDPOINTS.STORE.COUPONS).then((r) => r.data),

  getCoupon: (couponId: string) =>
    apiClient
      .get<CouponDto>(ENDPOINTS.STORE.COUPON_BY_ID(couponId))
      .then((r) => r.data),

  createCoupon: (dto: CreateCouponDto) =>
    apiClient.post<CouponDto>(ENDPOINTS.STORE.COUPONS, dto).then((r) => r.data),

  updateCoupon: (couponId: string, dto: UpdateCouponDto) =>
    apiClient
      .put<CouponDto>(ENDPOINTS.STORE.COUPON_BY_ID(couponId), dto)
      .then((r) => r.data),

  deleteCoupon: (couponId: string) =>
    apiClient.delete<void>(ENDPOINTS.STORE.COUPON_BY_ID(couponId)),

  toggleCouponActive: (couponId: string) =>
    apiClient.patch<void>(ENDPOINTS.STORE.COUPON_TOGGLE_ACTIVE(couponId)),

  // ============================================================
  // Group Deals
  // ============================================================

  getGroupDeals: () =>
    apiClient
      .get<
        GroupDealDto[]
      >(ENDPOINTS.STORE.GROUP_DEALS || "/api/store/group-deals")
      .then((r) => r.data),

  getGroupDeal: (dealId: string) =>
    apiClient
      .get<GroupDealDto>(
        `${ENDPOINTS.STORE.GROUP_DEALS || "/api/store/group-deals"}/${dealId}`,
      )
      .then((r) => r.data),

  createGroupDeal: (dto: CreateGroupDealDto) =>
    apiClient
      .post<GroupDealDto>(
        ENDPOINTS.STORE.GROUP_DEALS || "/api/store/group-deals",
        dto,
      )
      .then((r) => r.data),

  updateGroupDeal: (dealId: string, dto: UpdateGroupDealDto) =>
    apiClient
      .put<GroupDealDto>(
        `${ENDPOINTS.STORE.GROUP_DEALS || "/api/store/group-deals"}/${dealId}`,
        dto,
      )
      .then((r) => r.data),

  deleteGroupDeal: (dealId: string) =>
    apiClient.delete<void>(
      `${ENDPOINTS.STORE.GROUP_DEALS || "/api/store/group-deals"}/${dealId}`,
    ),

  // ============================================================
  // Orders
  // ============================================================

  getOrders: (status?: string) => {
    const params = status ? { status } : undefined;
    return apiClient
      .get<StoreOrderDto[]>(ENDPOINTS.STORE.ORDERS, params)
      .then((r) => r.data);
  },

  getOrder: (orderId: string) =>
    apiClient
      .get<StoreOrderDto>(ENDPOINTS.STORE.ORDER_BY_ID(orderId))
      .then((r) => r.data),

  acceptOrder: (orderId: string) =>
    apiClient.post<void>(ENDPOINTS.STORE.ORDER_ACCEPT(orderId)),

  rejectOrder: (orderId: string, reason?: string) =>
    apiClient.post<void>(ENDPOINTS.STORE.ORDER_REJECT(orderId), { reason }),

  cancelOrder: (orderId: string, reason: string) =>
    apiClient.post<void>(ENDPOINTS.STORE.ORDER_CANCEL(orderId), reason),

  updateOrderStatus: (orderId: string, dto: UpdateOrderStatusDto) =>
    apiClient.put<void>(ENDPOINTS.STORE.ORDER_STATUS(orderId), dto),

  readyForDriver: (orderId: string) =>
    apiClient.post<void>(ENDPOINTS.STORE.ORDER_READY_FOR_DRIVER(orderId)),

  orderPickedUp: (orderId: string) =>
    apiClient.post<void>(ENDPOINTS.STORE.ORDER_PICKED_UP(orderId)),

  getOrderStats: () =>
    apiClient
      .get<StoreOrderStatsDto>(ENDPOINTS.STORE.ORDER_STATS)
      .then((r) => r.data),

  wallet: {
    get: () =>
      apiClient.get<StoreWalletDto>(ENDPOINTS.STORE.WALLET).then((r) => r.data),
    withdraw: (amount: number) =>
      apiClient
        .post<{
          success: boolean;
          message?: string;
        }>(ENDPOINTS.STORE.WALLET_WITHDRAW, { amount })
        .then((r) => r.data),
  },
};

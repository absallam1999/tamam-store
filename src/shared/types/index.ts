// ═════════════════════════════════════════════════════════════════════
// Tamam Store Dashboard — Types
// ═════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════
// Envelope & Pagination
// ═════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type PaginatedResponse<T> = PagedResult<T>;

// ═════════════════════════════════════════════════════════════════════
// Enums
// ═════════════════════════════════════════════════════════════════════

export type UserRole =
  | "Customer"
  | "Driver"
  | "StoreOwner"
  | "Admin"
  | "Supervisor";

export type AdminRole = "SuperAdmin" | "Admin" | "Moderator" | "Support";

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "ReadyForDriver"
  | "DriverAssigned"
  | "PickedUp"
  | "InTransit"
  | "Delivered"
  | "Cancelled"
  | "Rejected"
  | "Failed";

export type OrderType = "Immediate" | "Scheduled";

export type PaymentMethod =
  | "Cash"
  | "Card"
  | "Wallet"
  | "VodafoneCash"
  | "InstaPay"
  | "Fawry";

export type DiscountType = "Percentage" | "FixedAmount" | "BuyOneGetOne";
export type CouponType = "Percentage" | "Fixed";

export type OfferType = "Standard" | "GroupDeal";

export type CouponApprovalStatus = "Pending" | "Approved" | "Rejected";

export type StoreVerificationStatus =
  | "Pending"
  | "Verified"
  | "Rejected"
  | "Suspended";

export type StoreTypeMappingStatus = "Pending" | "Approved" | "Rejected";

export type WithdrawalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Processing"
  | "Completed"
  | "Cancelled";

export type DayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

// ═════════════════════════════════════════════════════════════════════
// Files
// ═════════════════════════════════════════════════════════════════════

export type FileCategory =
  | "avatars"
  | "store-logos"
  | "store-covers"
  | "product-images"
  | "driver-documents"
  | "general";

export interface FileUploadResultDto {
  url: string;
  relativePath: string;
  fileName: string;
  sizeInBytes: number;
  contentType: string;
}

export interface MultipleFileUploadResultDto {
  files: FileUploadResultDto[];
  successCount: number;
  failureCount: number;
  errors: string[];
}

export interface FileInfoDto {
  relativePath: string;
  publicUrl: string;
  exists: boolean;
  sizeInBytes: number;
  contentType: string;
}

// ═════════════════════════════════════════════════════════════════════
// Auth
// ═════════════════════════════════════════════════════════════════════

export interface LoginDto {
  phoneNumber: string;
  password: string;
  role?: UserRole;
}

export interface SendOtpDto {
  phoneNumber: string;
  role?: UserRole;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  code: string;
  role?: UserRole;
}

export interface RegisterOtpDto {
  phoneNumber: string;
  fullName: string;
  email?: string;
  password: string;
}

export interface VerifyRegisterOtpDto {
  phoneNumber: string;
  code: string;
}

export interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface OtpSentResponseDto {
  message?: string;
  expiresInSeconds: number;
  code?: string;
}

export interface SocialLoginDto {
  provider: string;
  token: string;
  phoneNumber?: string;
  role?: UserRole;
  referralCode?: string;
}

export interface AuthResponseDto {
  userId: string;
  phoneNumber?: string;
  fullName?: string;
  role?: UserRole;
  token?: string;
  expiresAt: string;
  refreshToken?: string;
  refreshTokenExpiresAt: string;
  isActive: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Onboarding — Public Submission
// ═════════════════════════════════════════════════════════════════════

export interface SubmitStoreOnboardingDto {
  phoneNumber: string;
  ownerName: string;
  email?: string;

  storeNameAr: string;
  storeNameEn: string;
  storeDescriptionAr?: string;
  storeDescriptionEn?: string;
  storeStreetAr?: string;
  storeStreetEn?: string;

  latitude: number;
  longitude: number;
  cityId: string;

  storeCategoryId: string;

  attachmentRelativePath?: string;
}


export interface OnboardingSubmissionResultDto {
  requestId: string;
  status: "Pending" | "Approved" | "Rejected";
  message?: string;
}

// ═════════════════════════════════════════════════════════════════════
// Store Profile
// ═════════════════════════════════════════════════════════════════════

export interface StoreTypeProfileDto {
  storeTypeMappingId: string;
  storeTypeId: string;
  nameAr?: string;
  nameEn?: string;
  iconUrl?: string;
  status: StoreTypeMappingStatus;
}

export interface StoreProfileDto {
  id: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  phoneNumber?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;

  latitude: number;
  longitude: number;
  streetAr?: string;
  streetEn?: string;

  cityId?: string;
  cityAr?: string;
  cityEn?: string;

  storeCategoryId?: string;
  storeCategoryNameAr?: string;
  storeCategoryNameEn?: string;

  isOpen: boolean;
  isBusy: boolean;
  openingTime: string;
  closingTime: string;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedPreparationMinutes: number;
  rating: number;

  verificationStatus: StoreVerificationStatus;
  approvedTypes?: StoreTypeProfileDto[];
  pendingTypes?: StoreTypeProfileDto[];
}

export interface UpdateStoreProfileDto {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  email?: string;
  latitude: number;
  longitude: number;
  streetAr?: string;
  streetEn?: string;
  cityId?: string;
  openingTime?: string;
  closingTime?: string;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedPreparationMinutes: number;
}

export interface ToggleStoreOpenDto {
  isOpen: boolean;
}

export interface ToggleStoreBusyDto {
  isBusy: boolean;
}

export interface UpdateStoreImageDto {
  imageUrl?: string;
}

// ═════════════════════════════════════════════════════════════════════
// Store Dashboard
// ═════════════════════════════════════════════════════════════════════

export interface RecentOrderDto {
  id: string;
  orderNumber?: string;
  status?: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface TopProductDto {
  productId: string;
  nameAr?: string;
  nameEn?: string;
  orderCount: number;
  revenue: number;
}

export interface StoreDashboardDto {
  storeId: string;
  storeNameAr?: string;
  storeNameEn?: string;
  isOpen: boolean;
  isBusy: boolean;
  isActive: boolean;
  verificationStatus?: StoreVerificationStatus;
  ordersToday: number;
  pendingOrders: number;
  activeOrders: number;
  completedToday: number;
  revenueToday: number;
  averageOrderValueToday: number;
  totalOrders: number;
  rating: number;
  ratingCount: number;
  totalProducts: number;
  unavailableProducts: number;
  totalCategories: number;
  reviewsAwaitingReply: number;
  reviewsLast30Days: number;
  recentOrders?: RecentOrderDto[];
  topProducts?: TopProductDto[];
}

// ═════════════════════════════════════════════════════════════════════
// Store Categories & Types
// ═════════════════════════════════════════════════════════════════════

export interface StoreTypeListDto {
  id: string;
  nameAr?: string;
  nameEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface StoreTypeDto {
  id: string;
  storeCategoryId: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  commissionRate: number;
  storeCount: number;
  createdAt: string;
}

export interface CategoryWithTypesDto {
  categoryId: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  categoryDescriptionAr?: string;
  categoryDescriptionEn?: string;
  categoryIconUrl?: string;
  categoryImageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  storeTypes?: StoreTypeListDto[];
}

export interface StoreCategoryDto {
  id: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  storeTypeCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreCategoryListDto {
  id: string;
  nameAr?: string;
  nameEn?: string;
  iconUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Public Browse — Store Categories & Types
// ═════════════════════════════════════════════════════════════════════

export interface PublicStoreCategoryDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder: number;
  storeTypeCount: number;
}

export interface PublicStoreTypeDto {
  id: string;
  nameAr: string;
  nameEn: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder: number;
  storeCategoryId: string;
}

export interface PublicStoreCategoryWithTypesDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder: number;
  storeTypes: PublicStoreTypeDto[];
}

// ═════════════════════════════════════════════════════════════════════
// Menu Categories
// ═════════════════════════════════════════════════════════════════════

export interface MenuCategoryDto {
  id: string;
  storeId: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  displayOrder: number;
  isAvailable: boolean;
  productsCount: number;
  createdAt: string;
}

export interface CreateMenuCategoryDto {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface UpdateMenuCategoryDto {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  displayOrder: number;
  isAvailable: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Products
// ═════════════════════════════════════════════════════════════════════

export interface ProductDto {
  id: string;
  storeId: string;
  storeName?: string;
  menuCategoryId: string;
  categoryName?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  discountedPrice?: number;
  effectivePrice: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  ratingCount: number;
  viewCount: number;
  orderCount: number;
  sku?: string;
  barcode?: string;
  options?: ProductOptionDto[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProductBrowseDto {
  id: string;
  storeId: string;
  menuCategoryId?: string;
  categoryName?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  discountedPrice?: number;
  effectivePrice: number;
  imageUrl?: string;
  preparationTimeMinutes?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  ratingCount: number;
}

export interface CreateProductDto {
  menuCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sku?: string;
  barcode?: string;
}

export interface UpdateProductDto {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  sku?: string;
  barcode?: string;
}

export interface SetProductDiscountDto {
  discountedPrice?: number | null;
}

export interface SetProductAvailabilityDto {
  isAvailable: boolean;
}

export interface SetProductFeaturedDto {
  isFeatured: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Product Options & Values
// ═════════════════════════════════════════════════════════════════════

export interface ProductOptionDto {
  id: string;
  productId: string;
  nameAr?: string;
  nameEn?: string;
  isRequired: boolean;
  isMultiple: boolean;
  displayOrder: number;
  values?: ProductOptionValueDto[];
  createdAt: string;
}

export interface ProductOptionValueDto {
  id: string;
  productOptionId: string;
  nameAr?: string;
  nameEn?: string;
  additionalPrice: number;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CreateProductOptionDto {
  nameAr: string;
  nameEn: string;
  isRequired: boolean;
  isMultiple: boolean;
  displayOrder: number;
  values?: CreateProductOptionValueDto[];
}

export interface CreateProductOptionValueDto {
  nameAr: string;
  nameEn: string;
  additionalPrice: number;
  isDefault: boolean;
  displayOrder: number;
}

export interface UpdateProductOptionDto {
  nameAr?: string;
  nameEn?: string;
  isRequired: boolean;
  isMultiple: boolean;
  displayOrder: number;
}

export interface UpdateProductOptionValueDto {
  nameAr?: string;
  nameEn?: string;
  additionalPrice: number;
  displayOrder: number;
}

// ═════════════════════════════════════════════════════════════════════
// Offers
// ═════════════════════════════════════════════════════════════════════

export interface OfferProductDto {
  productId: string;
  productNameAr?: string;
  productNameEn?: string;
  quantity: number;
  unitPrice: number;
  discountedPrice?: number;
  imageUrl?: string;
}

export interface OfferDto {
  id: string;
  storeId: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type?: OfferType;
  discountType?: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  imageUrl?: string;
  validFrom: string;
  validTo: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  maxUsageCount: number;
  currentUsageCount: number;
  products?: OfferProductDto[];
  createdAt: string;
}

export interface CreateGroupDealItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOfferDto {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type?: OfferType;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  imageUrl?: string;
  startTime?: string;
  endTime?: string;
  validFrom: string;
  validTo: string;
  maxUsageCount: number;
  items?: CreateGroupDealItemDto[];
  productIds?: string[];
}

export interface UpdateOfferDto {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type?: OfferType;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  imageUrl?: string;
  startTime?: string;
  endTime?: string;
  validFrom: string;
  validTo: string;
  maxUsageCount: number;
  isActive: boolean;
}

export interface AddOfferProductRequest {
  productId: string;
  quantity: number;
}

// ═════════════════════════════════════════════════════════════════════
// Coupons
// ═════════════════════════════════════════════════════════════════════

export interface StoreCouponDto {
  id: string;
  storeId: string;
  code?: string;
  type?: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUsageCount: number;
  currentUsageCount: number;
  maxPerCustomer?: number;
  validFrom: string;
  validTo: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  approvalStatus: CouponApprovalStatus;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface CreateCouponDto {
  code: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUsageCount: number;
  maxPerCustomer?: number;
  validFrom: string;
  validTo: string;
  startTime?: string;
  endTime?: string;
}

export interface UpdateCouponDto {
  code?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUsageCount: number;
  maxPerCustomer?: number;
  validFrom: string;
  validTo: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Cities
// ═════════════════════════════════════════════════════════════════════

export interface CityDto {
  id: string;
  nameAr?: string;
  nameEn?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CityListDto {
  id: string;
  nameAr?: string;
  nameEn?: string;
}

// ═════════════════════════════════════════════════════════════════════
// City Delivery Fees
// ═════════════════════════════════════════════════════════════════════

export interface StoreCityDeliveryFeeDto {
  id: string;
  storeId: string;
  cityId: string;
  cityName?: string;
  baseDeliveryFee: number;
  perKmCharge: number;
  createdAt: string;
}

export interface CreateStoreCityDeliveryFeeDto {
  cityId: string;
  baseDeliveryFee: number;
  perKmCharge: number;
}

export interface UpdateStoreCityDeliveryFeeDto {
  baseDeliveryFee: number;
  perKmCharge: number;
}

// ═════════════════════════════════════════════════════════════════════
// Store Orders
// ═════════════════════════════════════════════════════════════════════

export interface StoreOrderAddressDto {
  label?: string;
  street?: string;
  buildingNumber?: string;
  apartmentNumber?: string;
  floor?: string;
  cityId?: string;
  cityName?: string;
  district?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  additionalInstructions?: string;
  fullAddress?: string;
}

export interface StoreOrderDriverDto {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  rating: number;
  ratingCount: number;
}

export interface StoreOrderItemDto {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
  options?: string[];
}

export interface StoreOrderDto {
  id: string;
  orderNumber?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  paymentMethod?: PaymentMethod;
  pickupCode?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: StoreOrderAddressDto;
  driver?: StoreOrderDriverDto;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  specialInstructions?: string;
  rejectionReason?: string;
  scheduledDeliveryTime?: string;
  acceptedAt?: string;
  readyForPickupAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  items?: StoreOrderItemDto[];
  createdAt: string;
}

export interface StoreOrderStatsDto {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  preparingOrders: number;
  readyForDriverOrders: number;
  pickedUpOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  ordersToday: number;
  revenueToday: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationMinutes?: number | null;
  averageDeliveryMinutes?: number | null;
  lastUpdatedAt: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  rejectionReason?: string;
}

export interface RejectOrderRequest {
  reason: string;
}
export interface CancelOrderRequest {
  reason: string;
}

// ═════════════════════════════════════════════════════════════════════
// Store Opening Hours
// ═════════════════════════════════════════════════════════════════════

export interface StoreOpeningHourDto {
  id: string;
  storeId: string;
  dayOfWeek: DayOfWeek;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  isOvernight: boolean;
  createdAt: string;
}

export interface CreateStoreOpeningHourDto {
  dayOfWeek: DayOfWeek;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

export interface UpdateStoreOpeningHourDto {
  dayOfWeek: DayOfWeek;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Reviews
// ═════════════════════════════════════════════════════════════════════

export interface ReviewDto {
  id: string;
  orderId: string;
  orderNumber?: string;
  reviewerType?: string;
  reviewedType?: string;
  reviewerName?: string;
  reviewedName?: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  storeReply?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface ReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: Record<string, number>;
  reviews: PagedResult<ReviewDto>;
}

export interface ReplyToReviewRequest {
  reply: string;
}

// ═════════════════════════════════════════════════════════════════════
// Wallet
// ═════════════════════════════════════════════════════════════════════

export type PaymentConfirmationStatus = "Pending" | "Verified" | "Rejected";

export interface PaymentNumberDto {
  id: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
  label?: string;
  isActive: boolean;
}

export interface SubmitTopUpRequestDto {
  amount: number;
  paymentNumberId: string;
  phoneFrom: string;
  paymentMethod: PaymentMethod;
  screenshotUrl?: string;
  notes?: string;
}

export interface TopUpRequestDto {
  id: string;
  amount: number;
  status: PaymentConfirmationStatus;
  phoneFrom?: string;
  paymentMethod?: PaymentMethod;
  screenshotUrl?: string;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
}

export type TopUpFilterDto = {
  status?: PaymentConfirmationStatus;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
};

export interface WalletTransactionDto {
  id: string;
  type?: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  orderId?: string;
  orderNumber?: string;
  referenceNumber?: string;
  createdAt: string;
}

export interface WithdrawalDto {
  id: string;
  amount: number;
  status?: WithdrawalStatus;
  notes?: string;
  rejectionReason?: string;
  paymentReference?: string;
  processedAt?: string;
  createdAt: string;
}

export interface WalletSummaryDto {
  walletId: string;
  balance: number;
  totalIn: number;
  totalOut: number;
  currency?: string;
  minimumWithdrawalAmount: number;
  canRequestWithdrawal: boolean;
  pendingWithdrawalCount: number;
  pendingWithdrawalAmount: number;
  recentTransactions?: WalletTransactionDto[];
}

export interface RequestWithdrawalDto {
  amount: number;
}

// ═════════════════════════════════════════════════════════════════════
// Notifications
// ═════════════════════════════════════════════════════════════════════

export type NotificationType =
  | "OrderPlaced"
  | "OrderAccepted"
  | "OrderRejected"
  | "OrderPreparing"
  | "OrderReady"
  | "OrderReadyForPickup"
  | "DriverAssigned"
  | "DriverArriving"
  | "OrderPickedUp"
  | "OrderInTransit"
  | "OrderDelivered"
  | "OrderCancelled"
  | "OrderRefundInitiated"
  | "OrderRefundCompleted"
  | "NewDeliveryRequest"
  | "DeliveryOfferExpired"
  | "DeliveryReassigned"
  | "DeliveryFailed"
  | "NewMessage"
  | "ConversationAssigned"
  | "ConversationClosed"
  | "PaymentReceived"
  | "PaymentVerified"
  | "PaymentRejected"
  | "PaymentFailed"
  | "RefundProcessed"
  | "WalletCredited"
  | "WalletDebited"
  | "WithdrawalApproved"
  | "WithdrawalRejected"
  | "WithdrawalCompleted"
  | "LoyaltyEarned"
  | "LoyaltyRedeemed"
  | "LoyaltyExpiring"
  | "ReferralReward"
  | "CouponAvailable"
  | "CouponApproved"
  | "CouponRejected"
  | "StoreApproved"
  | "StoreRejected"
  | "StoreSuspended"
  | "StoreBoosted"
  | "StoreTypeApproved"
  | "StoreTypeRejected"
  | "DriverApproved"
  | "DriverRejected"
  | "DocumentApproved"
  | "DocumentRejected"
  | "DocumentExpiring"
  | "SupervisorAssigned"
  | "DriverRequestApproved"
  | "DriverRequestRejected"
  | "RequestSubmitted"
  | "RequestApproved"
  | "RequestRejected"
  | "ComplaintCreated"
  | "ComplaintResolved"
  | "NewStoreRegistration"
  | "NewDriverRegistration"
  | "OrderIssueReported"
  | "PaymentIssueReported"
  | "System"
  | "MaintenanceMode"
  | "Welcome"
  | "AccountSuspended"
  | "AccountActivated"
  | "PasswordChanged"
  | "Broadcast"
  | "Promotional";

export interface LocalizedTextDto {
  ar?: string;
  en?: string;
}

export interface NotificationPayloadDto {
  action?: string;
  targetPage?: string;
  targetId?: string;
  extra?: Record<string, string | LocalizedTextDto>;
}

export interface NotificationDto {
  id: string;
  recipientId: string;
  recipientType?: UserRole;
  type?: NotificationType;

  titleAr?: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;

  payload?: NotificationPayloadDto;
  isRead: boolean;
  readAt?: string;
  isSent: boolean;
  sentAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
}

export interface NotificationSummaryDto {
  id: string;
  type?: NotificationType;

  titleAr?: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;

  payload?: NotificationPayloadDto;
  isRead: boolean;
  createdAt: string;
}

export type NotificationFilterDto = {
  type?: NotificationType;
  isRead?: boolean;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
};

export interface UnreadCountDto {
  total: number;
  byType?: Partial<Record<NotificationType, number>>;
}

export interface NotificationPreferencesDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  chatMessages: boolean;
  systemAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom?: string;
  quietHoursTo?: string;
}

export interface UpdateNotificationPreferencesDto {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  orderUpdates?: boolean;
  promotions?: boolean;
  chatMessages?: boolean;
  systemAlerts?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursFrom?: string;
  quietHoursTo?: string;
}

export interface MarkAllAsReadResultDto {
  countMarkedAsRead: number;
  markedAt: string;
}

// ═════════════════════════════════════════════════════════════════════
// Chat
// ═════════════════════════════════════════════════════════════════════

export type SenderType = "Customer" | "Store" | "Fleet" | "Driver" | "Admin";
export type MessageType = "Text" | "Image" | "File" | "Voice";
export type ChatStatus = "Open" | "Closed";

export interface ConversationDto {
  id: string;
  participantId: string;
  participantType?: SenderType;
  participantName?: string;
  participantProfilePictureUrl?: string;
  adminId?: string;
  adminName?: string;
  orderId?: string;
  orderNumber?: string;
  status?: ChatStatus;
  subject?: string;
  createdAt: string;
  lastMessageAt?: string;
  messageCount: number;
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageFrom?: string;
}

export interface ConversationListItemDto {
  id: string;
  participantId: string;
  participantType?: SenderType;
  participantName?: string;
  participantProfilePictureUrl?: string;
  adminId?: string;
  adminName?: string;
  orderId?: string;
  orderNumber?: string;
  status?: ChatStatus;
  subject?: string;
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderType?: SenderType;
  messageType?: MessageType;
  senderName?: string;
  senderProfilePictureUrl?: string;
  content?: string;
  attachmentUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface SendMessageDto {
  content?: string;
  attachmentUrl?: string;
  messageType?: MessageType;
}

export interface CreateConversationDto {
  subject?: string;
  orderId?: string;
  firstMessage?: string;
}

export interface CloseConversationDto {
  reason?: string;
}

export interface AssignConversationDto {
  adminId: string;
}

export interface ChatUnreadCountDto {
  total: number;
  byConversation?: Record<string, number>;
}

export interface AttachmentUploadResultDto {
  url: string;
  relativePath: string;
  fileName: string;
  sizeInBytes: number;
  contentType: string;
}

// ═════════════════════════════════════════════════════════════════════
// Forward-looking
// ═════════════════════════════════════════════════════════════════════

export interface QuantityBundleDto {
  id: string;
  name: string;
  description?: string;
  productId: string;
  productName?: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  tiers?: BundleTierDto[];
}

export interface BundleTierDto {
  id: string;
  minQuantity: number;
  discountPercentage: number;
}

export interface SupportTicketDto {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalDiscountDto {
  percentage: number;
  isActive: boolean;
}

export interface WalletTopUpDto {
  amount: number;
  screenshotUrl?: string;
}
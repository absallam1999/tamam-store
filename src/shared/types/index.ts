// ═════════════════════════════════════════════════════════════════════
// Tamam Store Dashboard — Types
// ═════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════
// Envelope & Pagination
// ═════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  errors?: string[];
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
// Enums — all string-valued (JsonStringEnumConverter)
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
  | "Approved"
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

/** System.DayOfWeek order — Sunday = 0. String-serialized on the wire. */
export type DayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

// ═════════════════════════════════════════════════════════════════════
// Files — generic upload
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
  role?: UserRole; // StoreOwner for this dashboard
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

/** Registration is a two-step flow: send-otp then verify-otp. */
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

/**
 * Flat response — the server does NOT nest a `user` object.
 * Every identity field lives at the top level.
 */
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

/** Admin-only: creates a store + owner account in one call. */
export interface AdminCreateStoreDto {
  phoneNumber: string;
  ownerName: string;
  email?: string;
  password: string;
  storeNameAr: string;
  storeNameEn: string;
  storeDescriptionAr?: string;
  storeDescriptionEn?: string;
  storeStreetAr?: string;
  storeStreetEn?: string;
  latitude: number;
  longitude: number;
  cityId?: string;
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
  city?: string;
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
  city?: string;
  openingTime?: string;
  closingTime?: string;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedPreparationMinutes: number;
}

export interface ToggleStoreOpenDto {
  isOpen: boolean;
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
// Store Types (browse + onboarding)
// ═════════════════════════════════════════════════════════════════════

/** Lightweight shape returned by /api/store-types/active & /popular. */
export interface StoreTypeListDto {
  id: string;
  nameAr?: string;
  nameEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

/** Full shape returned by /api/store-types/{id} and admin endpoints. */
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
  categoryIconUrl?: string;
  displayOrder: number;
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
  productsCount: number; // ← was `productCount` in the old file
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
  effectivePrice: number; // read-only — server computes price ?? discountedPrice
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
  /** Group deals: item list with quantities. */
  items?: CreateGroupDealItemDto[];
  /** Standard offers: simple product id list. */
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
  approvalStatus?: CouponApprovalStatus;
}

// ═════════════════════════════════════════════════════════════════════
// City Delivery Fees (per-store override)
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
  productName?: string; // ← single field, not AR/EN split
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
  options?: string[]; // e.g. ["Size: Large", "Extra cheese"]
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
  status: OrderStatus | string;
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

export interface ReplyToReviewRequest {
  reply: string;
}

// ═════════════════════════════════════════════════════════════════════
// Wallet (shared — role taken from JWT)
// ═════════════════════════════════════════════════════════════════════

export type PaymentConfirmationStatus = "Pending" | "Verified" | "Rejected";

export interface PaymentNumberDto {
  id: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod | string;
  label?: string;
  isActive: boolean;
}

export interface SubmitTopUpRequestDto {
  amount: number;
  paymentNumberId: string;
  phoneFrom: string;
  paymentMethod: PaymentMethod | string;
  screenshotUrl?: string;
  notes?: string;
}

export interface TopUpRequestDto {
  id: string;
  amount: number;
  status: PaymentConfirmationStatus;
  phoneFrom?: string;
  paymentMethod?: string;
  screenshotUrl?: string;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
}

export type TopUpFilterDto = {
  status?: PaymentConfirmationStatus | string;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
};

export interface WalletTransactionDto {
  id: string;
  type?: string; // e.g. "Credit", "Debit", "OrderPayment", "Withdrawal"
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

export interface NotificationPayloadDto {
  action?: string;
  targetPage?: string;
  targetId?: string;
  extra?: Record<string, string>;
}

export interface NotificationDto {
  id: string;
  recipientId: string;
  recipientType?: string;
  type?: string;
  title?: string;
  body?: string;
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
  type?: string;
  title?: string;
  body?: string;
  payload?: NotificationPayloadDto;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFilterDto {
  type?: string;
  isRead?: boolean;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface UnreadCountDto {
  total: number;
  byType?: Record<string, number>;
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
// Chat (store owner participates like any other role)
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

// ═════════════════════════════════════════════════════════════════════
// PENDING BACKEND
// ═════════════════════════════════════════════════════════════════════

/** Public "apply as store" flow */
export interface CreateStoreRequestDto {
  name: string;
  phoneNumber: string;
  types: string;
  email?: string;
  address?: string;
  city?: string;
  brandName?: string;
  note?: string;
  requestType?: string;
  attachmentUrl?: string;
}

/** Not shipped: PATCH /api/store/busy */
export interface SetStoreBusyDto {
  isBusy: boolean;
}

/** Not shipped: product stock tracking */
export interface SetProductStockDto {
  stockQuantity: number;
  lowStockThreshold?: number;
}

/** Not shipped: quantity bundles */
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

/** Not shipped: support tickets */
export interface SupportTicketDto {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

/** Not shipped: store-level global discount */
export interface GlobalDiscountDto {
  percentage: number;
  isActive: boolean;
}

/** Not shipped: customer wallet top-up */
export interface WalletTopUpDto {
  amount: number;
  screenshotUrl?: string;
}

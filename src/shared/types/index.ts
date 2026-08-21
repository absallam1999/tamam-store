// ============================================================
// Store Types — Tamam Store Dashboard
// ============================================================

// ============================================================
// Common / Generic
// ============================================================

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp: string;
}

// ============================================================
// Enums
// ============================================================

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

export type DiscountType = 0 | 1 | "Percentage" | "Fixed";
export type CouponType = 0 | 1 | "Percentage" | "Fixed";

export type DriverStatus =
  | "available"
  | "on_trip"
  | "off_duty"
  | "on_leave"
  | "suspended";

export type StoreTypeMappingStatus = "pending" | "approved" | "rejected";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// ============================================================
// Store Profile
// ============================================================

export interface StoreProfileDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  email?: string;
  phoneNumber?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  streetAr?: string;
  streetEn?: string;
  cityId?: string;
  city?: string;
  latitude: number;
  longitude: number;
  openingTime?: string;
  closingTime?: string;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedPreparationMinutes: number;
  cancelBeforeMinutes?: number;
  isOpen: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
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
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedPreparationMinutes: number;
  cancelBeforeMinutes?: number;
  openingTime?: string;
  closingTime?: string;
}

export interface ToggleStoreOpenDto {
  isOpen: boolean;
}

// ============================================================
// Store Types
// ============================================================

export interface StoreTypeDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface StoreTypeMappingDto {
  id: string;
  storeTypeId: string;
  storeTypeName: string;
  storeTypeNameAr?: string;
  storeTypeNameEn?: string;
  status: StoreTypeMappingStatus;
  rejectionReason?: string;
}

export interface StoreCategoryDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

// ============================================================
// Menu Categories
// ============================================================

export interface MenuCategoryDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  displayOrder: number;
  isAvailable: boolean;
  productCount?: number;
}

export interface CreateMenuCategoryDto {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface UpdateMenuCategoryDto extends CreateMenuCategoryDto {
  isAvailable: boolean;
}

// ============================================================
// Products
// ============================================================

export interface ProductDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sku?: string;
  barcode?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  menuCategoryId?: string;
  menuCategoryName?: string;
  options?: ProductOptionGroupDto[];
}

export interface CreateProductDto {
  menuCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  lowStockThreshold?: number;
  options?: CreateProductOptionDto[];
}

export interface UpdateProductDto {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  lowStockThreshold?: number;
}

// ============================================================
// Product Options
// ============================================================

export interface ProductOptionGroupDto {
  id: string;
  nameAr: string;
  nameEn: string;
  isRequired: boolean;
  isMultiple: boolean;
  displayOrder: number;
  values: ProductOptionValueDto[];
}

export interface ProductOptionValueDto {
  id: string;
  nameAr: string;
  nameEn: string;
  additionalPrice: number;
  isDefault: boolean;
  displayOrder: number;
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

// ============================================================
// Offers
// ============================================================

export interface OfferDto {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type: string;
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
  currentUsageCount: number;
  isActive: boolean;
  productCount?: number;
}

export interface CreateOfferDto {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type?: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  imageUrl?: string;
  startTime?: string;
  endTime?: string;
  validFrom: string;
  validTo: string;
  maxUsageCount: number;
  productIds?: string[];
}

export interface UpdateOfferDto {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type?: string;
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

// ============================================================
// Coupons
// ============================================================

export interface CouponDto {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUsageCount: number;
  currentUsageCount: number;
  maxPerCustomer?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
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
  isActive: boolean;
}

// ============================================================
// Store Orders
// ============================================================

export interface StoreOrderItemDto {
  productId: string;
  productNameAr?: string;
  productNameEn?: string;
  quantity: number;
  unitPrice: number;
  options?: string | any[] | null;
}

export interface StoreOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  items: StoreOrderItemDto[];
  totalAmount: number;
  deliveryFee: number;
  discount?: number;
  subtotal?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderType?: string;
  specialInstructions?: string;
  scheduledDeliveryTime?: string;
  createdAt: string;
  acceptedAt?: string | null;
  deliveredAt?: string | null;
  rejectionReason?: string;
  driverName?: string;
  storeName?: string;
}

export interface UpdateOrderStatusDto {
  status: string;
  rejectionReason?: string;
}

export interface StoreOrderStatsDto {
  revenueToday: number;
  totalOrdersToday: number;
  pendingOrders: number;
  activeOrders: number;
  completedToday: number;
}

// ============================================================
// Group Deals
// ============================================================

export interface GroupDealDto {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  minimumParticipants?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  currentParticipants?: number;
}

export interface CreateGroupDealDto {
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  validFrom: string;
  validTo: string;
  items?: CreateGroupDealItemDto[];
}

export interface CreateGroupDealItemDto {
  productId: string;
  quantity: number;
}

export interface UpdateGroupDealDto {
  name?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

// ============================================================
// Quantity Bundles
// ============================================================

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

export interface CreateQuantityBundleDto {
  name: string;
  description?: string;
  productId: string;
  validFrom: string;
  validTo: string;
  tiers?: CreateBundleTierDto[];
}

export interface CreateBundleTierDto {
  minQuantity: number;
  discountPercentage: number;
}

export interface UpdateQuantityBundleDto {
  name?: string;
  description?: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

// ============================================================
// Wallet
// ============================================================

export interface WalletTransactionDto {
  id: string;
  type: string; // "Credit" | "Debit" | "Withdrawal" | "OrderPayment" etc.
  amount: number;
  description?: string;
  createdAt: string;
  status?: string;
}

export interface StoreWalletDto {
  balance: number;
  currency: string;
  transactions: WalletTransactionDto[];
  pendingWithdrawals?: any[];
  totalEarnings?: number;
}

export interface CreateWithdrawalDto {
  amount: number;
}

// ============================================================
// Store Opening Hours
// ============================================================

export interface StoreOpeningHourDto {
  id: string;
  dayOfWeek: DayOfWeek;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

// ============================================================
// Store Reviews
// ============================================================

export interface StoreReviewDto {
  id: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ============================================================
// Store Images
// ============================================================

export interface UpdateStoreImageDto {
  imageUrl: string;
}

// ============================================================
// Store Registration (Public)
// ============================================================

export interface CreateRequestDto {
  name: string;
  phoneNumber: string;
  types: string[];
  email?: string;
  address?: string;
  city?: string;
  prandName?: string;
  note?: string;
  requestType?: string;
  attachmentUrl?: string;
}

// ============================================================
// Support Tickets
// ============================================================

export interface SupportTicketDto {
  id: string;
  subject: string;
  status: string; // "Open" | "InProgress" | "Resolved" | "Closed"
  priority: string; // "Low" | "Medium" | "High" | "Urgent"
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessageDto[];
  lastMessage?: SupportMessageDto;
}

export interface SupportMessageDto {
  id: string;
  ticketId: string;
  content: string;
  userType: string; // "Customer" | "Support" | "Admin"
  userName?: string;
  createdAt: string;
  attachmentUrl?: string;
}

export interface CreateSupportTicketDto {
  subject: string;
  message: string;
  priority: string;
  orderId?: string | null;
}

export interface SendSupportMessageDto {
  ticketId: string;
  content: string;
  attachmentUrl?: string;
}

// ============================================================
// Global Discount
// ============================================================

export interface GlobalDiscountDto {
  percentage: number;
  isActive: boolean;
}

// ============================================================
// Auth DTOs
// ============================================================

export interface LoginDto {
  phoneNumber: string;
  password: string;
  role?: number;
}

export interface SendOtpDto {
  phoneNumber: string;
  role?: number;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  code: string;
  role?: number;
}

export interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface RegisterStoreDto {
  phoneNumber: string;
  fullName: string;
  storeNameAr: string;
  storeNameEn: string;
  storeDescriptionAr?: string;
  storeDescriptionEn?: string;
  storeStreetAr?: string;
  storeStreetEn?: string;
  email?: string;
  password: string;
  latitude: number;
  longitude: number;
}

export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

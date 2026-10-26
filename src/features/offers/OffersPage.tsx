import { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import {
  useGroupDeals,
  useCreateGroupDeal,
  useDeleteGroupDeal,
  useToggleGroupDeal,
  type CreateGroupDealDto,
  type GroupDealDto,
} from "@shared/hooks/useStoreOffers";
import { useStoreProducts } from "@shared/hooks/useStoreProducts";
import type { DiscountType } from "@shared/types";

// ============================================================
// Constants
// ============================================================

/** Group deal requires ≥ 2 TOTAL UNITS */
const MIN_GROUP_DEAL_UNITS = 2;
/** Percentage discounts: 1–100 */
const MAX_PERCENTAGE = 100;
/** Fixed-amount discounts: 0.01–10,000 EGP */
const MAX_FIXED_AMOUNT = 10_000;

type FilterKey = "all" | "active" | "expired";

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "العروض", en: "Offers" },
  subtitle: {
    ar: "إدارة العروض الجماعية لمتجرك",
    en: "Manage your group offers",
  },
  nameAr: { ar: "الاسم (عربي)", en: "Name (Arabic)" },
  nameEn: { ar: "الاسم (إنجليزي)", en: "Name (English)" },
  nameArPlaceholder: { ar: "أدخل اسم العرض", en: "Enter offer name" },
  nameEnPlaceholder: { ar: "أدخل اسم العرض", en: "Enter offer name" },
  descriptionAr: { ar: "الوصف (عربي)", en: "Description (Arabic)" },
  descriptionEn: { ar: "الوصف (إنجليزي)", en: "Description (English)" },
  descriptionPlaceholder: { ar: "وصف العرض", en: "Offer description" },
  discountType: { ar: "نوع الخصم", en: "Discount Type" },
  discountTypePercentage: { ar: "نسبة مئوية", en: "Percentage" },
  discountTypeFixed: { ar: "مبلغ ثابت", en: "Fixed Amount" },
  discountPercentage: { ar: "نسبة الخصم", en: "Discount Percentage" },
  discountAmount: { ar: "مبلغ الخصم", en: "Discount Amount" },
  discountPlaceholder: { ar: "مثال: 15", en: "e.g. 15" },
  maxUsageCount: { ar: "الحد الأقصى للاستخدام", en: "Max Usage" },
  maxUsagePlaceholder: { ar: "100", en: "100" },
  validFrom: { ar: "تاريخ البداية", en: "Start Date" },
  validTo: { ar: "تاريخ النهاية", en: "End Date" },
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  noDeals: { ar: "لا توجد عروض", en: "No offers yet" },
  noDealsDesc: {
    ar: "قم بإنشاء أول عرض لمتجرك",
    en: "Create your first offer",
  },
  noFilteredDeals: {
    ar: "لا توجد عروض تطابق الفلتر",
    en: "No offers match this filter",
  },
  create: { ar: "إنشاء عرض", en: "Create Offer" },
  delete: { ar: "حذف", en: "Delete" },
  save: { ar: "حفظ العرض", en: "Save Offer" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  optional: { ar: "اختياري", en: "Optional" },
  requiredMinTwoUnits: {
    ar: "مطلوب · على الأقل وحدتان",
    en: "Required · at least 2 units",
  },
  unitsCount: { ar: "وحدة", en: "units" },
  itemsCount: { ar: "منتج", en: "products" },
  atLeastTwoUnits: {
    ar: "يجب أن يكون الإجمالي وحدتين على الأقل (منتجان مختلفان، أو منتج واحد بكمية 2+)",
    en: "Total must be at least 2 units (2 distinct products, or 1 product with quantity 2+)",
  },
  created: { ar: "تم إنشاء العرض بنجاح", en: "Offer created" },
  deleted: { ar: "تم حذف العرض", en: "Offer deleted" },
  toggled: { ar: "تم تحديث حالة العرض", en: "Offer status updated" },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  confirmDelete: {
    ar: "هل أنت متأكد من حذف هذا العرض؟",
    en: "Are you sure you want to delete this offer?",
  },
  daysLeft: { ar: "يوم", en: "days" },
  usage: { ar: "الاستخدام", en: "Usage" },
  nameRequired: {
    ar: "اسم العرض مطلوب",
    en: "Offer name is required",
  },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  activate: { ar: "تفعيل", en: "Activate" },
  deactivate: { ar: "إيقاف", en: "Deactivate" },
  expired: { ar: "منتهي", en: "Expired" },
  items: { ar: "المنتجات", en: "Products" },
  addProduct: { ar: "إضافة منتج", en: "Add Product" },
  quantity: { ar: "الكمية", en: "Quantity" },
  selectProduct: { ar: "اختر منتج", en: "Select a product" },
  noItemsYet: {
    ar: "لم يتم إضافة أي منتجات بعد",
    en: "No products added yet",
  },
  noProductsInStore: {
    ar: "لا توجد منتجات في متجرك. أضف منتجات أولاً قبل إنشاء عرض.",
    en: "You have no products in your store. Add products before creating an offer.",
  },
  filterAll: { ar: "الكل", en: "All" },
  filterActive: { ar: "نشط", en: "Active" },
  filterExpired: { ar: "منتهي", en: "Expired" },
  totalOffers: { ar: "إجمالي العروض", en: "Total Offers" },
  activeOffers: { ar: "عروض نشطة", en: "Active Offers" },
  expiringSoon: { ar: "تنتهي قريباً", en: "Expiring Soon" },
  serverErrors: { ar: "أخطاء من الخادم", en: "Server errors" },
  percentageUnit: { ar: "%", en: "%" },
  fixedUnit: { ar: "ج.م", en: "EGP" },
  invalidDiscountPercentage: {
    ar: "نسبة الخصم يجب أن تكون بين 1 و 100",
    en: "Discount percentage must be between 1 and 100",
  },
  invalidDiscountAmount: {
    ar: "مبلغ الخصم يجب أن يكون أكبر من 0 وأقل من 10,000",
    en: "Discount amount must be > 0 and < 10,000",
  },
  validToRequired: {
    ar: "تاريخ النهاية مطلوب",
    en: "End date is required",
  },
  validToAfterFrom: {
    ar: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
    en: "End date must be after start date",
  },
  maxUsageRequired: {
    ar: "الحد الأقصى للاستخدام مطلوب",
    en: "Max usage is required",
  },
  selectProductRequired: {
    ar: "يرجى اختيار منتج",
    en: "Please select a product",
  },
  productAlreadyAdded: {
    ar: "المنتج مضاف بالفعل",
    en: "Product already added",
  },
};

// ============================================================
// Helpers
// ============================================================

const getDealDisplayName = (deal: GroupDealDto, isAr: boolean): string =>
  (isAr ? deal.nameAr : deal.nameEn) ?? "";

const getDealDisplayDescription = (
  deal: GroupDealDto,
  isAr: boolean,
): string | undefined => (isAr ? deal.descriptionAr : deal.descriptionEn);

const getDaysLeft = (validTo: string): number => {
  const now = new Date();
  const end = new Date(validTo);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (date: string, isAr: boolean): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const addDays = (isoDate: string, days: number): string => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

/**
 * The UI only creates `Percentage` and `FixedAmount` offers.
 * `BuyOneGetOne` is displayed defensively for any pre-existing data
 * returned by the server but is not offered in the create form.
 */
const formatDiscountBadge = (deal: GroupDealDto, isAr: boolean): string => {
  switch (deal.discountType) {
    case "Percentage":
      return `${deal.discountValue}%`;
    case "FixedAmount":
      return isAr ? `${deal.discountValue} ج.م` : `${deal.discountValue} EGP`;
    case "BuyOneGetOne":
      return isAr ? "1+1" : "1+1";
    default:
      return `${deal.discountValue}`;
  }
};

// ============================================================
// GroupDealForm Modal
// ============================================================

interface GroupDealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateGroupDealDto) => void;
  isSubmitting: boolean;
  serverErrors: string[];
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}

const GroupDealForm: React.FC<GroupDealFormProps> = ({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  serverErrors,
  isAr,
  lang,
}) => {
  const toast = useToast();

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("Percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [maxUsageCount, setMaxUsageCount] = useState("100");
  const [validFrom, setValidFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [validTo, setValidTo] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(
    [],
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");

  // Products — PagedResult
  const { data: productsPage, isLoading: productsLoading } = useStoreProducts(
    undefined,
    1,
    100,
  );
  const products = productsPage?.items ?? [];
  const hasProducts = products.length > 0;

  // ── Derived ──────────────────────────────────────────────
  const totalUnits = items.reduce((sum, it) => sum + it.quantity, 0);
  const hasEnoughUnits = totalUnits >= MIN_GROUP_DEAL_UNITS;
  const minValidTo = addDays(validFrom, 1);
  const discountCap =
    discountType === "Percentage" ? MAX_PERCENTAGE : MAX_FIXED_AMOUNT;

  const validDates =
    !!validTo && new Date(validTo).getTime() > new Date(validFrom).getTime();

  const canSubmit =
    hasEnoughUnits &&
    hasProducts &&
    !!nameAr.trim() &&
    !!nameEn.trim() &&
    !!validTo &&
    validDates &&
    !!discountValue &&
    Number(discountValue) > 0 &&
    Number(discountValue) <= discountCap &&
    !!maxUsageCount &&
    Number(maxUsageCount) >= 1;

  // ── Reset discount value only when the cap would invalidate it ──
  // (Previous behaviour wiped the value on every type switch — including
  //  the initial mount — which felt like "my input keeps clearing".)
  const prevTypeRef = useRef<DiscountType | null>(null);
  useEffect(() => {
    const prev = prevTypeRef.current;
    prevTypeRef.current = discountType;
    if (prev === null || prev === discountType) return;

    setDiscountError(null);
    setDiscountValue((curr) => {
      if (!curr) return curr;
      const n = Number(curr);
      if (isNaN(n)) return "";
      const newCap =
        discountType === "Percentage" ? MAX_PERCENTAGE : MAX_FIXED_AMOUNT;
      return n > newCap ? "" : curr;
    });
  }, [discountType]);

  // Auto-clear items error once units are sufficient
  useEffect(() => {
    if (hasEnoughUnits && itemsError) setItemsError(null);
  }, [hasEnoughUnits, itemsError]);

  if (!isOpen) return null;

  // ── Item handlers ────────────────────────────────────────
  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error(lang(t.selectProductRequired));
      return;
    }
    const qty = parseInt(newQuantity, 10) || 1;
    if (qty < 1) {
      toast.error(
        isAr ? "الكمية يجب أن تكون 1 على الأقل" : "Quantity must be ≥ 1",
      );
      return;
    }
    if (items.some((it) => it.productId === selectedProductId)) {
      toast.error(lang(t.productAlreadyAdded));
      return;
    }
    setItems([...items, { productId: selectedProductId, quantity: qty }]);
    setSelectedProductId("");
    setNewQuantity("1");
  };

  const handleAdjustQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? { ...it, quantity: Math.max(1, it.quantity + delta) }
          : it,
      ),
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError(null);
    setItemsError(null);

    if (!nameAr.trim() || !nameEn.trim()) {
      toast.error(lang(t.nameRequired));
      return;
    }

    const parsedDiscount = parseFloat(discountValue);
    if (
      isNaN(parsedDiscount) ||
      parsedDiscount <= 0 ||
      parsedDiscount > discountCap
    ) {
      setDiscountError(
        discountType === "Percentage"
          ? lang(t.invalidDiscountPercentage)
          : lang(t.invalidDiscountAmount),
      );
      return;
    }

    if (!validTo) {
      toast.error(lang(t.validToRequired));
      return;
    }
    if (!validDates) {
      toast.error(lang(t.validToAfterFrom));
      return;
    }

    const parsedUsage = parseInt(maxUsageCount, 10);
    if (isNaN(parsedUsage) || parsedUsage < 1) {
      toast.error(lang(t.maxUsageRequired));
      return;
    }

    if (!hasEnoughUnits) {
      setItemsError(lang(t.atLeastTwoUnits));
      return;
    }

    const dto: CreateGroupDealDto = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      descriptionAr: descriptionAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      discountType,
      discountValue: parsedDiscount,
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo).toISOString(),
      maxUsageCount: parsedUsage,
      items,
    };

    onSave(dto);
  };

  const inputClasses = cn(
    "w-full px-4 py-3 rounded-xl text-sm transition-all duration-200",
    "bg-surface-100 dark:bg-surface-800",
    "text-surface-900 dark:text-white",
    "placeholder:text-surface-400 dark:placeholder:text-surface-500",
    "border-2 border-transparent",
    "focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-scale mb-8",
          "bg-white dark:bg-surface-900",
          "border border-surface-200 dark:border-surface-800",
          "shadow-2xl shadow-black/10 dark:shadow-black/30",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between sticky top-0 bg-white dark:bg-surface-900 z-10">
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">
              {lang(t.create)}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {isAr
                ? "املأ البيانات لإنشاء عرض جديد"
                : "Fill in the details to create a new offer"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.nameAr)} <span className="text-error-500">*</span>
              </label>
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={lang(t.nameArPlaceholder)}
                required
                dir="rtl"
                className={cn(inputClasses, "text-right")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.nameEn)} <span className="text-error-500">*</span>
              </label>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder={lang(t.nameEnPlaceholder)}
                required
                dir="ltr"
                className={cn(inputClasses, "text-left")}
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.descriptionAr)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <textarea
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                placeholder={lang(t.descriptionPlaceholder)}
                rows={2}
                dir="rtl"
                className={cn(inputClasses, "resize-none text-right")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.descriptionEn)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder={lang(t.descriptionPlaceholder)}
                rows={2}
                dir="ltr"
                className={cn(inputClasses, "resize-none text-left")}
              />
            </div>
          </div>

          {/* Discount type — only Percentage + FixedAmount (BuyOneGetOne
              isn't created from this page) */}
          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              {lang(t.discountType)}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    key: "Percentage" as const,
                    label: t.discountTypePercentage,
                  },
                  {
                    key: "FixedAmount" as const,
                    label: t.discountTypeFixed,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDiscountType(opt.key)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all",
                    discountType === opt.key
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300"
                      : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600",
                  )}
                >
                  {lang(opt.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Discount value + Max usage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {discountType === "Percentage"
                  ? lang(t.discountPercentage)
                  : lang(t.discountAmount)}{" "}
                <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  value={discountValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) {
                      setDiscountValue(val);
                      setDiscountError(null);
                    }
                  }}
                  placeholder={lang(t.discountPlaceholder)}
                  required
                  type="number"
                  /* Percentage: integer 1-100
                     FixedAmount: decimal 0.01-10,000
                     `min` MUST be congruent with `step` per HTML5 —
                     otherwise every integer value in the range fails
                     native validation. */
                  min={discountType === "Percentage" ? "1" : "0.01"}
                  max={discountCap}
                  step={discountType === "Percentage" ? "1" : "0.01"}
                  className={cn(inputClasses, isAr ? "pl-12" : "pr-12")}
                  dir="ltr"
                />
                <span className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-surface-400 pointer-events-none ltr:right-3 rtl:left-3">
                  {discountType === "Percentage"
                    ? lang(t.percentageUnit)
                    : lang(t.fixedUnit)}
                </span>
              </div>
              {discountError && (
                <p className="text-xs text-error-500 mt-1">{discountError}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.maxUsageCount)}{" "}
                <span className="text-error-500">*</span>
              </label>
              <input
                value={maxUsageCount}
                onChange={(e) => setMaxUsageCount(e.target.value)}
                placeholder={lang(t.maxUsagePlaceholder)}
                required
                type="number"
                min="1"
                step="1"
                className={inputClasses}
                dir="ltr"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.validFrom)}
              </label>
              <input
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                type="date"
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.validTo)}
              </label>
              <input
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                type="date"
                min={minValidTo}
                required
                className={inputClasses}
              />
              {validTo && !validDates && (
                <p className="text-xs text-error-500 mt-1">
                  {lang(t.validToAfterFrom)}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.items)}{" "}
                <span
                  className={cn(
                    "font-medium",
                    hasEnoughUnits ? "text-surface-400" : "text-error-500",
                  )}
                >
                  ({lang(t.requiredMinTwoUnits)})
                </span>
              </label>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full border tabular-nums",
                  hasEnoughUnits
                    ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20"
                    : "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
                )}
              >
                {totalUnits} / {MIN_GROUP_DEAL_UNITS} {lang(t.unitsCount)}
              </span>
            </div>

            {!hasProducts && !productsLoading && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 text-xs text-warning-700 dark:text-warning-400">
                {lang(t.noProductsInStore)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={cn(inputClasses, "cursor-pointer")}
                  dir={isAr ? "rtl" : "ltr"}
                  disabled={productsLoading || !hasProducts}
                >
                  <option value="">
                    {productsLoading
                      ? isAr
                        ? "جاري التحميل..."
                        : "Loading..."
                      : lang(t.selectProduct)}
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {isAr
                        ? product.nameAr || product.nameEn
                        : product.nameEn || product.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 sm:w-auto">
                <input
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder={lang(t.quantity)}
                  type="number"
                  min="1"
                  className={cn(inputClasses, "w-24 sm:w-28 text-center")}
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    "bg-primary-600 text-white hover:bg-primary-700 active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                    "flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md",
                  )}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span className="hidden sm:inline">{lang(t.addProduct)}</span>
                </button>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
                <div className="flex flex-wrap gap-2">
                  {items.map((item, idx) => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    );
                    const productName = product
                      ? isAr
                        ? product.nameAr || product.nameEn
                        : product.nameEn || product.nameAr
                      : item.productId;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
                          "bg-white dark:bg-surface-800",
                          "border border-surface-200 dark:border-surface-700",
                          "shadow-sm animate-fade-in",
                        )}
                      >
                        <span className="text-xs font-medium text-surface-900 dark:text-white max-w-[120px] truncate">
                          {productName}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(idx, -1)}
                            disabled={item.quantity <= 1}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-40 disabled:hover:bg-transparent"
                            aria-label={
                              isAr ? "تقليل الكمية" : "Decrease quantity"
                            }
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 12h14"
                              />
                            </svg>
                          </button>
                          <span className="w-5 text-center text-xs font-semibold text-surface-700 dark:text-surface-300 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(idx, 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700"
                            aria-label={
                              isAr ? "زيادة الكمية" : "Increase quantity"
                            }
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                              />
                            </svg>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-0.5 rounded-full text-surface-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                          aria-label={
                            isAr ? "إزالة المنتج" : "Remove product"
                          }
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center text-sm text-surface-400 dark:text-surface-500 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl py-6 px-4">
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-surface-300 dark:text-surface-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M12 4.5v3.75m4.5-3.75L16.5 12 12 16.5 7.5 12 8.25 8.25"
                  />
                </svg>
                <p>{lang(t.noItemsYet)}</p>
                <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                  {lang(t.atLeastTwoUnits)}
                </p>
              </div>
            )}

            {itemsError && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20">
                <svg
                  className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="text-xs text-error-700 dark:text-error-400 flex-1">
                  {itemsError}
                </p>
              </div>
            )}
          </div>

          {/* Server-side errors */}
          {serverErrors.length > 0 && (
            <div className="rounded-xl border border-error-200 dark:border-error-500/30 bg-error-50 dark:bg-error-500/10 p-3">
              <p className="text-xs font-semibold text-error-700 dark:text-error-400 mb-1.5">
                {lang(t.serverErrors)}
              </p>
              <ul className="space-y-1 text-xs text-error-700 dark:text-error-400 list-disc list-inside">
                {serverErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                "dark:bg-primary-500 dark:hover:bg-primary-600",
                "shadow-sm hover:shadow-md",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
              )}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {lang(t.saving)}
                </>
              ) : (
                lang(t.save)
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {lang(t.cancel)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================

export const OffersPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const { data: dealsData, isLoading } = useGroupDeals();
  const createDeal = useCreateGroupDeal();
  const deleteDeal = useDeleteGroupDeal();
  const toggleDeal = useToggleGroupDeal();

  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const deals: GroupDealDto[] = useMemo(() => dealsData ?? [], [dealsData]);

  // ── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    let active = 0;
    let expiringSoon = 0;
    for (const d of deals) {
      const end = new Date(d.validTo).getTime();
      const expired = end < now;
      if (d.isActive && !expired) active++;
      if (!expired && end - now <= sevenDays) expiringSoon++;
    }
    return { total: deals.length, active, expiringSoon };
  }, [deals]);

  // ── Filtered list ────────────────────────────────────────
  const filteredDeals = useMemo(() => {
    const now = Date.now();
    return deals.filter((d) => {
      const expired = new Date(d.validTo).getTime() < now;
      if (filter === "active") return d.isActive && !expired;
      if (filter === "expired") return expired;
      return true;
    });
  }, [deals, filter]);

  // ── Handlers ─────────────────────────────────────────────
  const handleCreate = async (dto: CreateGroupDealDto) => {
    setServerErrors([]);
    try {
      await createDeal.mutateAsync(dto);
      toast.success(lang(t.created));
      setShowForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : lang(t.error);
      const errorsArr =
        (err as { errors?: string[] })?.errors ??
        (message ? [message] : [lang(t.error)]);
      setServerErrors(errorsArr);
      toast.error(lang(t.error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(lang(t.confirmDelete))) return;
    setDeletingId(id);
    try {
      await deleteDeal.mutateAsync(id);
      toast.success(lang(t.deleted));
    } catch (err) {
      const message = err instanceof Error ? err.message : lang(t.error);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleDeal.mutateAsync(id);
      toast.success(lang(t.toggled));
    } catch (err) {
      const message = err instanceof Error ? err.message : lang(t.error);
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  const closeForm = () => {
    if (createDeal.isPending) return;
    setShowForm(false);
    setServerErrors([]);
  };

  const filters: {
    key: FilterKey;
    label: typeof t.filterAll;
    count: number;
  }[] = [
    { key: "all", label: t.filterAll, count: deals.length },
    { key: "active", label: t.filterActive, count: stats.active },
    {
      key: "expired",
      label: t.filterExpired,
      count: deals.length - stats.active,
    },
  ];

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-12 w-full",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <button
          onClick={() => {
            setServerErrors([]);
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {lang(t.create)}
        </button>
      </div>

      {/* Stats + Filters */}
      {!isLoading && deals.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
              <p className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                {stats.total}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {lang(t.totalOffers)}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 tabular-nums">
                {stats.active}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {lang(t.activeOffers)}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 tabular-nums">
                {stats.expiringSoon}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {lang(t.expiringSoon)}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  filter === f.key
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700",
                )}
              >
                {lang(f.label)}
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums",
                    filter === f.key
                      ? "bg-white/20 text-white"
                      : "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300",
                  )}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-5 w-32 rounded-lg" />
                  <div className="skeleton h-3 w-48 rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-9 w-20 rounded-xl" />
                  <div className="skeleton h-9 w-20 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          isAr={isAr}
          lang={lang}
          title={lang(t.noDeals)}
          description={lang(t.noDealsDesc)}
          onCreate={() => {
            setServerErrors([]);
            setShowForm(true);
          }}
        />
      ) : filteredDeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
            {lang(t.noFilteredDeals)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeals.map((deal) => {
            const daysLeft = getDaysLeft(deal.validTo);
            const isExpired = daysLeft < 0;
            const displayName = getDealDisplayName(deal, isAr);
            const displayDescription = getDealDisplayDescription(deal, isAr);
            const usageProgress =
              deal.maxUsageCount > 0
                ? Math.round(
                    ((deal.currentUsageCount ?? 0) / deal.maxUsageCount) * 100,
                  )
                : 0;

            return (
              <div
                key={deal.id}
                className={cn(
                  "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 transition-all",
                  "hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md",
                  (!deal.isActive || isExpired) && "opacity-75",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-surface-900 dark:text-white">
                        {displayName}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        {formatDiscountBadge(deal, isAr)}
                      </span>
                      {isExpired && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-error-500" />
                          {lang(t.expired)}
                        </span>
                      )}
                      {!deal.isActive && !isExpired && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-surface-100 text-surface-500 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
                          {lang(t.inactive)}
                        </span>
                      )}
                    </div>
                    {displayDescription && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-1">
                        {displayDescription}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500 dark:text-surface-400">
                      <span>
                        {lang(t.usage)}: {deal.currentUsageCount ?? 0} /{" "}
                        {deal.maxUsageCount} ({usageProgress}%)
                      </span>
                      <span className="text-surface-300 dark:text-surface-600">
                        •
                      </span>
                      <span>
                        {formatDate(deal.validFrom, isAr)} —{" "}
                        {formatDate(deal.validTo, isAr)}
                      </span>
                      {!isExpired && daysLeft <= 7 && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                          {daysLeft} {lang(t.daysLeft)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <button
                      onClick={() => handleToggle(deal.id)}
                      disabled={togglingId === deal.id || isExpired}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                        deal.isActive
                          ? "bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20"
                          : "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20",
                      )}
                    >
                      {togglingId === deal.id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : deal.isActive ? (
                        lang(t.deactivate)
                      ) : (
                        lang(t.activate)
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      disabled={deletingId === deal.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 active:scale-[0.98] disabled:opacity-50 transition-all"
                      aria-label={lang(t.delete)}
                    >
                      {deletingId === deal.id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <GroupDealForm
          isOpen={showForm}
          onClose={closeForm}
          onSave={handleCreate}
          isSubmitting={createDeal.isPending}
          serverErrors={serverErrors}
          isAr={isAr}
          lang={lang}
        />
      )}
    </div>
  );
};

// ============================================================
// Empty state
// ============================================================

const EmptyState: React.FC<{
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
  title: string;
  description: string;
  onCreate: () => void;
}> = ({ lang, title, description, onCreate }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
    <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
      <svg
        className="w-10 h-10 text-surface-300 dark:text-surface-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    </div>
    <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
      {title}
    </p>
    <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
      {description}
    </p>
    <button onClick={onCreate} className="btn btn-primary mt-5">
      {lang(t.create)}
    </button>
  </div>
);

export default OffersPage;
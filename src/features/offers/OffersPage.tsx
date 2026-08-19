import { useState, useMemo } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import {
  useGroupDeals,
  useCreateGroupDeal,
  useDeleteGroupDeal,
} from "@shared/hooks/useStoreOffers";
import { useStoreProducts } from "@shared/hooks/useStoreProducts";
import type { CreateGroupDealDto, GroupDealDto } from "@shared/types";

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "العروض", en: "Offers" },
  subtitle: {
    ar: "إدارة العروض لمتجرك",
    en: "Manage your store offers",
  },
  name: { ar: "اسم العرض", en: "Offer Name" },
  namePlaceholder: {
    ar: "أدخل اسم العرض",
    en: "Enter offer name",
  },
  description: { ar: "الوصف", en: "Description" },
  descriptionPlaceholder: {
    ar: "وصف العرض",
    en: "Offer description",
  },
  discountPercentage: { ar: "نسبة الخصم", en: "Discount Percentage" },
  discountPlaceholder: { ar: "مثال: 15", en: "e.g. 15" },
  validFrom: { ar: "تاريخ البداية", en: "Start Date" },
  validTo: { ar: "تاريخ النهاية", en: "End Date" },
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  noDeals: { ar: "لا توجد عروض", en: "No offers yet" },
  noDealsDesc: {
    ar: "قم بإنشاء أول عرض لمتجرك",
    en: "Create your first offer",
  },
  create: { ar: "إنشاء عرض", en: "Create Offer" },
  delete: { ar: "حذف", en: "Delete" },
  save: { ar: "حفظ العرض", en: "Save Offer" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  optional: { ar: "اختياري", en: "Optional" },
  created: { ar: "تم إنشاء العرض بنجاح", en: "Offer created" },
  deleted: { ar: "تم حذف العرض", en: "Offer deleted" },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  confirmDelete: {
    ar: "هل أنت متأكد من حذف هذا العرض؟",
    en: "Are you sure you want to delete this offer?",
  },
  endsIn: { ar: "متبقي", en: "Remaining" },
  daysLeft: { ar: "يوم", en: "days" },
  participants: { ar: "مشارك", en: "participants" },
  nameRequired: {
    ar: "اسم العرض مطلوب",
    en: "Offer name is required",
  },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  enable: { ar: "تفعيل", en: "Enable" },
  disable: { ar: "تعطيل", en: "Disable" },
  expired: { ar: "منتهي", en: "Expired" },
  currentParticipants: { ar: "المشاركون الحاليون", en: "Current Participants" },
  items: { ar: "المنتجات", en: "Products" },
  addProduct: { ar: "إضافة منتج", en: "Add Product" },
  product: { ar: "المنتج", en: "Product" },
  quantity: { ar: "الكمية", en: "Quantity" },
  selectProduct: { ar: "اختر منتج", en: "Select a product" },
};

// ============================================================
// Helpers
// ============================================================

const getDealDisplayName = (deal: GroupDealDto): string => {
  return deal.name || "";
};

const getDealDisplayDescription = (deal: GroupDealDto): string | undefined => {
  return deal.description;
};

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

// ============================================================
// GroupDealForm Modal
// ============================================================

interface GroupDealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateGroupDealDto) => void;
  isSubmitting: boolean;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}

const GroupDealForm: React.FC<GroupDealFormProps> = ({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  isAr,
  lang,
}) => {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [validFrom, setValidFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [validTo, setValidTo] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(
    [],
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");

  // Fetch products
  const { data: products = [] } = useStoreProducts();

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error(isAr ? "يرجى اختيار منتج" : "Please select a product");
      return;
    }
    const qty = parseInt(newQuantity) || 1;
    // Check if product already added
    if (items.some((item) => item.productId === selectedProductId)) {
      toast.error(isAr ? "المنتج مضاف بالفعل" : "Product already added");
      return;
    }
    setItems([...items, { productId: selectedProductId, quantity: qty }]);
    setSelectedProductId("");
    setNewQuantity("1");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError(null);

    if (!name.trim()) {
      toast.error(lang(t.nameRequired));
      return;
    }

    const parsedDiscount = parseInt(discountValue, 10);
    if (isNaN(parsedDiscount) || parsedDiscount < 1 || parsedDiscount > 100) {
      setDiscountError(
        isAr
          ? "نسبة الخصم يجب أن تكون بين 1 و 100"
          : "Discount percentage must be between 1 and 100",
      );
      return;
    }

    if (!validTo) {
      toast.error(isAr ? "تاريخ النهاية مطلوب" : "End date is required");
      return;
    }

    const dto: CreateGroupDealDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      discountType: "Percentage",
      discountValue: parsedDiscount,
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo).toISOString(),
      items: items.length > 0 ? items : undefined,
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-scale mb-8",
          "bg-white dark:bg-surface-900",
          "border border-surface-200 dark:border-surface-800",
          "shadow-2xl shadow-black/10 dark:shadow-black/30",
        )}
        onClick={(e) => e.stopPropagation()}
      >
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
            className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
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
          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              {lang(t.name)} <span className="text-error-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang(t.namePlaceholder)}
              required
              dir={isAr ? "rtl" : "ltr"}
              className={cn(inputClasses, isAr ? "text-right" : "text-left")}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              {lang(t.description)}{" "}
              <span className="font-normal text-surface-400">
                ({lang(t.optional)})
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang(t.descriptionPlaceholder)}
              rows={2}
              dir={isAr ? "rtl" : "ltr"}
              className={cn(
                inputClasses,
                "resize-none",
                isAr ? "text-right" : "text-left",
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.discountPercentage)}
              </label>
              <input
                value={discountValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    setDiscountValue(val);
                    setDiscountError(null);
                  }
                }}
                placeholder={lang(t.discountPlaceholder)}
                required
                type="number"
                min="1"
                max="100"
                step="1"
                className={inputClasses}
              />
            </div>
            {discountError && (
              <p className="text-xs text-error-500 mt-1">{discountError}</p>
            )}
          </div>
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
                required
                className={inputClasses}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              {lang(t.items)}{" "}
              <span className="font-normal text-surface-400">
                ({lang(t.optional)})
              </span>
            </label>

            {/* Input Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={cn(
                    inputClasses,
                    "w-full appearance-none bg-no-repeat bg-[length:16px_16px]",
                    isAr
                      ? "bg-[left_1rem_center] pr-4 pl-10 text-right"
                      : "bg-[right_1rem_center] pl-4 pr-10 text-left",
                    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236B7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')]",
                  )}
                  dir={isAr ? "rtl" : "ltr"}
                >
                  <option value="">{lang(t.selectProduct)}</option>
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
                  className={cn(
                    inputClasses,
                    "w-24 sm:w-28 text-center",
                    isAr ? "text-right" : "text-left",
                  )}
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
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

            {/* Added Items List */}
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
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
                          "bg-white dark:bg-surface-800",
                          "border border-surface-200 dark:border-surface-700",
                          "shadow-sm",
                          "animate-fade-in",
                        )}
                      >
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {productName}
                        </span>
                        <span className="text-xs text-surface-500 dark:text-surface-400">
                          × {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-0.5 rounded-full text-surface-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                          aria-label={isAr ? "إزالة المنتج" : "Remove product"}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
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
                <p>
                  {isAr
                    ? "لم يتم إضافة أي منتجات بعد"
                    : "No products added yet"}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
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
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200"
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

  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deals = useMemo(
    () => (Array.isArray(dealsData) ? dealsData : []),
    [dealsData],
  );

  const handleCreate = async (dto: CreateGroupDealDto) => {
    try {
      await createDeal.mutateAsync(dto);
      toast.success(lang(t.created));
      setShowForm(false);
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.message ||
        lang(t.error);
      toast.error(serverMessage);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDeal.mutateAsync(id);
      toast.success(lang(t.deleted));
    } catch {
      toast.error(lang(t.error));
    } finally {
      setDeletingId(null);
    }
  };

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
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
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

      {/* Loading / Empty / List */}
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
            {lang(t.noDeals)}
          </p>
          <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
            {lang(t.noDealsDesc)}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-5"
          >
            {lang(t.create)}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const daysLeft = getDaysLeft(deal.validTo);
            const isExpired = daysLeft < 0;
            const displayName = getDealDisplayName(deal);
            const displayDescription = getDealDisplayDescription(deal);

            return (
              <div
                key={deal.id}
                className={cn(
                  "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 transition-all duration-200",
                  "hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md",
                  !deal.isActive && "opacity-60",
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
                        {deal.discountPercentage}%
                      </span>
                      {isExpired && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-error-500" />
                          {lang(t.expired)}
                        </span>
                      )}
                      {deal.minimumParticipants !== undefined &&
                        deal.minimumParticipants > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20">
                            Min: {deal.minimumParticipants}
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
                        {lang(t.currentParticipants)}:{" "}
                        {deal.currentParticipants ?? 0}
                      </span>
                      <span className="text-surface-300 dark:text-surface-600">
                        •
                      </span>
                      <span>
                        {formatDate(deal.validFrom, isAr)} -{" "}
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
                      onClick={() => handleDelete(deal.id)}
                      disabled={deletingId === deal.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 active:scale-[0.98] disabled:opacity-50 transition-all"
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
          onClose={() => setShowForm(false)}
          onSave={handleCreate}
          isSubmitting={createDeal.isPending}
          isAr={isAr}
          lang={lang}
        />
      )}
    </div>
  );
};

export default OffersPage;

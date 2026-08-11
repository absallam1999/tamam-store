import { useState, useMemo } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import {
  useMenuCategories,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
} from "@shared/hooks/useMenuCategories";
import { translateText } from "@shared/utils/translate";
import { useStoreProducts } from "@shared/hooks/useStoreProducts";
import type { MenuCategoryDto } from "@shared/types";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "التصنيفات", en: "Categories" },
  subtitle: {
    ar: "إدارة تصنيفات قائمة الطعام",
    en: "Manage your menu categories",
  },
  totalCategories: { ar: "إجمالي التصنيفات", en: "Total Categories" },
  activeCategories: { ar: "نشطة", en: "Active" },
  inactiveCategories: { ar: "مخفية", en: "Hidden" },
  totalProducts: { ar: "المنتجات", en: "Products" },
  nameAr: { ar: "الاسم بالعربية", en: "Arabic Name" },
  nameEn: { ar: "الاسم بالإنجليزية", en: "English Name" },
  nameArPlaceholder: { ar: "أدخل الاسم بالعربية", en: "Enter Arabic name" },
  nameEnPlaceholder: { ar: "أدخل الاسم بالإنجليزية", en: "Enter English name" },
  descriptionAr: { ar: "الوصف بالعربية", en: "Arabic Description" },
  descriptionEn: { ar: "الوصف بالإنجليزية", en: "English Description" },
  descriptionArPlaceholder: {
    ar: "وصف التصنيف بالعربية (اختياري)",
    en: "Arabic description (optional)",
  },
  descriptionEnPlaceholder: {
    ar: "وصف التصنيف بالإنجليزية (اختياري)",
    en: "English description (optional)",
  },
  displayOrder: { ar: "ترتيب العرض", en: "Display Order" },
  imageUrl: { ar: "رابط الصورة", en: "Image URL" },
  imageUrlPlaceholder: { ar: "https://...", en: "https://..." },
  available: { ar: "متاح", en: "Available" },
  unavailable: { ar: "غير متاح", en: "Unavailable" },
  products: { ar: "منتج", en: "products" },
  noCategories: { ar: "لا توجد تصنيفات", en: "No categories yet" },
  noCategoriesDesc: {
    ar: "قم بإنشاء أول تصنيف لقائمة الطعام",
    en: "Create your first menu category",
  },
  create: { ar: "إنشاء تصنيف", en: "Create Category" },
  edit: { ar: "تعديل التصنيف", en: "Edit Category" },
  delete: { ar: "حذف", en: "Delete" },
  save: { ar: "حفظ", en: "Save" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  optional: { ar: "اختياري", en: "Optional" },
  created: {
    ar: "تم إنشاء التصنيف بنجاح",
    en: "Category created successfully",
  },
  updated: {
    ar: "تم تحديث التصنيف بنجاح",
    en: "Category updated successfully",
  },
  deleted: { ar: "تم حذف التصنيف بنجاح", en: "Category deleted successfully" },
  toggled: { ar: "تم تغيير حالة التصنيف", en: "Category status updated" },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  deleteConfirm: { ar: "تأكيد الحذف", en: "Confirm Delete" },
  deleteConfirmDesc: {
    ar: "هل أنت متأكد من حذف",
    en: "Are you sure you want to delete",
  },
  deleteWithProducts: {
    ar: "لا يمكن حذف هذا التصنيف لأنه يحتوي على منتجات. يرجى حذف المنتجات أو نقلها أولاً.",
    en: "Cannot delete this category because it contains products. Please delete or move the products first.",
  },
  deleteWarning: {
    ar: "سيتم حذف التصنيف نهائياً.",
    en: "This action cannot be undone.",
  },
  deleteError: {
    ar: "فشل حذف التصنيف. تأكد من عدم وجود منتجات مرتبطة به.",
    en: "Failed to delete category. Make sure no products are linked to it.",
  },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  translateToArabic: { ar: "ترجمة إلى العربية", en: "Translate to Arabic" },
  translateToEnglish: {
    ar: "ترجمة إلى الإنجليزية",
    en: "Translate to English",
  },
  translating: { ar: "جاري الترجمة...", en: "Translating..." },
  order: { ar: "الترتيب", en: "Order" },
};

// ============================================
// Category Form Modal
// ============================================

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: MenuCategoryDto | null;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  initial,
  isAr,
  lang,
}) => {
  const toast = useToast();
  const createMutation = useCreateMenuCategory();
  const updateMutation = useUpdateMenuCategory();

  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [descriptionAr, setDescriptionAr] = useState(
    initial?.descriptionAr ?? "",
  );
  const [descriptionEn, setDescriptionEn] = useState(
    initial?.descriptionEn ?? "",
  );
  const [displayOrder, setDisplayOrder] = useState(
    initial?.displayOrder?.toString() ?? "0",
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [translatingField, setTranslatingField] = useState<string | null>(null);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  const handleTranslateField = async (field: "name" | "description") => {
    setTranslatingField(field);
    try {
      if (isAr) {
        // AR mode: translate FROM Arabic TO English
        if (field === "name" && nameAr.trim()) {
          const translated = await translateText(nameAr, "en");
          setNameEn(translated);
        }
        if (field === "description" && descriptionAr.trim()) {
          const translated = await translateText(descriptionAr, "en");
          setDescriptionEn(translated);
        }
      } else {
        // EN mode: translate FROM English TO Arabic
        if (field === "name" && nameEn.trim()) {
          const translated = await translateText(nameEn, "ar");
          setNameAr(translated);
        }
        if (field === "description" && descriptionEn.trim()) {
          const translated = await translateText(descriptionEn, "ar");
          setDescriptionAr(translated);
        }
      }
    } catch {
      toast.error(isAr ? "فشلت الترجمة" : "Translation failed");
    } finally {
      setTranslatingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !nameEn.trim()) {
      toast.error(
        isAr
          ? "يرجى إدخال الاسم بالعربية والإنجليزية"
          : "Please enter both Arabic and English names",
      );
      return;
    }

    // Build the payload according to UpdateMenuCategoryDto
    // Note: UpdateMenuCategoryDto extends CreateMenuCategoryDto with isAvailable
    const payload = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      descriptionAr: descriptionAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      displayOrder: parseInt(displayOrder) || 0,
      // isAvailable is only needed for updates, not for create
      // It will be added when updating if initial exists
    };

    try {
      if (initial) {
        // For update, include isAvailable from the existing category
        await updateMutation.mutateAsync({
          categoryId: initial.id,
          dto: {
            ...payload,
            isAvailable: initial.isAvailable,
          },
        });
        toast.success(lang(t.updated));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(lang(t.created));
      }
      onClose();
    } catch (error: any) {
      console.error("Category submission error:", error);
      // Log the error details for debugging
      if (error?.response) {
        console.error("API Error Response:", error.response.data);
        console.error("API Error Status:", error.response.status);
      }
      toast.error(lang(t.error));
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-3 rounded-xl text-sm transition-all duration-200",
    "bg-surface-100 dark:bg-surface-800",
    "text-surface-900 dark:text-white",
    "placeholder:text-surface-400 dark:placeholder:text-surface-500",
    "border-2 border-transparent",
    "focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
  );

  const TranslateBtn: React.FC<{ field: "name" | "description" }> = ({
    field,
  }) => {
    const hasSource = isAr
      ? field === "name"
        ? nameAr.trim()
        : descriptionAr.trim()
      : field === "name"
        ? nameEn.trim()
        : descriptionEn.trim();

    // Only show if source text exists and is more than 2 characters
    if (!hasSource || hasSource.length < 2) return null;

    const isBusy = translatingField === field;
    const isSourceRTL = isAr;

    return (
      <button
        type="button"
        onClick={() => handleTranslateField(field)}
        disabled={isBusy}
        className={cn(
          "absolute top-1/2 -translate-y-1/2",
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
          "text-[11px] font-semibold transition-all duration-200",
          "bg-primary-50 text-primary-700 border border-primary-200",
          "dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
          "hover:bg-primary-100 dark:hover:bg-primary-500/20",
          "active:scale-[0.95]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
          // Position on the opposite side of text direction
          // Arabic (RTL) text → button on LEFT side
          // English (LTR) text → button on RIGHT side
          isSourceRTL ? "left-2" : "right-2",
        )}
        title={isAr ? "ترجمة إلى الإنجليزية" : "Translate to Arabic"}
      >
        {isBusy ? (
          <svg
            className="w-3.5 h-3.5 animate-spin shrink-0"
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
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016.375.371m-1.586 1.586a7.5 7.5 0 011.586 1.586M5.62 3a48.453 48.453 0 01.371 6.375M5.62 3c.078.004.156.006.234.008m1.586 1.586a7.458 7.458 0 011.586 1.586m1.586-1.586L5.62 3m-1.586 1.586L3 5.621"
            />
          </svg>
        )}
        <span className="whitespace-nowrap">
          {isAr ? "ترجمة" : "Translate"}
        </span>
      </button>
    );
  };

  const NameFields = isAr ? (
    <>
      {/* AR mode: Arabic first */}
      <div>
        <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
          {lang(t.nameAr)} <span className="text-error-500">*</span>
        </label>
        <div className="relative">
          <input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder={lang(t.nameArPlaceholder)}
            required
            dir="rtl"
            className={cn(inputClasses, "text-right", nameAr.trim() && "pl-24")}
          />
          <TranslateBtn field="name" />
        </div>
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
    </>
  ) : (
    <>
      {/* EN mode: English first */}
      <div>
        <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
          {lang(t.nameEn)} <span className="text-error-500">*</span>
        </label>
        <div className="relative">
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder={lang(t.nameEnPlaceholder)}
            required
            dir="ltr"
            className={cn(inputClasses, "text-left", nameEn.trim() && "pr-24")}
          />
          <TranslateBtn field="name" />
        </div>
      </div>
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
    </>
  );

  const DescriptionFields = isAr ? (
    <>
      {/* AR mode: Arabic first, then English */}
      <div>
        <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
          {lang(t.descriptionAr)}{" "}
          <span className="font-normal text-surface-400">
            ({lang(t.optional)})
          </span>
        </label>
        <div className="relative">
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder={lang(t.descriptionArPlaceholder)}
            rows={2}
            dir="rtl"
            className={cn(
              inputClasses,
              "resize-none text-right",
              descriptionAr.trim() && "pl-24",
            )}
          />
          <TranslateBtn field="description" />
        </div>
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
          placeholder={lang(t.descriptionEnPlaceholder)}
          rows={2}
          dir="ltr"
          className={cn(inputClasses, "resize-none text-left")}
        />
      </div>
    </>
  ) : (
    <>
      {/* EN mode: English first, then Arabic */}
      <div>
        <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
          {lang(t.descriptionEn)}{" "}
          <span className="font-normal text-surface-400">
            ({lang(t.optional)})
          </span>
        </label>
        <div className="relative">
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            placeholder={lang(t.descriptionEnPlaceholder)}
            rows={2}
            dir="ltr"
            className={cn(
              inputClasses,
              "resize-none text-left",
              descriptionEn.trim() && "pr-24",
            )}
          />
          <TranslateBtn field="description" />
        </div>
      </div>
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
          placeholder={lang(t.descriptionArPlaceholder)}
          rows={2}
          dir="rtl"
          className={cn(inputClasses, "resize-none text-right")}
        />
      </div>
    </>
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
              {initial ? lang(t.edit) : lang(t.create)}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {isAr
                ? "املأ البيانات لإنشاء تصنيف جديد"
                : "Fill in the details to create a new category"}
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
          {/* Names - ordered by language mode */}
          {NameFields}

          {/* Descriptions - ordered by language mode */}
          {DescriptionFields}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.displayOrder)}
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                min="0"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.imageUrl)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={lang(t.imageUrlPlaceholder)}
                dir="ltr"
                className={inputClasses}
              />
            </div>
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

// ============================================
// Delete Confirm Modal
// ============================================

const DeleteConfirmModal: React.FC<{
  name: string;
  productCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}> = ({ name, productCount, onConfirm, onCancel, isDeleting, isAr, lang }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    onClick={onCancel}
  >
    <div
      className="bg-white dark:bg-surface-900 p-6 rounded-2xl max-w-sm w-full animate-scale-in border border-surface-200 dark:border-surface-800 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-12 rounded-full bg-error-100 dark:bg-error-500/10 flex items-center justify-center mb-4 mx-auto">
        <svg
          className="w-6 h-6 text-error-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h4 className="text-lg font-semibold text-surface-900 dark:text-white mb-2 text-center">
        {lang(t.deleteConfirm)}
      </h4>

      {productCount > 0 ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 mb-3">
            <svg
              className="w-5 h-5 text-warning-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm text-warning-700 dark:text-warning-400">
              {isAr
                ? `هذا التصنيف يحتوي على ${productCount} منتج. لا يمكن حذفه.`
                : `This category contains ${productCount} product(s). Cannot delete.`}
            </p>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center">
            {lang(t.deleteWithProducts)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 text-center">
          {lang(t.deleteConfirmDesc)} "{name}"? {lang(t.deleteWarning)}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
        >
          {lang(t.cancel)}
        </button>
        {productCount === 0 && (
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-error-600 text-white hover:bg-error-700 active:scale-[0.98]",
              "dark:bg-error-500 dark:hover:bg-error-600",
              "shadow-sm hover:shadow-md",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            )}
          >
            {isDeleting ? (
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
              <>
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
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
                {lang(t.delete)}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  </div>
);

// ============================================
// CategoriesPage — Main Component
// ============================================

export const CategoriesPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const { data: categories = [], isLoading } = useMenuCategories();
  const { data: products = [] } = useStoreProducts();
  const deleteCategory = useDeleteMenuCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<MenuCategoryDto | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<MenuCategoryDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Use the hook's mutation for toggle
  const updateCategory = useUpdateMenuCategory();

  const getDisplayName = (category: MenuCategoryDto) =>
    isAr ? category.nameAr : category.nameEn;
  const getDisplayDescription = (category: MenuCategoryDto) =>
    isAr ? category.descriptionAr : category.descriptionEn;

  const stats = useMemo(() => {
    const active = categories.filter((c) => c.isAvailable);
    return {
      total: categories.length,
      active: active.length,
      inactive: categories.length - active.length,
      totalProducts: products.length,
    };
  }, [categories, products]);

  const getProductCount = (categoryId: string) =>
    products.filter((p) => p.menuCategoryId === categoryId).length;

  const handleToggle = async (category: MenuCategoryDto) => {
    setTogglingId(category.id);
    try {
      await updateCategory.mutateAsync({
        categoryId: category.id,
        dto: {
          nameAr: category.nameAr,
          nameEn: category.nameEn,
          descriptionAr: category.descriptionAr || undefined,
          descriptionEn: category.descriptionEn || undefined,
          imageUrl: category.imageUrl || undefined,
          displayOrder: category.displayOrder,
          isAvailable: !category.isAvailable,
        },
      });
      toast.success(lang(t.toggled));
      // No need for window.location.reload() - queryClient auto-refetches
    } catch {
      toast.error(lang(t.error));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    // Check if category has products
    const count = getProductCount(deletingCategory.id);
    if (count > 0) {
      toast.error(lang(t.deleteWithProducts));
      setDeletingCategory(null);
      return;
    }

    setDeletingId(deletingCategory.id);
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast.success(lang(t.deleted));
      setDeletingCategory(null);
    } catch (err: any) {
      console.error("Delete category error:", err);
      // Check if it's a 500 error (DbUpdateException)
      const isServerError =
        err?.response?.status === 500 || err?.message?.includes("500");
      if (isServerError) {
        toast.error(lang(t.deleteError), {
          description: isAr
            ? "خطأ في قاعدة البيانات. قد يكون التصنيف مرتبطاً بسجلات أخرى."
            : "Database error. The category may be linked to other records.",
        });
      } else {
        toast.error(lang(t.deleteError));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const statsCards = [
    {
      label: lang(t.totalCategories),
      value: stats.total,
      color:
        "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      ),
    },
    {
      label: lang(t.activeCategories),
      value: stats.active,
      color:
        "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      ),
    },
    {
      label: lang(t.inactiveCategories),
      value: stats.inactive,
      color:
        "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      ),
    },
    {
      label: lang(t.totalProducts),
      value: stats.totalProducts,
      color: "bg-info-100 dark:bg-info-500/10 text-info-600 dark:text-info-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
          />
        </svg>
      ),
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
            setEditingCategory(null);
            setShowForm(true);
          }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 self-start sm:self-auto",
            "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
            "dark:bg-primary-500 dark:hover:bg-primary-600",
            "shadow-sm hover:shadow-md",
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
          {lang(t.create)}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  card.color,
                )}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {card.value}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-32 rounded-lg" />
                  <div className="skeleton h-3 w-48 rounded-lg" />
                </div>
                <div className="flex gap-1">
                  <div className="skeleton h-9 w-9 rounded-lg" />
                  <div className="skeleton h-9 w-9 rounded-lg" />
                  <div className="skeleton h-9 w-9 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
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
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
            {lang(t.noCategories)}
          </p>
          <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
            {lang(t.noCategoriesDesc)}
          </p>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
            className="btn btn-primary mt-5"
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
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const productCount = getProductCount(category.id);
            const isProcessing = togglingId === category.id;
            const displayName = getDisplayName(category);
            const displayDescription = getDisplayDescription(category);

            return (
              <div
                key={category.id}
                className={cn(
                  "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 transition-all duration-200",
                  "hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md",
                  !category.isAvailable && "opacity-60",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-7 h-7 text-surface-300 dark:text-surface-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-surface-900 dark:text-white">
                        {displayName}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border",
                          category.isAvailable
                            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20"
                            : "bg-surface-100 text-surface-500 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            category.isAvailable
                              ? "bg-success-500"
                              : "bg-surface-400",
                          )}
                        />
                        {category.isAvailable
                          ? lang(t.available)
                          : lang(t.unavailable)}
                      </span>
                    </div>
                    {displayDescription && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-1">
                        {displayDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-500 dark:text-surface-400">
                      <span>
                        {productCount} {lang(t.products)}
                      </span>
                      <span className="text-surface-300 dark:text-surface-600">
                        •
                      </span>
                      <span>
                        {lang(t.order)}: {category.displayOrder}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(category)}
                      disabled={isProcessing}
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        category.isAvailable
                          ? "text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10"
                          : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800",
                      )}
                      title={
                        category.isAvailable
                          ? lang(t.unavailable)
                          : lang(t.available)
                      }
                    >
                      {isProcessing ? (
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
                          {category.isAvailable ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          ) : (
                            <>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                            </>
                          )}
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowForm(true);
                      }}
                      className="p-2 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-500/10 transition-colors"
                      title={lang(t.edit)}
                    >
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
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingCategory(category)}
                      className="p-2 rounded-xl text-surface-400 hover:text-error-600 hover:bg-error-50 dark:hover:text-error-400 dark:hover:bg-error-500/10 transition-colors"
                      title={lang(t.delete)}
                    >
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
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <CategoryForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          initial={editingCategory}
          isAr={isAr}
          lang={lang}
        />
      )}
      {deletingCategory && (
        <DeleteConfirmModal
          name={getDisplayName(deletingCategory)}
          productCount={getProductCount(deletingCategory.id)}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCategory(null)}
          isDeleting={deletingId === deletingCategory.id}
          isAr={isAr}
          lang={lang}
        />
      )}
    </div>
  );
};

export default CategoriesPage;

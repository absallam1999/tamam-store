import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { translateText } from "@shared/utils/translate";
import { ENDPOINTS } from "@/config/api";
import { useMenuCategories } from "@shared/hooks/useMenuCategories";
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@shared/hooks/useStoreProducts";
import { getProductImage } from "@/shared/utils/Parser";
import { useStore } from "@/app/providers/StoreProvider";
import type { CreateProductDto, UpdateProductDto } from "@shared/types";

// ============================================
// Types
// ============================================

interface MenuItemForm {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  discountedPrice?: number;
  menuCategoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTimeMinutes: number;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
}

// ============================================
// Translations
// ============================================

const t = {
  newItem: { ar: "إضافة منتج جديد", en: "Add New Item" },
  editItem: { ar: "تعديل المنتج", en: "Edit Item" },
  backToMenu: { ar: "العودة للقائمة", en: "Back to Menu" },
  basicInfo: { ar: "معلومات أساسية", en: "Basic Information" },
  pricing: { ar: "التسعير", en: "Pricing" },
  settings: { ar: "الإعدادات", en: "Settings" },
  image: { ar: "صورة المنتج", en: "Product Image" },
  nameAr: { ar: "اسم المنتج (عربي)", en: "Product Name (Arabic)" },
  nameEn: { ar: "اسم المنتج (إنجليزي)", en: "Product Name (English)" },
  nameArPlaceholder: { ar: "مثال: برجر كلاسيك", en: "e.g. Classic Burger" },
  nameEnPlaceholder: { ar: "مثال: Classic Burger", en: "e.g. Classic Burger" },
  descriptionAr: { ar: "الوصف (عربي)", en: "Description (Arabic)" },
  descriptionEn: { ar: "الوصف (إنجليزي)", en: "Description (English)" },
  descriptionArPlaceholder: {
    ar: "وصف المنتج بالعربية...",
    en: "Arabic product description...",
  },
  descriptionEnPlaceholder: {
    ar: "وصف المنتج بالإنجليزية...",
    en: "English product description...",
  },
  price: { ar: "السعر", en: "Price" },
  discountedPrice: {
    ar: "سعر الخصم (اختياري)",
    en: "Discounted Price (optional)",
  },
  category: { ar: "التصنيف", en: "Category" },
  selectCategory: { ar: "اختر التصنيف", en: "Select category" },
  preparationTime: { ar: "وقت التحضير (دقيقة)", en: "Preparation Time (min)" },
  available: { ar: "متاح للطلب", en: "Available for ordering" },
  featured: { ar: "منتج مميز", en: "Featured Product" },
  sku: { ar: "SKU (اختياري)", en: "SKU (optional)" },
  barcode: { ar: "باركود (اختياري)", en: "Barcode (optional)" },
  save: { ar: "حفظ", en: "Save" },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  addItem: { ar: "إضافة المنتج", en: "Add Item" },
  saveChanges: { ar: "حفظ التغييرات", en: "Save Changes" },
  delete: { ar: "حذف", en: "Delete" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  deleteConfirm: {
    ar: "هل أنت متأكد من حذف هذا المنتج؟",
    en: "Are you sure you want to delete this item?",
  },
  nameArRequired: { ar: "الاسم العربي مطلوب", en: "Arabic name is required" },
  nameEnRequired: {
    ar: "الاسم الإنجليزي مطلوب",
    en: "English name is required",
  },
  priceRequired: {
    ar: "السعر يجب أن يكون أكبر من صفر",
    en: "Price must be greater than zero",
  },
  categoryRequired: {
    ar: "يرجى اختيار التصنيف",
    en: "Please select a category",
  },
  prepTimeRequired: {
    ar: "وقت التحضير مطلوب",
    en: "Preparation time is required",
  },
  loadError: { ar: "فشل تحميل المنتج", en: "Failed to load item" },
  addSuccess: { ar: "تم إضافة المنتج بنجاح", en: "Item added successfully" },
  updateSuccess: {
    ar: "تم تحديث المنتج بنجاح",
    en: "Item updated successfully",
  },
  saveError: { ar: "فشل حفظ المنتج", en: "Failed to save item" },
  deleteSuccess: { ar: "تم حذف المنتج بنجاح", en: "Item deleted successfully" },
  deleteError: { ar: "فشل حذف المنتج", en: "Failed to delete item" },
  optional: { ar: "اختياري", en: "Optional" },
  translateToArabic: { ar: "ترجمة إلى العربية", en: "Translate to Arabic" },
  translateToEnglish: {
    ar: "ترجمة إلى الإنجليزية",
    en: "Translate to English",
  },
  translating: { ar: "جاري الترجمة...", en: "Translating..." },
  translateSuccessAr: {
    ar: "تمت الترجمة إلى العربية",
    en: "Translated to Arabic",
  },
  translateSuccessEn: {
    ar: "تمت الترجمة إلى الإنجليزية",
    en: "Translated to English",
  },
  translateError: { ar: "فشلت الترجمة", en: "Translation failed" },
  uploadImage: { ar: "رفع صورة", en: "Upload Image" },
  changeImage: { ar: "تغيير الصورة", en: "Change Image" },
  removeImage: { ar: "إزالة الصورة", en: "Remove Image" },
  uploading: { ar: "جاري الرفع...", en: "Uploading..." },
  uploadSuccess: {
    ar: "تم رفع الصورة بنجاح",
    en: "Image uploaded successfully",
  },
  uploadError: { ar: "فشل رفع الصورة", en: "Failed to upload image" },
  imageSizeError: {
    ar: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
    en: "Image size must be less than 5MB",
  },
  imageTypeError: {
    ar: "يرجى اختيار صورة بصيغة JPEG, PNG, WebP أو GIF",
    en: "Please select a JPEG, PNG, WebP or GIF image",
  },
};

// ============================================
// Main Component
// ============================================

export const MenuItemPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentLanguage } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { store } = useStore();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const isNew = !itemId || itemId === "new";
  const isEdit = !isNew;

  const { data: categories = [], isLoading: categoriesLoading } =
    useMenuCategories();
  const { data: existingProduct, isLoading: productLoading } = useProduct(
    isEdit ? itemId! : "",
  );
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(isEdit ? itemId! : "");
  const deleteProduct = useDeleteProduct();

  const isLoading = (isEdit && productLoading) || categoriesLoading;
  const isSaving = createProduct.isPending || updateProduct.isPending;
  const isDeleting = deleteProduct.isPending;

  const [form, setForm] = useState<MenuItemForm>({
    nameAr: "",
    nameEn: "",
    descriptionAr: "",
    descriptionEn: "",
    price: 0,
    menuCategoryId: "",
    isAvailable: true,
    isFeatured: false,
    preparationTimeMinutes: 15,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEdit && existingProduct) {
      // Use getProductImage to fix the image URL
      const fixedImageUrl = existingProduct.imageUrl
        ? getProductImage(
            { id: existingProduct.id, imageUrl: existingProduct.imageUrl },
            store?.id,
            "medium",
          )
        : undefined;

      setForm({
        nameAr: existingProduct.nameAr || "",
        nameEn: existingProduct.nameEn || "",
        descriptionAr: existingProduct.descriptionAr || "",
        descriptionEn: existingProduct.descriptionEn || "",
        price: existingProduct.price || 0,
        discountedPrice: existingProduct.discountedPrice,
        menuCategoryId: existingProduct.menuCategoryId || "",
        isAvailable: existingProduct.isAvailable ?? true,
        isFeatured: existingProduct.isFeatured ?? false,
        preparationTimeMinutes: existingProduct.preparationTimeMinutes || 15,
        sku: existingProduct.sku,
        barcode: existingProduct.barcode,
        imageUrl: fixedImageUrl,
      });
    }
  }, [isEdit, existingProduct, store?.id]);

  const updateField = (field: keyof MenuItemForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const u = { ...prev };
        delete u[field];
        return u;
      });
  };

  // Helper function to fix image URL (remove /uploads/)
  const fixImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    // Remove /uploads/ from anywhere in the URL
    let fixed = url.replace(/\/uploads\//g, "/");

    // Fix /Store/ to /stores/ (lowercase)
    fixed = fixed.replace(/\/Store\//g, "/stores/");

    // Fix Store/ (no leading slash) to stores/
    fixed = fixed.replace(/^Store\//, "stores/");

    // If it's a full URL, just return the fixed version
    if (fixed.startsWith("http://") || fixed.startsWith("https://")) {
      return fixed;
    }

    // If it's a relative path, prepend base URL
    if (fixed.startsWith("/")) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      return `${baseUrl}${fixed}`;
    }

    // If it's just a filename, construct the full URL
    if (store?.id) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      // Make sure the filename doesn't have any slashes
      const cleanFileName = fixed.replace(/^.*\//, "");
      return `${baseUrl}/stores/${store.id}/products/${cleanFileName}`;
    }

    return fixed;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(lang(t.imageTypeError));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang(t.imageSizeError));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      let imageUrl: string | undefined;

      if (isEdit && itemId) {
        const response = await fetch(
          `${baseUrl}${ENDPOINTS.STORE.PRODUCT_IMAGE(itemId)}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("store-access-token")}`,
            },
            body: formData,
          },
        );
        const result = await response.json();
        imageUrl = result?.data?.url || result?.url;
      } else {
        const response = await fetch(
          `${baseUrl}${ENDPOINTS.UPLOAD.IMAGE}?folder=products`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("store-access-token")}`,
            },
            body: formData,
          },
        );
        const result = await response.json();
        imageUrl = result?.data?.url || result?.url;
      }

      // Fix the image URL: remove /uploads/ and fix /Store/ to /stores/
      if (imageUrl) {
        const fixedUrl = fixImageUrl(imageUrl);
        updateField("imageUrl", fixedUrl || imageUrl);
      }
      toast.success(lang(t.uploadSuccess));
    } catch {
      toast.error(lang(t.uploadError));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    updateField("imageUrl", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTranslateField = async (field: "name" | "description") => {
    setTranslatingField(field);
    try {
      if (isAr) {
        if (field === "name" && form.nameAr.trim()) {
          const translated = await translateText(form.nameAr, "en");
          updateField("nameEn", translated);
        }
        if (field === "description" && form.descriptionAr.trim()) {
          const translated = await translateText(form.descriptionAr, "en");
          updateField("descriptionEn", translated);
        }
        toast.success(lang(t.translateSuccessEn));
      } else {
        if (field === "name" && form.nameEn.trim()) {
          const translated = await translateText(form.nameEn, "ar");
          updateField("nameAr", translated);
        }
        if (field === "description" && form.descriptionEn.trim()) {
          const translated = await translateText(form.descriptionEn, "ar");
          updateField("descriptionAr", translated);
        }
        toast.success(lang(t.translateSuccessAr));
      }
    } catch {
      toast.error(lang(t.translateError));
    } finally {
      setTranslatingField(null);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nameAr.trim()) e.nameAr = lang(t.nameArRequired);
    if (!form.nameEn.trim()) e.nameEn = lang(t.nameEnRequired);
    if (!form.price || form.price <= 0) e.price = lang(t.priceRequired);
    if (!form.menuCategoryId) e.menuCategoryId = lang(t.categoryRequired);
    if (form.preparationTimeMinutes <= 0)
      e.preparationTimeMinutes = lang(t.prepTimeRequired);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (isNew) {
        const dto: CreateProductDto = {
          menuCategoryId: form.menuCategoryId,
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          descriptionAr: form.descriptionAr || undefined,
          descriptionEn: form.descriptionEn || undefined,
          price: form.price,
          discountedPrice: form.discountedPrice,
          preparationTimeMinutes: form.preparationTimeMinutes,
          sku: form.sku,
          barcode: form.barcode,
          stockQuantity: 0,
          imageUrl: form.imageUrl,
        };
        await createProduct.mutateAsync(dto);
        toast.success(lang(t.addSuccess));
      } else {
        const dto: UpdateProductDto = {
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          descriptionAr: form.descriptionAr || undefined,
          descriptionEn: form.descriptionEn || undefined,
          price: form.price,
          discountedPrice: form.discountedPrice,
          preparationTimeMinutes: form.preparationTimeMinutes,
          isAvailable: form.isAvailable,
          isFeatured: form.isFeatured,
          sku: form.sku,
          barcode: form.barcode,
          stockQuantity: existingProduct?.stockQuantity ?? 0,
          imageUrl: form.imageUrl,
        };
        await updateProduct.mutateAsync(dto);
        toast.success(lang(t.updateSuccess));
      }
      navigate("/dashboard/menu");
    } catch (err) {
      const message = err instanceof Error ? err.message : lang(t.saveError);
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(lang(t.deleteConfirm))) return;
    try {
      await deleteProduct.mutateAsync(itemId!);
      toast.success(lang(t.deleteSuccess));
      navigate("/dashboard/menu");
    } catch (err) {
      const message = err instanceof Error ? err.message : lang(t.deleteError);
      toast.error(message);
    }
  };

  const inputClasses = (hasError: boolean) =>
    cn(
      "w-full px-4 py-3 rounded-xl text-sm transition-all duration-200",
      "bg-surface-100 dark:bg-surface-800",
      "text-surface-900 dark:text-white",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "border-2",
      hasError
        ? "border-error-400 dark:border-error-500 focus:border-error-500"
        : "border-transparent focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
      "focus:outline-none",
    );

  const TranslateBtn: React.FC<{ field: "name" | "description" }> = ({
    field,
  }) => {
    const hasSource = isAr
      ? field === "name"
        ? form.nameAr.trim()
        : form.descriptionAr.trim()
      : field === "name"
        ? form.nameEn.trim()
        : form.descriptionEn.trim();

    if (!hasSource || hasSource.length < 2) return null;

    const isBusy = translatingField === field;
    const isSourceRTL = isAr;

    return (
      <button
        type="button"
        onClick={() => handleTranslateField(field)}
        disabled={isBusy}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
          "text-[11px] font-semibold transition-all duration-200",
          "bg-primary-50 text-primary-700 border border-primary-200",
          "dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
          "hover:bg-primary-100 dark:hover:bg-primary-500/20 active:scale-[0.95]",
          "disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
          isSourceRTL ? "left-2" : "right-2",
        )}
        title={isAr ? lang(t.translateToEnglish) : lang(t.translateToArabic)}
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

  const { nameAr, nameEn, descriptionAr, descriptionEn } = form;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in max-w-3xl mx-auto pb-12",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/menu"
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
              d={
                isAr
                  ? "M8.25 4.5l7.5 7.5-7.5 7.5"
                  : "M15.75 19.5 8.25 12l7.5-7.5"
              }
            />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {isNew ? lang(t.newItem) : lang(t.editItem)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
              "dark:bg-primary-500 dark:hover:bg-primary-600",
              "shadow-sm hover:shadow-md",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2",
            )}
          >
            {isSaving ? (
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {isNew ? lang(t.addItem) : lang(t.saveChanges)}
              </>
            )}
          </button>
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
                "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
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
                lang(t.delete)
              )}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info + Image Card */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.basicInfo)}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Upload */}
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-2">
                {lang(t.image)}
              </label>
              <div className="relative aspect-square rounded-2xl bg-surface-100 dark:bg-surface-800 overflow-hidden group">
                {form.imageUrl ? (
                  <>
                    <img
                      src={getProductImage(
                        { id: isEdit ? itemId! : "", imageUrl: form.imageUrl },
                        store?.id,
                        "medium",
                      )}
                      alt="Product"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl bg-white/90 text-surface-700 hover:bg-white transition-colors"
                        title={lang(t.changeImage)}
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
                            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 rounded-xl bg-white/90 text-error-500 hover:bg-white transition-colors"
                        title={lang(t.removeImage)}
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
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-full flex flex-col items-center justify-center gap-2 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {isUploading ? (
                      <svg
                        className="w-8 h-8 animate-spin"
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
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    )}
                    <span className="text-xs font-medium">
                      {isUploading ? lang(t.uploading) : lang(t.uploadImage)}
                    </span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Names & Descriptions */}
            <div className="md:col-span-2 space-y-5">
              {isAr ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                      {lang(t.nameAr)} <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameAr}
                        onChange={(e) => updateField("nameAr", e.target.value)}
                        className={cn(
                          inputClasses(!!errors.nameAr),
                          "text-right",
                          nameAr.trim() && "pl-24",
                        )}
                        placeholder={lang(t.nameArPlaceholder)}
                        dir="rtl"
                      />
                      <TranslateBtn field="name" />
                    </div>
                    {errors.nameAr && (
                      <p className="text-xs text-error-500 mt-1">
                        {errors.nameAr}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                      {lang(t.nameEn)} <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => updateField("nameEn", e.target.value)}
                      className={cn(inputClasses(!!errors.nameEn), "text-left")}
                      placeholder={lang(t.nameEnPlaceholder)}
                      dir="ltr"
                    />
                    {errors.nameEn && (
                      <p className="text-xs text-error-500 mt-1">
                        {errors.nameEn}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                      {lang(t.nameEn)} <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => updateField("nameEn", e.target.value)}
                        className={cn(
                          inputClasses(!!errors.nameEn),
                          "text-left",
                          nameEn.trim() && "pr-24",
                        )}
                        placeholder={lang(t.nameEnPlaceholder)}
                        dir="ltr"
                      />
                      <TranslateBtn field="name" />
                    </div>
                    {errors.nameEn && (
                      <p className="text-xs text-error-500 mt-1">
                        {errors.nameEn}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                      {lang(t.nameAr)} <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nameAr}
                      onChange={(e) => updateField("nameAr", e.target.value)}
                      className={cn(
                        inputClasses(!!errors.nameAr),
                        "text-right",
                      )}
                      placeholder={lang(t.nameArPlaceholder)}
                      dir="rtl"
                    />
                    {errors.nameAr && (
                      <p className="text-xs text-error-500 mt-1">
                        {errors.nameAr}
                      </p>
                    )}
                  </div>
                </>
              )}
              {isAr ? (
                <>
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
                        onChange={(e) =>
                          updateField("descriptionAr", e.target.value)
                        }
                        rows={2}
                        className={cn(
                          inputClasses(false),
                          "resize-none text-right",
                          descriptionAr.trim() && "pl-24",
                        )}
                        placeholder={lang(t.descriptionArPlaceholder)}
                        dir="rtl"
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
                      onChange={(e) =>
                        updateField("descriptionEn", e.target.value)
                      }
                      rows={2}
                      className={cn(
                        inputClasses(false),
                        "resize-none text-left",
                      )}
                      placeholder={lang(t.descriptionEnPlaceholder)}
                      dir="ltr"
                    />
                  </div>
                </>
              ) : (
                <>
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
                        onChange={(e) =>
                          updateField("descriptionEn", e.target.value)
                        }
                        rows={2}
                        className={cn(
                          inputClasses(false),
                          "resize-none text-left",
                          descriptionEn.trim() && "pr-24",
                        )}
                        placeholder={lang(t.descriptionEnPlaceholder)}
                        dir="ltr"
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
                      onChange={(e) =>
                        updateField("descriptionAr", e.target.value)
                      }
                      rows={2}
                      className={cn(
                        inputClasses(false),
                        "resize-none text-right",
                      )}
                      placeholder={lang(t.descriptionArPlaceholder)}
                      dir="rtl"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-success-600 dark:text-success-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.pricing)}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.price)} <span className="text-error-500">*</span>
              </label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => updateField("price", Number(e.target.value))}
                min="0"
                step="0.01"
                className={inputClasses(!!errors.price)}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-xs text-error-500 mt-1">{errors.price}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                {lang(t.discountedPrice)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                type="number"
                value={form.discountedPrice || ""}
                onChange={(e) =>
                  updateField(
                    "discountedPrice",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                min="0"
                step="0.01"
                className={inputClasses(false)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-warning-600 dark:text-warning-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {lang(t.settings)}
            </h3>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                  {lang(t.category)} <span className="text-error-500">*</span>
                </label>
                <select
                  value={form.menuCategoryId}
                  onChange={(e) =>
                    updateField("menuCategoryId", e.target.value)
                  }
                  className={cn(
                    inputClasses(!!errors.menuCategoryId),
                    "cursor-pointer",
                  )}
                >
                  <option value="">{lang(t.selectCategory)}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {isAr ? cat.nameAr : cat.nameEn}
                    </option>
                  ))}
                </select>
                {errors.menuCategoryId && (
                  <p className="text-xs text-error-500 mt-1">
                    {errors.menuCategoryId}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                  {lang(t.preparationTime)}{" "}
                  <span className="text-error-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.preparationTimeMinutes}
                  onChange={(e) =>
                    updateField(
                      "preparationTimeMinutes",
                      Number(e.target.value),
                    )
                  }
                  min="1"
                  className={inputClasses(!!errors.preparationTimeMinutes)}
                />
                {errors.preparationTimeMinutes && (
                  <p className="text-xs text-error-500 mt-1">
                    {errors.preparationTimeMinutes}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                  {lang(t.sku)}{" "}
                  <span className="font-normal text-surface-400">
                    ({lang(t.optional)})
                  </span>
                </label>
                <input
                  type="text"
                  value={form.sku || ""}
                  onChange={(e) =>
                    updateField("sku", e.target.value || undefined)
                  }
                  className={inputClasses(false)}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                  {lang(t.barcode)}{" "}
                  <span className="font-normal text-surface-400">
                    ({lang(t.optional)})
                  </span>
                </label>
                <input
                  type="text"
                  value={form.barcode || ""}
                  onChange={(e) =>
                    updateField("barcode", e.target.value || undefined)
                  }
                  className={inputClasses(false)}
                  placeholder="6221234567890"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => updateField("isAvailable", e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                    form.isAvailable
                      ? "bg-primary-600 border-primary-600"
                      : "border-surface-300 dark:border-surface-600",
                  )}
                >
                  {form.isAvailable && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {lang(t.available)}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => updateField("isFeatured", e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                    form.isFeatured
                      ? "bg-primary-600 border-primary-600"
                      : "border-surface-300 dark:border-surface-600",
                  )}
                >
                  {form.isFeatured && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {lang(t.featured)}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
              "dark:bg-primary-500 dark:hover:bg-primary-600",
              "shadow-sm hover:shadow-md",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            )}
          >
            {isSaving ? (
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {isNew ? lang(t.addItem) : lang(t.saveChanges)}
              </>
            )}
          </button>
          <Link
            to="/dashboard/menu"
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 text-center"
          >
            {lang(t.cancel)}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MenuItemPage;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatCurrency } from "@shared/utils/formatters";
import { useMenuCategories } from "@shared/hooks/useMenuCategories";
import {
  useStoreProducts,
  useToggleProductAvailability,
  useDeleteProduct,
} from "@shared/hooks/useStoreProducts";
import type { ProductDto, MenuCategoryDto } from "@shared/types";
import { getProductImage } from "@/shared/utils/Parser";
import { useStore } from "@/app/providers/StoreProvider";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "قائمة الطعام", en: "Menu" },
  subtitle: {
    ar: "إدارة منتجات المتجر والأسعار والتوفر",
    en: "Manage store products, prices, and availability",
  },
  totalItems: { ar: "إجمالي المنتجات", en: "Total Items" },
  availableItems: { ar: "منتجات متاحة", en: "Available" },
  unavailableItems: { ar: "منتجات مخفية", en: "Hidden" },
  averagePrice: { ar: "متوسط السعر", en: "Avg. Price" },
  categories: { ar: "تصنيفات", en: "Categories" },
  allCategories: { ar: "جميع التصنيفات", en: "All Categories" },
  searchPlaceholder: { ar: "بحث عن منتج...", en: "Search products..." },
  available: { ar: "متاح", en: "Available" },
  unavailable: { ar: "غير متاح", en: "Unavailable" },
  discount: { ar: "خصم", en: "Off" },
  featured: { ar: "مميز", en: "Featured" },
  minutes: { ar: "دقيقة", en: "min" },
  noItems: { ar: "لا توجد منتجات", en: "No Items" },
  noItemsYet: {
    ar: "لم تقم بإضافة أي منتجات بعد",
    en: "You haven't added any items yet",
  },
  noSearchResults: {
    ar: "لا توجد نتائج مطابقة لبحثك",
    en: "No results match your search",
  },
  refresh: { ar: "تحديث", en: "Refresh" },
  newItem: { ar: "منتج جديد", en: "New Item" },
  addFirstItem: { ar: "إضافة أول منتج", en: "Add First Item" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  deleteConfirm: { ar: "تأكيد الحذف", en: "Confirm Delete" },
  deleteConfirmDesc: {
    ar: "هل أنت متأكد من حذف",
    en: "Are you sure you want to delete",
  },
  deleteWarning: {
    ar: "لا يمكن التراجع عن هذا الإجراء.",
    en: "This action cannot be undone.",
  },
  statusUpdated: { ar: "تم تحديث حالة المنتج", en: "Item status updated" },
  deleteSuccess: { ar: "تم حذف المنتج بنجاح", en: "Item deleted successfully" },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  addItem: { ar: "أضف منتجاً إلى القائمة", en: "Add an item to your menu" },
};

// ============================================
// Helpers
// ============================================

const getProductDisplayName = (product: ProductDto, isAr: boolean): string =>
  isAr ? product.nameAr : product.nameEn;

const getProductDisplayDescription = (
  product: ProductDto,
  isAr: boolean,
): string | undefined => (isAr ? product.descriptionAr : product.descriptionEn);

const getCategoryDisplayName = (
  category: MenuCategoryDto,
  isAr: boolean,
): string => (isAr ? category.nameAr : category.nameEn);

// ============================================
// Delete Confirm Modal
// ============================================

const DeleteConfirmModal: React.FC<{
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}> = ({ name, onConfirm, onCancel, isDeleting, isAr, lang }) => (
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
      <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 text-center">
        {lang(t.deleteConfirmDesc)} "{name}"? {lang(t.deleteWarning)}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
        >
          {lang(t.cancel)}
        </button>
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
      </div>
    </div>
  </div>
);

// ============================================
// MenuPage — Main Component
// ============================================

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);

  const { store } = useStore();

  const { data: categories = [], isLoading: categoriesLoading } =
    useMenuCategories();
  const {
    data: products = [],
    isLoading: productsLoading,
    refetch,
  } = useStoreProducts();
  const toggleAvailability = useToggleProductAvailability();
  const deleteProduct = useDeleteProduct();

  const isLoading = categoriesLoading || productsLoading;

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (activeCategory !== "all") {
      filtered = filtered.filter((p) => p.menuCategoryId === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nameAr?.toLowerCase().includes(q) ||
          p.nameEn?.toLowerCase().includes(q) ||
          p.descriptionAr?.toLowerCase().includes(q) ||
          p.descriptionEn?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [products, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    const available = products.filter((p) => p.isAvailable);
    const avgPrice =
      products.length > 0
        ? products.reduce((sum, p) => sum + (p.discountedPrice || p.price), 0) /
          products.length
        : 0;
    return {
      totalItems: products.length,
      availableItems: available.length,
      unavailableItems: products.length - available.length,
      averagePrice: avgPrice,
      totalCategories: categories.length,
    };
  }, [products, categories]);

  const handleToggleAvailability = async (productId: string) => {
    setTogglingId(productId);
    try {
      await toggleAvailability.mutateAsync(productId);
      toast.success(lang(t.statusUpdated));
    } catch {
      toast.error(lang(t.error));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      toast.success(lang(t.deleteSuccess));
      setDeleteTarget(null);
    } catch {
      toast.error(lang(t.error));
    } finally {
      setDeletingId(null);
    }
  };

  const statsCards = [
    {
      label: lang(t.totalItems),
      value: stats.totalItems,
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
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
          />
        </svg>
      ),
    },
    {
      label: lang(t.availableItems),
      value: stats.availableItems,
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
      label: lang(t.unavailableItems),
      value: stats.unavailableItems,
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
      label: lang(t.averagePrice),
      value: formatCurrency(stats.averagePrice),
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
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
    {
      label: lang(t.categories),
      value: stats.totalCategories,
      color:
        "bg-warning-100 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400",
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn btn-ghost btn-sm"
          >
            <svg
              className={cn("w-4 h-4", isLoading && "animate-spin")}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            <span className="hidden sm:inline">{lang(t.refresh)}</span>
          </button>
          <button
            onClick={() => navigate("/dashboard/menu/new")}
            className="btn btn-primary btn-sm"
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
            {lang(t.newItem)}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full sm:max-w-md">
          <svg
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500",
              isAr ? "right-3" : "left-3",
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <div className="relative w-full sm:max-w-md">
            <svg
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none",
                isAr ? "right-3" : "left-3",
              )}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang(t.searchPlaceholder)}
              className={cn(
                "w-full rounded-xl py-2.5 bg-white dark:bg-surface-900 text-sm",
                "text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500",
                "border-2 border-surface-200 dark:border-surface-700",
                "focus:outline-none focus:border-primary-500/50",
                "transition-all duration-200",
                isAr ? "pr-10 pl-10" : "pl-10 pr-10",
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors",
                  isAr ? "left-2" : "right-2",
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
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0",
              activeCategory === "all"
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700",
            )}
          >
            {lang(t.allCategories)} ({stats.totalItems})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0",
                activeCategory === cat.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700",
              )}
            >
              {getCategoryDisplayName(cat, isAr)} ({cat.productCount || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden animate-pulse"
            >
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-3 w-20 rounded-lg" />
                <div className="skeleton h-5 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-full rounded-lg" />
                <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                  <div className="skeleton h-6 w-20 rounded-lg" />
                  <div className="skeleton h-8 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
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
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
            {lang(t.noItems)}
          </p>
          <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
            {searchQuery || activeCategory !== "all"
              ? lang(t.noSearchResults)
              : lang(t.noItemsYet)}
          </p>
          <button
            onClick={() => navigate("/dashboard/menu/new")}
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
            {lang(t.addFirstItem)}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const hasDiscount = !!(
              product.discountedPrice && product.discountedPrice < product.price
            );
            const discountPercent = hasDiscount
              ? Math.round(
                  ((product.price - product.discountedPrice!) / product.price) *
                    100,
                )
              : 0;
            const displayPrice = hasDiscount
              ? product.discountedPrice!
              : product.price;
            const displayName = getProductDisplayName(product, isAr);
            const displayDescription = getProductDisplayDescription(
              product,
              isAr,
            );
            const isProcessing =
              togglingId === product.id || deletingId === product.id;

            return (
              <div
                key={product.id}
                className={cn(
                  "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden transition-all duration-200",
                  "hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md flex flex-col",
                  !product.isAvailable && "opacity-60",
                )}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-surface-100 dark:bg-surface-800 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={getProductImage(product, store?.id, "medium")}
                      alt={displayName}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        const parent = img.parentElement;
                        if (parent) {
                          const fallbackDiv = document.createElement("div");
                          fallbackDiv.className =
                            "w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800";
                          fallbackDiv.innerHTML = `
            <svg class="w-12 h-12 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          `;
                          parent.appendChild(fallbackDiv);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                      <svg
                        className="w-12 h-12 text-surface-300 dark:text-surface-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Status Badge */}
                  <span
                    className={cn(
                      "absolute top-3 px-2.5 py-1 rounded-full text-[10px] font-semibold border",
                      isAr ? "right-3" : "left-3",
                      product.isAvailable
                        ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20"
                        : "bg-surface-100 text-surface-500 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700",
                    )}
                  >
                    {product.isAvailable
                      ? lang(t.available)
                      : lang(t.unavailable)}
                  </span>
                  {hasDiscount && (
                    <span
                      className={cn(
                        "absolute top-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-500 text-white",
                        isAr ? "left-3" : "right-3",
                      )}
                    >
                      {discountPercent}% {lang(t.discount)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  {product.menuCategoryName && (
                    <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 mb-1">
                      {product.menuCategoryName}
                    </p>
                  )}
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-1 line-clamp-1">
                    {displayName}
                  </h3>
                  {displayDescription && (
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-3 line-clamp-2">
                      {displayDescription}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500 mb-3">
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
                    {product.preparationTimeMinutes} {lang(t.minutes)}
                  </div>
                  <div className="flex-1" />
                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-surface-900 dark:text-surface-100">
                            {formatCurrency(displayPrice)}
                          </span>
                          <span className="text-xs text-surface-400 line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-bold text-surface-900 dark:text-surface-100">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleToggleAvailability(product.id)}
                        disabled={isProcessing}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          product.isAvailable
                            ? "text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10"
                            : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800",
                        )}
                        title={
                          product.isAvailable
                            ? lang(t.unavailable)
                            : lang(t.available)
                        }
                      >
                        {togglingId === product.id ? (
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
                        ) : product.isAvailable ? (
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
                              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
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
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/dashboard/menu/${product.id}`)
                        }
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
                        onClick={() => setDeleteTarget(product)}
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
              </div>
            );
          })}
          {/* Add Item Card */}
          <button
            onClick={() => navigate("/dashboard/menu/new")}
            className="bg-white dark:bg-surface-900 rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-700 flex flex-col items-center justify-center gap-3 min-h-[280px] cursor-pointer transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md group"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-7 h-7 text-primary-600 dark:text-primary-400"
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
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {lang(t.newItem)}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {lang(t.addItem)}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={getProductDisplayName(deleteTarget, isAr)}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={deletingId === deleteTarget.id}
          isAr={isAr}
          lang={lang}
        />
      )}
    </div>
  );
};

export default MenuPage;

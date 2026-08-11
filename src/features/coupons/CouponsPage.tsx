import { useState, useMemo } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatNumber } from "@shared/utils/formatters";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@shared/hooks/useStoreCoupons";
import type { CouponDto } from "@shared/types";

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "الكوبونات", en: "Coupons" },
  subtitle: {
    ar: "إدارة كوبونات الخصم لمتجرك",
    en: "Manage discount coupons for your store",
  },
  code: { ar: "كود الكوبون", en: "Coupon Code" },
  codePlaceholder: { ar: "مثال: SUMMER20", en: "e.g. SUMMER20" },
  type: { ar: "نوع الخصم", en: "Discount Type" },
  value: { ar: "قيمة الخصم", en: "Discount Value" },
  valuePlaceholder: { ar: "قيمة الخصم", en: "Discount value" },
  usage: { ar: "الاستخدام", en: "Usage" },
  validFrom: { ar: "تاريخ البداية", en: "Start Date" },
  validTo: { ar: "تاريخ النهاية", en: "End Date" },
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  pending: { ar: "قيد المراجعة", en: "Pending" },
  approved: { ar: "مقبول", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  percentage: { ar: "نسبة مئوية", en: "Percentage" },
  fixed: { ar: "مبلغ ثابت", en: "Fixed Amount" },
  noCoupons: { ar: "لا توجد كوبونات", en: "No coupons yet" },
  noCouponsDesc: {
    ar: "قم بإنشاء أول كوبون خصم لعملائك",
    en: "Create your first discount coupon",
  },
  create: { ar: "إنشاء كوبون", en: "Create Coupon" },
  edit: { ar: "تعديل الكوبون", en: "Edit Coupon" },
  delete: { ar: "حذف", en: "Delete" },
  save: { ar: "حفظ الكوبون", en: "Save Coupon" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  minOrder: { ar: "الحد الأدنى للطلب", en: "Min Order" },
  minOrderPlaceholder: { ar: "0.00", en: "0.00" },
  maxDiscount: { ar: "الحد الأقصى للخصم", en: "Max Discount" },
  maxDiscountPlaceholder: { ar: "غير محدود", en: "Unlimited" },
  maxUsage: { ar: "الحد الأقصى للاستخدام", en: "Max Usage" },
  maxUsagePlaceholder: { ar: "100", en: "100" },
  perCustomer: { ar: "الحد لكل عميل", en: "Per Customer" },
  perCustomerPlaceholder: { ar: "1", en: "1" },
  created: { ar: "تم إنشاء الكوبون بنجاح", en: "Coupon created" },
  updated: { ar: "تم تحديث الكوبون", en: "Coupon updated" },
  deleted: { ar: "تم حذف الكوبون", en: "Coupon deleted" },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  optional: { ar: "اختياري", en: "Optional" },
  usageCount: { ar: "مرة", en: "times" },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  discountType: { ar: "نوع الخصم", en: "Discount Type" },
  ends: { ar: "ينتهي", en: "Ends" },
  pendingApproval: {
    ar: "بانتظار موافقة الإدارة",
    en: "Awaiting admin approval",
  },
  cannotEditApproved: {
    ar: "لا يمكن تعديل كوبون تمت الموافقة عليه",
    en: "Cannot edit an approved coupon",
  },
};

// ============================================================
// Helpers
// ============================================================

const formatDate = (date: string, isAr: boolean): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isEditable = (coupon: CouponDto): boolean => {
  // Only allow editing if approval status is "Pending" (not yet reviewed by admin)
  const status = (coupon as any).approvalStatus;
  return !status || status === "Pending";
};

const getApprovalStatus = (coupon: CouponDto): string => {
  const status = (coupon as any).approvalStatus;
  if (!status) return "active"; // Legacy coupons without status
  return status.toLowerCase();
};

// ============================================================
// CouponForm Modal
// ============================================================

interface CouponFormProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: CouponDto | null;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}

const CouponForm: React.FC<CouponFormProps> = ({
  isOpen,
  onClose,
  initial,
  isAr,
  lang,
}) => {
  const toast = useToast();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon(initial?.id || "");

  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<string>(
    initial
      ? initial.type === "Percentage"
        ? "Percentage"
        : "Fixed"
      : "Percentage",
  );
  const [value, setValue] = useState(initial?.value?.toString() ?? "");
  const [minOrder, setMinOrder] = useState(
    initial?.minimumOrderAmount?.toString() ?? "",
  );
  const [maxDiscount, setMaxDiscount] = useState(
    initial?.maximumDiscount?.toString() ?? "",
  );
  const [maxUsage, setMaxUsage] = useState(
    initial?.maxUsageCount?.toString() ?? "100",
  );
  const [perCustomer, setPerCustomer] = useState(
    initial?.maxPerCustomer?.toString() ?? "",
  );
  const [validFrom, setValidFrom] = useState(
    initial?.validFrom
      ? initial.validFrom.split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [validTo, setValidTo] = useState(
    initial?.validTo ? initial.validTo.split("T")[0] : "",
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const couponValue = parseFloat(value) || 0;
    if (couponValue <= 0) {
      toast.error(
        isAr
          ? "قيمة الكوبون يجب أن تكون أكبر من صفر"
          : "Coupon value must be greater than zero",
      );
      return;
    }

    if (!code.trim()) {
      toast.error(isAr ? "كود الكوبون مطلوب" : "Coupon code is required");
      return;
    }

    if (!validFrom || !validTo) {
      toast.error(isAr ? "التواريخ مطلوبة" : "Dates are required");
      return;
    }

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type: type, // "Percentage" or "Fixed"
        value: couponValue,
        minimumOrderAmount: minOrder ? parseFloat(minOrder) : 0,
        maximumDiscount:
          type === "Fixed" ? 0 : maxDiscount ? parseFloat(maxDiscount) : 0,
        maxUsageCount: parseInt(maxUsage) || 100,
        maxPerCustomer: perCustomer ? parseInt(perCustomer) : 0,
        validFrom: new Date(validFrom + "T00:00:00").toISOString(),
        validTo: new Date(validTo + "T23:59:59").toISOString(),
        startTime: "00:00:00",
        endTime: "23:59:59",
      };

      console.log(
        "Submitting coupon payload:",
        JSON.stringify(payload, null, 2),
      );

      if (initial) {
        const updatePayload = {
          ...payload,
          isActive: initial.isActive,
        };
        await updateMutation.mutateAsync(updatePayload as any);
        toast.success(lang(t.updated));
      } else {
        await createMutation.mutateAsync(payload as any);
        toast.success(lang(t.created));
      }
      onClose();
    } catch (err: any) {
      const errorMessage = err?.message || lang(t.error);
      console.error("Coupon submission error:", err);
      toast.error(errorMessage);
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-3 rounded-xl text-sm transition-all duration-200",
    "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white",
    "placeholder:text-surface-400 dark:placeholder:text-surface-500",
    "border-2 border-transparent",
    "focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
  );

  const labelClasses =
    "block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5";

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
                ? "املأ البيانات لإنشاء كوبون جديد"
                : "Fill in the details to create a new coupon"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>{lang(t.code)}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={lang(t.codePlaceholder)}
                required
                className={cn(
                  inputClasses,
                  "uppercase font-mono tracking-wider",
                )}
              />
            </div>
            <div>
              <label className={labelClasses}>{lang(t.discountType)}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputClasses}
              >
                <option value="Percentage">{lang(t.percentage)}</option>
                <option value="Fixed">{lang(t.fixed)}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>{lang(t.value)}</label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={lang(t.valuePlaceholder)}
                required
                type="number"
                min="1"
                step="0.01"
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>
                {lang(t.minOrder)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder={lang(t.minOrderPlaceholder)}
                type="number"
                min="0"
                step="0.01"
                className={inputClasses}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>
                {lang(t.maxDiscount)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder={lang(t.maxDiscountPlaceholder)}
                type="number"
                min="0"
                step="0.01"
                disabled={type === "Fixed"}
                className={cn(
                  inputClasses,
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              />
            </div>
            <div>
              <label className={labelClasses}>{lang(t.maxUsage)}</label>
              <input
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
                placeholder={lang(t.maxUsagePlaceholder)}
                type="number"
                min="1"
                required
                className={inputClasses}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>
                {lang(t.perCustomer)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                value={perCustomer}
                onChange={(e) => setPerCustomer(e.target.value)}
                placeholder={lang(t.perCustomerPlaceholder)}
                type="number"
                min="1"
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{lang(t.validFrom)}</label>
              <input
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                type="date"
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{lang(t.validTo)}</label>
              <input
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                type="date"
                required
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

// ============================================================
// Main Component
// ============================================================

export const CouponsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const { data: couponsData, isLoading } = useCoupons();
  const deleteCoupon = useDeleteCoupon();

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const coupons = useMemo(
    () => (Array.isArray(couponsData) ? couponsData : []),
    [couponsData],
  );

  const handleEditClick = (coupon: CouponDto) => {
    if (!isEditable(coupon)) {
      toast.error(lang(t.cannotEditApproved));
      return;
    }
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCoupon.mutateAsync(id);
      toast.success(lang(t.deleted));
    } catch {
      toast.error(lang(t.error));
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusConfig = (coupon: CouponDto) => {
    const status = getApprovalStatus(coupon);
    if (status === "pending") {
      return {
        label: lang(t.pending),
        className:
          "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
        dot: "bg-warning-500",
      };
    }
    if (status === "approved" || coupon.isActive) {
      return {
        label: lang(t.active),
        className:
          "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
        dot: "bg-success-500",
      };
    }
    if (status === "rejected") {
      return {
        label: lang(t.rejected),
        className:
          "bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20",
        dot: "bg-error-500",
      };
    }
    return {
      label: lang(t.inactive),
      className:
        "bg-surface-100 text-surface-500 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700",
      dot: "bg-surface-400",
    };
  };

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-12 w-full",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
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
            setEditingCoupon(null);
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 animate-pulse"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="skeleton h-6 w-24 rounded-lg" />
                  <div className="skeleton h-4 w-16 rounded-full" />
                </div>
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="skeleton h-8 w-20 rounded-lg" />
                <div className="skeleton h-1.5 w-full rounded-full" />
                <div className="skeleton h-4 w-3/4 rounded-lg" />
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                <div className="skeleton h-9 flex-1 rounded-xl" />
                <div className="skeleton h-9 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : coupons.length === 0 ? (
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
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6h.008v.008H6V6Z"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
            {lang(t.noCoupons)}
          </p>
          <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm">
            {lang(t.noCouponsDesc)}
          </p>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setShowForm(true);
            }}
            className="btn btn-primary mt-5"
          >
            {lang(t.create)}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const progress = Math.min(
              100,
              Math.round(
                ((coupon.currentUsageCount || 0) / coupon.maxUsageCount) * 100,
              ),
            );
            const isProcessing = deletingId === coupon.id;
            const isPct = coupon.type === "Percentage";
            const typeLabel = isPct ? lang(t.percentage) : lang(t.fixed);
            const statusConfig = getStatusConfig(coupon);
            const editable = isEditable(coupon);

            return (
              <div
                key={coupon.id}
                className={cn(
                  "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 transition-all duration-200 flex flex-col",
                  "hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md",
                  !coupon.isActive && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1.5">
                    <h3 className="font-mono text-lg font-bold tracking-tight text-primary-600 dark:text-primary-400">
                      {coupon.code}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
                      {typeLabel}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border",
                      statusConfig.className,
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        statusConfig.dot,
                      )}
                    />
                    {statusConfig.label}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                      {coupon.value}
                    </span>
                    <span className="text-sm font-semibold text-surface-500">
                      {isPct ? "%" : isAr ? "ج.م" : "EGP"}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-surface-400">
                      {lang(t.usage)}
                    </span>
                    <span className="text-[10px] font-medium text-surface-500">
                      {formatNumber(coupon.currentUsageCount || 0)} /{" "}
                      {formatNumber(coupon.maxUsageCount)} • {progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress > 80
                          ? "bg-error-500"
                          : progress > 50
                            ? "bg-warning-500"
                            : "bg-success-500",
                      )}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800/50 rounded-xl px-3 py-2 mb-4">
                  <span>{formatDate(coupon.validFrom, isAr)}</span>
                  <span className="text-surface-300 dark:text-surface-600">
                    {isAr ? "←" : "→"}
                  </span>
                  <span>{formatDate(coupon.validTo, isAr)}</span>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-surface-100 dark:border-surface-800">
                  <button
                    onClick={() => handleEditClick(coupon)}
                    disabled={isProcessing || !editable}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.98]",
                      editable
                        ? "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                        : "bg-surface-50 text-surface-300 dark:bg-surface-800/50 dark:text-surface-600 cursor-not-allowed",
                      "disabled:opacity-100",
                    )}
                    title={
                      !editable ? lang(t.cannotEditApproved) : lang(t.edit)
                    }
                  >
                    {lang(t.edit)}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isProcessing ? (
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
                    <span>{lang(t.delete)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <CouponForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingCoupon(null);
          }}
          initial={editingCoupon}
          isAr={isAr}
          lang={lang}
        />
      )}
    </div>
  );
};

export default CouponsPage;

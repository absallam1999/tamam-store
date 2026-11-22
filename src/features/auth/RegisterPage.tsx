import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useLanguage } from "@shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { apiClient, ApiError } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  CityListDto,
  StoreCategoryDto,
  SubmitStoreOnboardingDto,
} from "@shared/types";

// ============================================
// Types
// ============================================

interface RegisterFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  cityId: string;
  brandName: string;
  note: string;
  acceptTerms: boolean;
}

interface ValidationErrors {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  city?: string;
  category?: string;
  acceptTerms?: string;
}

const DEFAULT_LOCATION = { lat: 30.0444, lng: 31.2357 };

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "طلب إنشاء متجر", en: "Request a Store" },
  subtitle: {
    ar: "املأ البيانات وسنقوم بمراجعة طلبك والتواصل معك",
    en: "Fill in your details and we'll review your request and contact you",
  },
  fullName: { ar: "اسم صاحب المتجر", en: "Store Owner Name" },
  fullNamePlaceholder: { ar: "أحمد محمد", en: "Ahmed Mohamed" },
  phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
  phoneNumberPlaceholder: { ar: "01xxxxxxxxx", en: "01xxxxxxxxx" },
  email: { ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)" },
  emailPlaceholder: { ar: "owner@store.com", en: "owner@store.com" },
  storeName: { ar: "اسم المتجر التجاري", en: "Brand Name" },
  storeNamePlaceholder: {
    ar: "مطعم القاهرة الكبير",
    en: "Cairo Grand Restaurant",
  },
  address: { ar: "العنوان (اختياري)", en: "Address (optional)" },
  addressPlaceholder: {
    ar: "شارع رئيسي، رقم المبنى",
    en: "Main Street, Building Number",
  },
  city: { ar: "المدينة", en: "City" },
  selectCity: { ar: "اختر المدينة", en: "Select city" },
  loadingCities: { ar: "جاري تحميل المدن...", en: "Loading cities..." },
  storeCategory: { ar: "تصنيف المتجر", en: "Store Category" },
  selectCategory: {
    ar: "اختر تصنيف المتجر المناسب لنشاطك",
    en: "Choose the category that best fits your business",
  },
  loadingCategories: {
    ar: "جاري تحميل التصنيفات...",
    en: "Loading categories...",
  },
  noCategoriesAvailable: {
    ar: "لا توجد تصنيفات متاحة حالياً",
    en: "No categories available",
  },
  note: { ar: "ملاحظات إضافية (اختياري)", en: "Additional Notes (optional)" },
  notePlaceholder: {
    ar: "أي معلومات إضافية تود إضافتها...",
    en: "Any additional information...",
  },
  acceptTerms: { ar: "أوافق على", en: "I agree to the" },
  termsOfService: { ar: "شروط الخدمة", en: "Terms of Service" },
  and: { ar: "و", en: "and" },
  privacyPolicy: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  submit: { ar: "إرسال الطلب", en: "Submit Request" },
  submitting: { ar: "جاري إرسال الطلب...", en: "Submitting request..." },
  successTitle: { ar: "تم إرسال الطلب بنجاح", en: "Request Submitted" },
  successMessage: {
    ar: "شكراً لك! سنقوم بمراجعة طلبك والتواصل معك قريباً عبر رقم الهاتف المسجل.",
    en: "Thank you! We'll review your request and contact you soon via the registered phone number.",
  },
  backToLogin: { ar: "العودة إلى تسجيل الدخول", en: "Back to Sign In" },
  closeAlert: { ar: "إغلاق", en: "Close" },
  rateLimited: {
    ar: "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.",
    en: "Too many requests. Please try again in a moment.",
  },
  orDivider: { ar: "أو", en: "or" },
  haveAccount: { ar: "لديك حساب بالفعل؟", en: "Already have an account?" },
  signIn: { ar: "تسجيل الدخول", en: "Sign In" },
  optional: { ar: "اختياري", en: "Optional" },
  validation: {
    fullNameRequired: { ar: "الاسم مطلوب", en: "Name is required" },
    fullNameMin: {
      ar: "الاسم يجب أن يكون حرفين على الأقل",
      en: "Name must be at least 2 characters",
    },
    phoneNumberRequired: {
      ar: "رقم الهاتف مطلوب",
      en: "Phone number is required",
    },
    phoneNumberInvalid: {
      ar: "يرجى إدخال رقم هاتف صحيح",
      en: "Please enter a valid phone number",
    },
    emailInvalid: {
      ar: "يرجى إدخال بريد إلكتروني صحيح",
      en: "Please enter a valid email",
    },
    cityRequired: {
      ar: "يرجى اختيار المدينة",
      en: "Please select a city",
    },
    categoryRequired: {
      ar: "يرجى اختيار تصنيف المتجر",
      en: "Please select a store category",
    },
    termsRequired: {
      ar: "يجب الموافقة على الشروط والأحكام",
      en: "You must accept the terms and conditions",
    },
  },
};

// ============================================
// Component
// ============================================

export const RegisterPage: React.FC = () => {
  const { submitStoreRequest } = useAuth();
  const { currentLanguage } = useLanguage();
  const toast = useToast();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [cities, setCities] = useState<CityListDto[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  const [storeCategories, setStoreCategories] = useState<StoreCategoryDto[]>(
    [],
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    cityId: "",
    brandName: "",
    note: "",
    acceptTerms: false,
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchCities = async () => {
      try {
        const { data } = await apiClient.get<CityListDto[]>(
          ENDPOINTS.BROWSE.CITIES_LOOKUP,
        );
        if (!cancelled) setCities(data ?? []);
      } catch {
        if (!cancelled) setCities([]);
      } finally {
        if (!cancelled) setIsLoadingCities(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get<StoreCategoryDto[]>(
          ENDPOINTS.BROWSE.STORE_CATEGORIES,
        );
        if (!cancelled) {
          const active = (data ?? [])
            .filter((cat) => cat.isActive !== false)
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          setStoreCategories(active);
        }
      } catch {
        if (!cancelled) setStoreCategories([]);
      } finally {
        if (!cancelled) setIsLoadingCategories(false);
      }
    };

    fetchCities();
    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    field: keyof RegisterFormData,
    value: string | boolean,
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => {
        const u = { ...prev };
        delete u[field as keyof ValidationErrors];
        return u;
      });
    }
    if (serverError) setServerError(null);
  };

  const handleBlur = (field: string): void => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated.category;
      return updated;
    });
    setTouchedFields((prev) => ({ ...prev, category: true }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.fullName.trim())
      errors.fullName = lang(t.validation.fullNameRequired);
    else if (formData.fullName.trim().length < 2)
      errors.fullName = lang(t.validation.fullNameMin);

    if (!formData.phoneNumber.trim())
      errors.phoneNumber = lang(t.validation.phoneNumberRequired);
    else if (!/^01[0-25]\d{8}$/.test(formData.phoneNumber.trim()))
      errors.phoneNumber = lang(t.validation.phoneNumberInvalid);

    if (!formData.cityId) errors.city = lang(t.validation.cityRequired);

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = lang(t.validation.emailInvalid);

    if (!selectedCategoryId)
      errors.category = lang(t.validation.categoryRequired);

    if (!formData.acceptTerms)
      errors.acceptTerms = lang(t.validation.termsRequired);

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    setTouchedFields({
      fullName: true,
      phoneNumber: true,
      acceptTerms: true,
      category: true,
      city: true,
    });

    if (!validateForm()) {
      toast.error(
        isAr ? "يرجى تصحيح الحقول المطلوبة" : "Please fix the required fields",
      );
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const same = (v: string) => {
        const trimmed = v.trim();
        return trimmed || undefined;
      };

      const payload: SubmitStoreOnboardingDto = {
        phoneNumber: formData.phoneNumber.trim(),
        ownerName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        storeNameAr: formData.brandName.trim(),
        storeNameEn: formData.brandName.trim(),
        storeDescriptionAr: same(formData.note),
        storeDescriptionEn: same(formData.note),
        storeStreetAr: same(formData.address),
        storeStreetEn: same(formData.address),
        latitude: DEFAULT_LOCATION.lat,
        longitude: DEFAULT_LOCATION.lng,
        cityId: formData.cityId,
        storeCategoryId: selectedCategoryId,
      };

      await submitStoreRequest(payload);

      setIsSuccess(true);
      toast.success(lang(t.successTitle), {
        description: lang(t.successMessage),
      });
    } catch (error) {
      let message: string;
      if (error instanceof ApiError && error.status === 429) {
        message = lang(t.rateLimited);
      } else if (error instanceof Error) {
        message = error.message;
      } else {
        message = isAr ? "فشل إرسال الطلب" : "Failed to submit request";
      }
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClasses = (hasError: boolean) =>
    cn(
      "w-full py-3 rounded-xl",
      "bg-surface-100 dark:bg-surface-800",
      "text-surface-900 dark:text-surface-100",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "border-2 transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "text-sm",
      hasError
        ? "border-error-400 dark:border-error-500 focus:border-error-500 focus:ring-4 focus:ring-error-500/15"
        : "border-transparent focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15 dark:focus:ring-primary-400/15",
    );

  // ============================================
  // Success State — unchanged
  // ============================================
  if (isSuccess) {
    return (
      <div className="w-full animate-fade-in-up">
        <div className="text-center mb-6">
          <div
            className={cn(
              "mx-auto w-20 h-20 rounded-full",
              "bg-success-100 dark:bg-success-950/40",
              "flex items-center justify-center",
              "mb-6",
            )}
          >
            <svg
              className="w-10 h-10 text-success-600 dark:text-success-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
            {lang(t.successTitle)}
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto">
            {lang(t.successMessage)}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div
            className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl",
              "bg-info-50 dark:bg-info-950/30",
              "border border-info-200 dark:border-info-800/50",
            )}
          >
            <svg
              className="w-5 h-5 text-info-500 flex-shrink-0 mt-0.5"
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
            <p className="text-sm text-info-800 dark:text-info-300 leading-relaxed">
              {isAr
                ? "وقت المراجعة المتوقع: 24-48 ساعة"
                : "Expected review time: 24–48 hours"}
            </p>
          </div>

          <div
            className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl",
              "bg-surface-100 dark:bg-surface-800/60",
              "border border-surface-200 dark:border-surface-700",
            )}
          >
            <svg
              className="w-5 h-5 text-surface-500 dark:text-surface-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
              {isAr
                ? "ستتلقى رسالة نصية على رقم هاتفك فور الموافقة على طلبك"
                : "You'll receive an SMS at your phone number once approved"}
            </p>
          </div>
        </div>

        <Link
          to="/auth/login"
          className={cn(
            "w-full py-3 px-6 rounded-xl text-white font-semibold text-sm",
            "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
            "shadow-lg shadow-primary-600/25",
            "transition-all duration-200 active:scale-[0.98]",
            "flex items-center justify-center gap-2.5",
          )}
        >
          <svg
            className={cn("w-5 h-5", isAr && "scale-x-[-1]")}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span>{lang(t.backToLogin)}</span>
        </Link>
      </div>
    );
  }

  // ============================================
  // Form State
  // ============================================
  return (
    <div className="w-full animate-fade-in-up">
      <div
        className={cn(
          "mb-8 text-center",
          isAr ? "lg:text-right" : "lg:text-left",
        )}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
          {lang(t.title)}
        </h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
          {lang(t.subtitle)}
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className={cn(
            "mb-6 p-4 rounded-xl animate-fade-in",
            "bg-error-50 dark:bg-error-950/30",
            "border border-error-200 dark:border-error-800/50",
            "flex items-start gap-3",
          )}
        >
          <svg
            className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-error-700 dark:text-error-400">
              {serverError}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-error-400 hover:text-error-500 dark:hover:text-error-300 transition-colors flex-shrink-0"
            aria-label={lang(t.closeAlert)}
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
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
        className="space-y-5"
      >
        {/* ── Full Name ─────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-name"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.fullName)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.fullName && touchedFields.fullName
                  ? "text-error-400"
                  : "text-surface-400 dark:text-surface-500",
              )}
            >
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
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <input
              id="reg-name"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              placeholder={lang(t.fullNamePlaceholder)}
              autoComplete="name"
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.fullName && !!touchedFields.fullName,
                ),
                isAr ? "pr-11 pl-4" : "pl-11 pr-4",
              )}
            />
          </div>
          {validationErrors.fullName && touchedFields.fullName && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.fullName}
            </p>
          )}
        </div>

        {/* ── Phone ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-phone"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.phoneNumber)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.phoneNumber && touchedFields.phoneNumber
                  ? "text-error-400"
                  : "text-surface-400 dark:text-surface-500",
              )}
            >
              <svg
                className={cn("w-5 h-5", isAr && "scale-x-[-1]")}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
            </div>
            <input
              id="reg-phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                handleChange("phoneNumber", digits);
              }}
              onBlur={() => handleBlur("phoneNumber")}
              placeholder={lang(t.phoneNumberPlaceholder)}
              dir="ltr"
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.phoneNumber && !!touchedFields.phoneNumber,
                ),
                isAr ? "pr-11 pl-4" : "pl-11 pr-4",
              )}
            />
          </div>
          {validationErrors.phoneNumber && touchedFields.phoneNumber && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.phoneNumber}
            </p>
          )}
          <p className="text-[10px] text-surface-400 dark:text-surface-500">
            {isAr
              ? "أدخل رقم هاتف مصري (11 أرقام بعد +20)"
              : "Enter Egyptian phone number (11 digits after +20)"}
          </p>
        </div>

        {/* ── Email ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-email"
            className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.email)}
            <span className="text-[10px] font-normal text-surface-400 dark:text-surface-500">
              ({lang(t.optional)})
            </span>
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.email && touchedFields.email
                  ? "text-error-400"
                  : "text-surface-400 dark:text-surface-500",
              )}
            >
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
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <input
              id="reg-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder={lang(t.emailPlaceholder)}
              dir="ltr"
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.email && !!touchedFields.email,
                ),
                isAr ? "pr-11 pl-4" : "pl-11 pr-4",
              )}
            />
          </div>
          {validationErrors.email && touchedFields.email && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* ── Brand name ────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-brand"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.storeName)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                "text-surface-400 dark:text-surface-500",
              )}
            >
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
                  d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                />
              </svg>
            </div>
            <input
              id="reg-brand"
              type="text"
              value={formData.brandName}
              onChange={(e) => handleChange("brandName", e.target.value)}
              placeholder={lang(t.storeNamePlaceholder)}
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(false),
                isAr ? "pr-11 pl-4" : "pl-11 pr-4",
              )}
            />
          </div>
        </div>

        {/* ── City + Address ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              {lang(t.city)}
            </label>
            <div className="relative">
              <select
                value={formData.cityId}
                onChange={(e) => handleChange("cityId", e.target.value)}
                disabled={isSubmitting || isLoadingCities}
                className={cn(
                  inputBaseClasses(false),
                  isAr ? "pr-4 pl-10" : "pl-4 pr-10",
                  "appearance-none cursor-pointer",
                  (!formData.cityId || formData.cityId === "") &&
                    "text-surface-400 dark:text-surface-500",
                )}
              >
                <option value="">
                  {isLoadingCities ? lang(t.loadingCities) : lang(t.selectCity)}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {isAr
                      ? city.nameAr || city.nameEn
                      : city.nameEn || city.nameAr}
                  </option>
                ))}
              </select>
              <div
                className={cn(
                  "absolute inset-y-0 flex items-center pointer-events-none",
                  isAr ? "left-0 pl-3" : "right-0 pr-3",
                )}
              >
                {isLoadingCities ? (
                  <svg
                    className="w-4 h-4 animate-spin text-surface-400"
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
                    className="w-4 h-4 text-surface-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              {lang(t.address)}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder={lang(t.addressPlaceholder)}
              disabled={isSubmitting}
              className={cn(inputBaseClasses(false), "px-4")}
            />
          </div>
          {validationErrors.city && touchedFields.city && (
            <p className="text-xs text-error-500 dark:text-error-400 mt-1">
              {validationErrors.city}
            </p>
          )}
        </div>

        {/* ── Store Category ────────────────────────── */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            {lang(t.storeCategory)}
          </label>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.selectCategory)}
          </p>

          {isLoadingCategories ? (
            <div className="flex items-center gap-2 py-3">
              <svg
                className="w-4 h-4 animate-spin text-primary-500"
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
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.loadingCategories)}
              </span>
            </div>
          ) : storeCategories.length === 0 ? (
            <p className="text-xs text-surface-500 dark:text-surface-400 py-2">
              {lang(t.noCategoriesAvailable)}
            </p>
          ) : (
            <div
              className={cn(
                "flex flex-wrap gap-2 rounded-xl p-2 -m-2 transition-colors",
                validationErrors.category && touchedFields.category
                  ? "ring-2 ring-error-500/20"
                  : "",
              )}
            >
              {storeCategories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    disabled={isSubmitting}
                    aria-pressed={isSelected}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                      isSelected
                        ? "bg-primary-100 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300"
                        : "bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-primary-300",
                    )}
                  >
                    {isAr
                      ? category.nameAr || category.nameEn
                      : category.nameEn || category.nameAr}
                  </button>
                );
              })}
            </div>
          )}

          {validationErrors.category && touchedFields.category && (
            <p className="text-xs text-error-500 dark:text-error-400 mt-1">
              {validationErrors.category}
            </p>
          )}
        </div>

        {/* ── Note ──────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            {lang(t.note)}
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => handleChange("note", e.target.value)}
            placeholder={lang(t.notePlaceholder)}
            rows={3}
            disabled={isSubmitting}
            className={cn(inputBaseClasses(false), "px-4 resize-none")}
          />
        </div>

        {/* ── Terms ─────────────────────────────────────────────────── */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => handleChange("acceptTerms", e.target.checked)}
            disabled={isSubmitting}
            className="sr-only"
          />
          <div
            className={cn(
              "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 mt-0.5",
              formData.acceptTerms
                ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500"
                : "border-surface-300 dark:border-surface-600 group-hover:border-primary-400 bg-white dark:bg-surface-900",
            )}
          >
            {formData.acceptTerms && (
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
          <span className="text-sm text-surface-600 dark:text-surface-400">
            {lang(t.acceptTerms)}{" "}
            <a
              href="https://tamamapp.net/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {lang(t.termsOfService)}
            </a>{" "}
            {lang(t.and)}{" "}
            <a
              href="https://tamamapp.net/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {lang(t.privacyPolicy)}
            </a>
          </span>
        </label>
        {validationErrors.acceptTerms && touchedFields.acceptTerms && (
          <p className="text-xs text-error-500 dark:text-error-400">
            {validationErrors.acceptTerms}
          </p>
        )}

        {/* ── Submit ────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full py-3 px-6 rounded-xl text-white font-semibold text-sm",
            "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
            "shadow-lg shadow-primary-600/25",
            "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]",
            "flex items-center justify-center gap-2.5",
          )}
        >
          {isSubmitting ? (
            <>
              <span>{lang(t.submitting)}</span>
              <svg
                className="w-5 h-5 animate-spin"
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
            </>
          ) : (
            <>
              <span>{lang(t.submit)}</span>
              <svg
                className={cn("w-5 h-5", isAr && "scale-x-[-1]")}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </>
          )}
        </button>

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div className="relative pt-2">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-surface-200 dark:border-surface-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface-50 dark:bg-surface-950 px-3 text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
              {lang(t.orDivider)}
            </span>
          </div>
        </div>

        {/* ── Back to login ─────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {lang(t.haveAccount)}{" "}
            <Link
              to="/auth/login"
              className={cn(
                "font-semibold",
                "text-primary-600 dark:text-primary-400",
                "hover:text-primary-700 dark:hover:text-primary-300",
                "hover:underline underline-offset-2",
                "transition-colors",
              )}
            >
              {lang(t.signIn)}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;

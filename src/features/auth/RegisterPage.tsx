import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";

// ============================================
// Types
// ============================================

interface RegisterFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  prandName: string;
  note: string;
  acceptTerms: boolean;
}

interface ValidationErrors {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  acceptTerms?: string;
}

// ============================================
// Store types the user can select
// ============================================

const STORE_TYPES = [
  { value: "restaurant", labelAr: "مطعم", labelEn: "Restaurant" },
  { value: "cafe", labelAr: "كافيه", labelEn: "Café" },
  { value: "grocery", labelAr: "بقالة", labelEn: "Grocery" },
  { value: "bakery", labelAr: "مخبز", labelEn: "Bakery" },
  { value: "pharmacy", labelAr: "صيدلية", labelEn: "Pharmacy" },
  { value: "flowers", labelAr: "زهور", labelEn: "Flowers" },
  { value: "electronics", labelAr: "إلكترونيات", labelEn: "Electronics" },
  { value: "clothing", labelAr: "ملابس", labelEn: "Clothing" },
  { value: "other", labelAr: "أخرى", labelEn: "Other" },
];

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
  addressPlaceholder: { ar: "شارع رئيسي، مدينة", en: "Main Street, City" },
  city: { ar: "المدينة (اختياري)", en: "City (optional)" },
  cityPlaceholder: { ar: "القاهرة", en: "Cairo" },
  storeTypes: { ar: "نوع المتجر", en: "Store Type" },
  selectTypes: {
    ar: "اختر نوع المتجر (يمكنك اختيار أكثر من نوع)",
    en: "Select store type(s)",
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
    typesRequired: {
      ar: "يرجى اختيار نوع متجر واحد على الأقل",
      en: "Please select at least one store type",
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

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    prandName: "",
    note: "",
    acceptTerms: false,
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [isSuccess, setIsSuccess] = useState(false);

  // ============================================
  // Handlers
  // ============================================

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

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
    if (validationErrors.phoneNumber) {
      setValidationErrors((prev) => {
        const u = { ...prev };
        delete u.phoneNumber;
        return u;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.fullName.trim())
      errors.fullName = lang(t.validation.fullNameRequired);
    else if (formData.fullName.trim().length < 2)
      errors.fullName = lang(t.validation.fullNameMin);
    if (!formData.phoneNumber.trim())
      errors.phoneNumber = lang(t.validation.phoneNumberRequired);
    else if (!/^\d{7,15}$/.test(formData.phoneNumber.trim()))
      errors.phoneNumber = lang(t.validation.phoneNumberInvalid);
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = lang(t.validation.emailInvalid);
    if (selectedTypes.length === 0)
      errors.phoneNumber = lang(t.validation.typesRequired);
    if (!formData.acceptTerms)
      errors.acceptTerms = lang(t.validation.termsRequired);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTouchedFields({ fullName: true, phoneNumber: true, acceptTerms: true });
    if (!validateForm()) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      await submitStoreRequest({
        name: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        prandName: formData.prandName.trim() || undefined,
        note: formData.note.trim() || undefined,
        types: selectedTypes,
      });
      setIsSuccess(true);
      toast.success(lang(t.successTitle));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : lang(t.submitting) + " failed";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClasses = (hasError: boolean) =>
    cn(
      "w-full py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed text-sm",
      hasError
        ? "border-error-400 dark:border-error-500 focus:border-error-500 focus:ring-4 focus:ring-error-500/15"
        : "border-transparent focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
    );

  // ============================================
  // Success State
  // ============================================
  if (isSuccess) {
    return (
      <div className="w-full animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center animate-scale-in">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-success-500 dark:text-success-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
        </div>
        <div
          className=
            "text-center mb-8 text-center"
          
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">
            {lang(t.successTitle)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {lang(t.successMessage)}
          </p>
        </div>
        <Link
          to="/auth/login"
          className="block w-full py-3 px-6 rounded-xl text-center text-white font-semibold text-sm bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200 active:scale-[0.98]"
        >
          {lang(t.backToLogin)}
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
            "mb-6 p-4 rounded-xl animate-fade-in bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800/50 flex items-start gap-3",
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
            className="text-error-400 hover:text-error-500 flex-shrink-0"
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

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-name"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.fullName)}
          </label>
          <input
            id="reg-name"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            onBlur={() => handleBlur("fullName")}
            placeholder={lang(t.fullNamePlaceholder)}
            disabled={isSubmitting}
            className={cn(
              inputBaseClasses(
                !!validationErrors.fullName && !!touchedFields.fullName,
              ),
              isAr ? "pr-4 pl-4" : "pl-4 pr-4",
            )}
          />
          {validationErrors.fullName && touchedFields.fullName && (
            <p className="text-xs text-error-500 dark:text-error-400 mt-1">
              {validationErrors.fullName}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-phone"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.phoneNumber)}
          </label>
          <input
            id="reg-phone"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            onBlur={() => handleBlur("phoneNumber")}
            placeholder={lang(t.phoneNumberPlaceholder)}
            dir="ltr"
            disabled={isSubmitting}
            className={cn(
              inputBaseClasses(
                !!validationErrors.phoneNumber && !!touchedFields.phoneNumber,
              ),
              isAr ? "pr-4 pl-4" : "pl-4 pr-4",
            )}
          />
          {validationErrors.phoneNumber && touchedFields.phoneNumber && (
            <p className="text-xs text-error-500 dark:text-error-400 mt-1">
              {validationErrors.phoneNumber}
            </p>
          )}
        </div>

        {/* Email (optional) */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-email"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.email)}
          </label>
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
              isAr ? "pr-4 pl-4" : "pl-4 pr-4",
            )}
          />
          {validationErrors.email && touchedFields.email && (
            <p className="text-xs text-error-500 dark:text-error-400 mt-1">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Brand Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-brand"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.storeName)}
          </label>
          <input
            id="reg-brand"
            type="text"
            value={formData.prandName}
            onChange={(e) => handleChange("prandName", e.target.value)}
            placeholder={lang(t.storeNamePlaceholder)}
            disabled={isSubmitting}
            className={cn(
              inputBaseClasses(false),
              isAr ? "pr-4 pl-4" : "pl-4 pr-4",
            )}
          />
        </div>

        {/* Address + City (row) */}
        <div className="grid grid-cols-2 gap-3">
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
              className={cn(
                inputBaseClasses(false),
                isAr ? "pr-4 pl-4" : "pl-4 pr-4",
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              {lang(t.city)}
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder={lang(t.cityPlaceholder)}
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(false),
                isAr ? "pr-4 pl-4" : "pl-4 pr-4",
              )}
            />
          </div>
        </div>

        {/* Store Types */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            {lang(t.storeTypes)}
          </label>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {lang(t.selectTypes)}
          </p>
          <div className="flex flex-wrap gap-2">
            {STORE_TYPES.map((type) => {
              const isSelected = selectedTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleType(type.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                    isSelected
                      ? "bg-primary-100 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300"
                      : "bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-primary-300",
                  )}
                >
                  {isAr ? type.labelAr : type.labelEn}
                </button>
              );
            })}
          </div>
          {selectedTypes.length === 0 && touchedFields.phoneNumber && (
            <p className="text-xs text-error-500 dark:text-error-400">
              {lang(t.validation.typesRequired)}
            </p>
          )}
        </div>

        {/* Note */}
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
            className={cn(
              inputBaseClasses(false),
              "resize-none",
              isAr ? "pr-4 pl-4" : "pl-4 pr-4",
            )}
          />
        </div>

        {/* Terms */}
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
                ? "bg-primary-600 border-primary-600"
                : "border-surface-300 dark:border-surface-600 group-hover:border-primary-400",
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
            <Link
              to="https://tamaam.cloud/terms"
              target="_blank"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {lang(t.termsOfService)}
            </Link>{" "}
            {lang(t.and)}{" "}
            <Link
              to="https://tamaam.cloud/privacy"
              target="_blank"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {lang(t.privacyPolicy)}
            </Link>
          </span>
        </label>
        {validationErrors.acceptTerms && touchedFields.acceptTerms && (
          <p className="text-xs text-error-500 dark:text-error-400">
            {validationErrors.acceptTerms}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200 disabled:opacity-60 active:scale-[0.98] flex items-center justify-center gap-2.5",
          )}
        >
          {isSubmitting ? (
            <>
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
              <span>{lang(t.submitting)}</span>
            </>
          ) : (
            <span>{lang(t.submit)}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;

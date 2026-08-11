import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";

// ============================================
// Types
// ============================================

interface LoginFormData {
  phoneNumber: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  phoneNumber?: string;
  password?: string;
}

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "تسجيل الدخول", en: "Sign In" },
  subtitle: {
    ar: "أدخل بياناتك للوصول إلى لوحة تحكم متجرك",
    en: "Enter your credentials to access your store dashboard",
  },
  phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
  phoneNumberPlaceholder: { ar: "0123456789", en: "0123456789" },
  password: { ar: "كلمة المرور", en: "Password" },
  passwordPlaceholder: { ar: "••••••••", en: "••••••••" },
  rememberMe: { ar: "تذكرني", en: "Remember me" },
  forgotPassword: { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },
  signIn: { ar: "تسجيل الدخول", en: "Sign In" },
  signingIn: { ar: "جاري تسجيل الدخول...", en: "Signing in..." },
  showPassword: { ar: "إظهار كلمة المرور", en: "Show password" },
  hidePassword: { ar: "إخفاء كلمة المرور", en: "Hide password" },
  successMessage: { ar: "تم تسجيل الدخول بنجاح", en: "Successfully signed in" },
  errorMessage: { ar: "فشل تسجيل الدخول", en: "Login failed" },
  validation: {
    phoneNumberRequired: {
      ar: "رقم الهاتف مطلوب",
      en: "Phone number is required",
    },
    phoneNumberInvalid: {
      ar: "يرجى إدخال رقم هاتف صحيح",
      en: "Please enter a valid phone number",
    },
    passwordRequired: { ar: "كلمة المرور مطلوبة", en: "Password is required" },
    passwordLength: {
      ar: "كلمة المرور يجب أن تكون ٦ أحرف على الأقل",
      en: "Password must be at least 6 characters",
    },
  },
  closeAlert: { ar: "إغلاق", en: "Close" },
};

// ============================================
// Component
// ============================================

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { currentLanguage } = useLanguage();
  const toast = useToast();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [formData, setFormData] = useState<LoginFormData>({
    phoneNumber: "",
    password: "",
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  const handleChange = (
    field: keyof LoginFormData,
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

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.phoneNumber.trim())
      errors.phoneNumber = lang(t.validation.phoneNumberRequired);
    else if (!/^\d+$/.test(formData.phoneNumber.trim()))
      errors.phoneNumber = lang(t.validation.phoneNumberInvalid);
    else if (formData.phoneNumber.trim().length < 7)
      errors.phoneNumber = lang(t.validation.phoneNumberInvalid);
    if (!formData.password)
      errors.password = lang(t.validation.passwordRequired);
    else if (formData.password.length < 6)
      errors.password = lang(t.validation.passwordLength);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTouchedFields({ phoneNumber: true, password: true });
    if (!validateForm()) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      await login({
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        remember: formData.rememberMe,
      });

      try {
        const session = {
          device: navigator.platform || "Unknown Device",
          browser: navigator.userAgent.includes("Chrome")
            ? "Chrome"
            : navigator.userAgent.includes("Firefox")
              ? "Firefox"
              : navigator.userAgent.includes("Safari")
                ? "Safari"
                : "Unknown Browser",
          location:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
          time: new Date().toISOString(),
          ip: "***.***.***.***",
        };
        localStorage.setItem("last-session", JSON.stringify(session));
      } catch {}

      toast.success(lang(t.successMessage));
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : lang(t.errorMessage);
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

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Phone Number */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-phone"
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
              id="login-phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              onBlur={() => handleBlur("phoneNumber")}
              placeholder={lang(t.phoneNumberPlaceholder)}
              autoComplete="tel"
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
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.password)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                validationErrors.password && touchedFields.password
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
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder={lang(t.passwordPlaceholder)}
              autoComplete="current-password"
              dir="ltr"
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!validationErrors.password && !!touchedFields.password,
                ),
                isAr ? "pr-11 pl-12" : "pl-11 pr-12",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 rounded-lg",
                isAr ? "left-3" : "right-3",
                "text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300",
              )}
              aria-label={
                showPassword ? lang(t.hidePassword) : lang(t.showPassword)
              }
              tabIndex={-1}
            >
              {showPassword ? (
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
              ) : (
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
          </div>
          {validationErrors.password && touchedFields.password && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {validationErrors.password}
            </p>
          )}
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleChange("rememberMe", e.target.checked)}
                disabled={isSubmitting}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                  formData.rememberMe
                    ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500"
                    : "border-surface-300 dark:border-surface-600 group-hover:border-primary-400",
                )}
              >
                {formData.rememberMe && (
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
            </div>
            <span className="text-sm text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-200">
              {lang(t.rememberMe)}
            </span>
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline underline-offset-2"
          >
            {lang(t.forgotPassword)}
          </Link>
        </div>

        {/* Submit */}
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
              <span>{lang(t.signingIn)}</span>
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
              <span>{lang(t.signIn)}</span>
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
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

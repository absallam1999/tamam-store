import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";

// ============================================
// Types
// ============================================

type StrengthLevel = "weak" | "fair" | "good" | "strong";

const strengthConfig: Record<
  StrengthLevel,
  { labelAr: string; labelEn: string; color: string; percentage: number }
> = {
  weak: {
    labelAr: "ضعيفة",
    labelEn: "Weak",
    color: "bg-error-500",
    percentage: 25,
  },
  fair: {
    labelAr: "متوسطة",
    labelEn: "Fair",
    color: "bg-warning-500",
    percentage: 50,
  },
  good: {
    labelAr: "جيدة",
    labelEn: "Good",
    color: "bg-primary-500",
    percentage: 75,
  },
  strong: {
    labelAr: "قوية",
    labelEn: "Strong",
    color: "bg-success-500",
    percentage: 100,
  },
};

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = {
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasDigit: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

function validatePasswordStrength(value: string): StrengthLevel {
  let score = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) score++;
  if (value.length >= 12) score++;
  if (PASSWORD_REGEX.hasUpper.test(value)) score++;
  if (PASSWORD_REGEX.hasLower.test(value)) score++;
  if (PASSWORD_REGEX.hasDigit.test(value)) score++;
  if (PASSWORD_REGEX.hasSpecial.test(value)) score++;
  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  if (score <= 4) return "good";
  return "strong";
}

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "تعيين كلمة مرور جديدة", en: "Set New Password" },
  subtitle: {
    ar: "اختر كلمة مرور قوية وآمنة لحماية حساب متجرك",
    en: "Choose a strong, secure password to protect your store account",
  },
  newPassword: { ar: "كلمة المرور الجديدة", en: "New Password" },
  passwordPlaceholder: { ar: "••••••••", en: "••••••••" },
  confirmPassword: { ar: "تأكيد كلمة المرور", en: "Confirm Password" },
  showPassword: { ar: "إظهار كلمة المرور", en: "Show password" },
  hidePassword: { ar: "إخفاء كلمة المرور", en: "Hide password" },
  submit: { ar: "تغيير كلمة المرور", en: "Change Password" },
  submitting: { ar: "جاري تغيير كلمة المرور...", en: "Changing password..." },
  backToLogin: { ar: "العودة إلى تسجيل الدخول", en: "Back to Sign In" },
  skip: { ar: "تخطي والدخول للوحة التحكم", en: "Skip to Dashboard" },
  passwordMatch: { ar: "كلمة المرور متطابقة ✓", en: "Passwords match ✓" },
  strengthLabel: { ar: "قوة كلمة المرور:", en: "Password strength:" },
  successTitle: { ar: "تم تغيير كلمة المرور", en: "Password Changed" },
  successMessage: {
    ar: "تم تغيير كلمة المرور بنجاح.",
    en: "Password changed successfully.",
  },
  loginNow: { ar: "تسجيل الدخول الآن", en: "Sign In Now" },
  passwordRequired: {
    ar: "كلمة المرور الجديدة مطلوبة",
    en: "New password is required",
  },
  passwordLength: {
    ar: `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل`,
    en: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  },
  confirmRequired: {
    ar: "يرجى تأكيد كلمة المرور",
    en: "Please confirm your password",
  },
  confirmMatch: { ar: "كلمة المرور غير متطابقة", en: "Passwords do not match" },
  serverError: { ar: "فشل تغيير كلمة المرور", en: "Failed to change password" },
  unexpectedError: {
    ar: "حدث خطأ غير متوقع",
    en: "An unexpected error occurred",
  },
  closeAlert: { ar: "إغلاق", en: "Close" },
  noPhoneError: {
    ar: "رقم الهاتف غير متوفر. يرجى العودة وإعادة المحاولة.",
    en: "Phone number not available. Please go back and try again.",
  },
  notAuthenticated: {
    ar: "غير مصرح. يرجى تسجيل الدخول أولاً.",
    en: "Not authenticated. Please log in first.",
  },
};

// ============================================
// Component
// ============================================

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { currentLanguage } = useLanguage();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const phoneNumber =
    (location.state as { phoneNumber?: string })?.phoneNumber ||
    sessionStorage.getItem("reset-phone") ||
    "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strengthLevel, setStrengthLevel] = useState<StrengthLevel>("weak");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setStrengthLevel(validatePasswordStrength(value));
    if (errors.password)
      setErrors((prev) => {
        const u = { ...prev };
        delete u.password;
        return u;
      });
    if (serverError) setServerError(null);
  };

  const handleBlur = (field: string) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!password) e.password = lang(t.passwordRequired);
    else if (password.length < PASSWORD_MIN_LENGTH)
      e.password = lang(t.passwordLength);
    if (!confirmPassword) e.confirmPassword = lang(t.confirmRequired);
    else if (password !== confirmPassword)
      e.confirmPassword = lang(t.confirmMatch);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouchedFields({ password: true, confirmPassword: true });
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        newPassword: password,
      });

      sessionStorage.removeItem("reset-phone");
      setIsSuccess(true);
      toast.success(lang(t.successTitle));
    } catch (err: any) {
      // Handle 401 - user not authenticated
      if (err?.response?.status === 401) {
        setServerError(lang(t.notAuthenticated));
        toast.error(lang(t.notAuthenticated));
      } else {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          lang(t.unexpectedError);
        setServerError(message);
        toast.error(lang(t.serverError));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.removeItem("reset-phone");
    navigate("/dashboard", { replace: true });
  };

  const strength = strengthConfig[strengthLevel];
  const inputBaseClasses = (hasError: boolean) =>
    cn(
      "w-full py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed text-sm",
      hasError
        ? "border-error-400 dark:border-error-500 focus:border-error-500 focus:ring-4 focus:ring-error-500/15"
        : "border-transparent focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
    );

  // No phone number
  if (!phoneNumber) {
    return (
      <div className="w-full text-center animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-error-500 dark:text-error-400"
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
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 mb-3">
          {lang(t.noPhoneError)}
        </h1>
        <Link
          to="/auth/forgot-password"
          className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          {isAr ? "العودة" : "Go back"}
        </Link>
      </div>
    );
  }

  // Success
  if (isSuccess) {
    return (
      <div className="w-full text-center animate-fade-in-up">
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
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">
          {lang(t.successTitle)}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">
          {lang(t.successMessage)}
        </p>
        <div className="space-y-3">
          <button
            onClick={handleSkip}
            className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200 active:scale-[0.98]"
          >
            {lang(t.skip)}
          </button>
          <Link
            to="/auth/login"
            className="block w-full py-3 px-6 rounded-xl text-center font-medium text-sm bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            {lang(t.backToLogin)}
          </Link>
        </div>
      </div>
    );
  }

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
          className="mb-6 p-4 rounded-xl bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800/50 flex items-start gap-3"
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
          <p className="text-sm font-medium text-error-700 dark:text-error-400 flex-1">
            {serverError}
          </p>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-error-400 hover:text-error-500"
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
        {/* New Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="reset-password"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.newPassword)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                errors.password && touchedFields.password
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
              id="reset-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder={lang(t.passwordPlaceholder)}
              dir="ltr"
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(!!errors.password && !!touchedFields.password),
                isAr ? "pr-11 pl-12" : "pl-11 pr-12",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 rounded-lg",
                isAr ? "left-3" : "right-3",
                "text-surface-400 hover:text-surface-600",
              )}
              tabIndex={-1}
              aria-label={
                showPassword ? lang(t.hidePassword) : lang(t.showPassword)
              }
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
          {password.length > 0 && !errors.password && (
            <div className="mt-2 space-y-1.5">
              <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    strength.color,
                  )}
                  style={{ width: `${strength.percentage}%` }}
                />
              </div>
              <p
                className={cn(
                  "text-xs font-medium",
                  strengthLevel === "weak" && "text-error-500",
                  strengthLevel === "fair" && "text-warning-500",
                  strengthLevel === "good" && "text-primary-500",
                  strengthLevel === "strong" && "text-success-500",
                )}
              >
                {lang(t.strengthLabel)}{" "}
                {isAr ? strength.labelAr : strength.labelEn}
              </p>
            </div>
          )}
          {errors.password && touchedFields.password && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="reset-confirm-password"
            className="block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {lang(t.confirmPassword)}
          </label>
          <div className="relative">
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isAr ? "right-3" : "left-3",
                errors.confirmPassword && touchedFields.confirmPassword
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
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                />
              </svg>
            </div>
            <input
              id="reset-confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => {
                    const u = { ...prev };
                    delete u.confirmPassword;
                    return u;
                  });
              }}
              onBlur={() => handleBlur("confirmPassword")}
              placeholder={lang(t.passwordPlaceholder)}
              dir="ltr"
              disabled={isSubmitting}
              className={cn(
                inputBaseClasses(
                  !!errors.confirmPassword && !!touchedFields.confirmPassword,
                ),
                isAr ? "pr-11 pl-12" : "pl-11 pr-12",
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 rounded-lg",
                isAr ? "left-3" : "right-3",
                "text-surface-400 hover:text-surface-600",
              )}
              tabIndex={-1}
            >
              {showConfirm ? (
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
          {errors.confirmPassword && touchedFields.confirmPassword && (
            <p
              className={cn(
                "text-xs text-error-500 dark:text-error-400 mt-1",
                isAr ? "mr-1" : "ml-1",
              )}
            >
              {errors.confirmPassword}
            </p>
          )}
          {confirmPassword.length > 0 &&
            !errors.confirmPassword &&
            password === confirmPassword && (
              <p className="text-xs text-success-500 dark:text-success-400 mt-1">
                {lang(t.passwordMatch)}
              </p>
            )}
        </div>

        {/* Submit + Skip */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200 disabled:opacity-60 active:scale-[0.98] flex items-center justify-center gap-2.5"
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
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-xl font-medium text-sm bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            {lang(t.skip)}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
        <Link
          to="/auth/login"
          className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          {lang(t.backToLogin)}
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;

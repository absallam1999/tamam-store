import React, {
  useState,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";

// ============================================
// Phone Validation
// ============================================

/**
 * Validates phone numbers.
 * Accepts: 01xxxxxxxxx, +201xxxxxxxxx, 201xxxxxxxxx
 */
const PHONE_REGEX = /^(\+?2)?01[0-25-9]\d{8}$/;

function isValidEgyptianPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}

// ============================================
// Error Extractor
// ============================================

/**
 * Extracts a readable error message from various API error shapes.
 */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;

  // Direct string
  if (typeof err === "string") return err;

  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, any>;

    // Check if it's an Axios error with response
    if (e.response) {
      // Axios error - check response.data
      const responseData = e.response.data;

      if (typeof responseData === "string") {
        // Sometimes the response data is a plain string
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.Message) return parsed.Message;
          if (parsed.message) return parsed.message;
        } catch {
          return responseData;
        }
      }

      if (typeof responseData === "object" && responseData !== null) {
        if (
          typeof responseData.Message === "string" &&
          responseData.Message.length > 0
        ) {
          return responseData.Message;
        }
        if (
          typeof responseData.message === "string" &&
          responseData.message.length > 0
        ) {
          return responseData.message;
        }
      }

      // Check HTTP status text
      if (e.response.status === 400) {
        return e.response.statusText || fallback;
      }
    }

    // Direct Message property
    if (typeof e.Message === "string" && e.Message.length > 0) {
      return e.Message;
    }

    // Direct message property
    if (
      typeof e.message === "string" &&
      e.message.length > 0 &&
      e.message !== "Request failed with status code 400"
    ) {
      return e.message;
    }

    // Nested data
    if (e.data) {
      if (typeof e.data === "string") return e.data;
      if (typeof e.data === "object") {
        if (typeof e.data.Message === "string") return e.data.Message;
        if (typeof e.data.message === "string") return e.data.message;
      }
    }
  }

  return fallback;
}

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "نسيت كلمة المرور؟", en: "Forgot Password?" },
  subtitle: {
    ar: "أدخل رقم هاتفك وسنرسل لك رمز تحقق لإعادة تعيين كلمة المرور.",
    en: "Enter your phone number and we'll send you a verification code to reset your password.",
  },
  phoneNumber: { ar: "رقم الهاتف", en: "Phone Number" },
  phoneNumberPlaceholder: { ar: "01xxxxxxxxx", en: "01xxxxxxxxx" },
  sendCode: { ar: "إرسال رمز التحقق", en: "Send Verification Code" },
  sendingCode: { ar: "جاري الإرسال...", en: "Sending..." },

  // OTP Step
  otpTitle: { ar: "تأكيد رمز التحقق", en: "Verify OTP" },
  otpSubtitle: {
    ar: "أدخل رمز التحقق المكون من 6 أرقام المرسل إلى",
    en: "Enter the 6-digit verification code sent to",
  },
  verify: { ar: "تأكيد", en: "Verify" },
  verifying: { ar: "جاري التحقق...", en: "Verifying..." },
  resendCode: { ar: "إعادة إرسال الرمز", en: "Resend code" },
  changePhone: { ar: "تغيير رقم الهاتف", en: "Change phone number" },
  codeSentSuccess: { ar: "تم إرسال رمز التحقق", en: "Verification code sent" },

  // Success
  successTitle: { ar: "تم التحقق", en: "Verified" },
  successMessage: {
    ar: "تم التحقق من رقم هاتفك. يمكنك الآن إعادة تعيين كلمة المرور.",
    en: "Your phone number has been verified. You can now reset your password.",
  },
  resetPassword: { ar: "إعادة تعيين كلمة المرور", en: "Reset Password" },
  skip: { ar: "تخطي", en: "Skip" },
  backToLogin: { ar: "العودة إلى تسجيل الدخول", en: "Return to Sign In" },

  // Errors
  phoneRequired: { ar: "رقم الهاتف مطلوب", en: "Phone number is required" },
  phoneInvalid: {
    ar: "يرجى إدخال رقم هاتف مصري صحيح (01xxxxxxxxx)",
    en: "Please enter a valid Egyptian phone number (01xxxxxxxxx)",
  },
  accountNotFound: {
    ar: "لا يوجد حساب مرتبط بهذا الرقم. يرجى التحقق من الرقم أو إنشاء حساب جديد.",
    en: "No account found with this number. Please check the number or create a new account.",
  },
  otpRequired: { ar: "رمز التحقق مطلوب", en: "Verification code is required" },
  otpLength: {
    ar: "رمز التحقق يجب أن يكون 6 أرقام",
    en: "Code must be 6 digits",
  },
  closeAlert: { ar: "إغلاق", en: "Close" },
  seconds: { ar: "ثانية", en: "s" },

  // Fallback errors
  sendOtpFailed: {
    ar: "فشل إرسال رمز التحقق",
    en: "Failed to send verification code",
  },
  verifyOtpFailed: { ar: "فشل التحقق من الرمز", en: "Failed to verify code" },
};

// ============================================
// Component
// ============================================

export const ForgotPasswordPage: React.FC = () => {
  const { sendOtp, verifyOtp, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(
      () => setResendCooldown((p) => Math.max(0, p - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ============================================
  // Phone Input Handler — restrict to Egyptian format
  // ============================================
  const handlePhoneChange = (value: string): void => {
    let cleaned = value.replace(/[^\d+]/g, "");

    if (cleaned.startsWith("+")) {
      if (cleaned.length > 3 && !cleaned.startsWith("+20")) {
        cleaned = "+2" + cleaned.replace(/^\+/, "");
      }
    } else if (cleaned.startsWith("2")) {
      if (cleaned.length > 2 && !cleaned.startsWith("20")) {
        cleaned = "2" + cleaned.slice(0, 11);
      }
    } else if (!cleaned.startsWith("0")) {
      cleaned = "0" + cleaned;
    }

    const maxLen = cleaned.startsWith("+")
      ? 13
      : cleaned.startsWith("20")
        ? 12
        : 11;
    cleaned = cleaned.slice(0, maxLen);

    setPhoneNumber(cleaned);
    if (fieldError) setFieldError(null);
    if (error) setError(null);
  };

  // ============================================
  // Phone Step
  // ============================================
  const validatePhone = (): boolean => {
    if (!phoneNumber.trim()) {
      setFieldError(lang(t.phoneRequired));
      return false;
    }
    if (!isValidEgyptianPhone(phoneNumber.trim())) {
      setFieldError(lang(t.phoneInvalid));
      return false;
    }
    setFieldError(null);
    return true;
  };

  const handleSendOtp = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validatePhone()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sendOtp({ phoneNumber: phoneNumber.trim() });

      toast.success(lang(t.codeSentSuccess));
      setStep("otp");
      setResendCooldown(60);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      const message = extractErrorMessage(err, lang(t.sendOtpFailed));
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // OTP Step
  // ============================================
  const handleOtpChange = (index: number, value: string): void => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    if (fieldError) setFieldError(null);
    if (error) setError(null);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent): void => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || "";
    setOtp(newOtp);
    const next = newOtp.findIndex((d) => !d);
    if (next >= 0) otpInputRefs.current[next]?.focus();
    else otpInputRefs.current[5]?.focus();
  };

  const validateOtp = (): boolean => {
    if (otp.join("").length < 6) {
      setFieldError(lang(t.otpLength));
      return false;
    }
    setFieldError(null);
    return true;
  };

  // ============================================
  // Verify OTP – always show success screen, no early redirect
  // ============================================
  const handleVerifyOtp = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateOtp()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await verifyOtp({
        phoneNumber: phoneNumber.trim(),
        code: otp.join(""),
      });

      // Mark as verified
      setIsVerified(true);

      // Store phone number for reset password page
      sessionStorage.setItem("reset-phone", phoneNumber.trim());

      // Always go to success screen – let the user choose next action
      setStep("success");
    } catch (err) {
      const message = extractErrorMessage(err, lang(t.verifyOtpFailed));
      setError(message);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await sendOtp({ phoneNumber: phoneNumber.trim() });
      toast.success(lang(t.codeSentSuccess));
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      const message = extractErrorMessage(err, lang(t.sendOtpFailed));
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Skip handler – navigate based on auth state
  // ============================================
  const handleSkip = () => {
    // If authenticated, go to dashboard
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // If verified but not authenticated, redirect to login
    toast.success(lang(t.successTitle));
    navigate("/auth/login", {
      replace: true,
      state: {
        message: lang(t.successTitle),
        phoneNumber: phoneNumber.trim(),
        verified: true,
      },
    });
  };

  // ============================================
  // Shared Styles
  // ============================================

  const inputClasses = (hasError: boolean) =>
    cn(
      "w-full py-3 rounded-xl",
      "bg-surface-100 dark:bg-surface-800",
      "text-surface-900 dark:text-surface-100",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "border-2 transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "text-sm",
      "focus:outline-none",
      hasError
        ? "border-error-400 dark:border-error-500 focus:border-error-500 focus:ring-4 focus:ring-error-500/15"
        : "border-transparent focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
    );

  const otpClasses = (idx: number) =>
    cn(
      "w-12 h-14 sm:w-14 sm:h-16 rounded-xl text-center text-xl font-bold",
      "bg-surface-100 dark:bg-surface-800",
      "text-surface-900 dark:text-surface-100",
      "border-2 transition-all duration-200 focus:outline-none",
      fieldError
        ? "border-error-400 dark:border-error-500 focus:border-error-500 focus:ring-4 focus:ring-error-500/15"
        : otp[idx]
          ? "border-primary-500 dark:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
          : "border-transparent focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
    );

  // ============================================
  // Error Alert Component
  // ============================================
  const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
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
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setError(null)}
        className="text-error-400 hover:text-error-500 flex-shrink-0 transition-colors"
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
  );

  // ============================================
  // Success State
  // ============================================
  if (step === "success") {
    const showSkipButton = isAuthenticated || isVerified;

    return (
      <div className="w-full animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-full",
              "bg-emerald-100 dark:bg-emerald-900/30",
              "flex items-center justify-center",
              "animate-scale-in",
            )}
          >
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 dark:text-emerald-400"
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
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">
            {lang(t.successTitle)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {lang(t.successMessage)}
          </p>
        </div>
        <div className="space-y-3">
          <Link
            to="/auth/reset-password"
            state={{
              phoneNumber,
              userId: verifiedUserId,
              isVerified: true,
            }}
            className={cn(
              "block w-full py-3 px-6 rounded-xl text-center text-white font-semibold text-sm",
              "bg-primary-600 hover:bg-primary-700",
              "shadow-lg shadow-primary-600/25",
              "transition-all duration-200 active:scale-[0.98]",
            )}
          >
            {lang(t.resetPassword)}
          </Link>

          {showSkipButton ? (
            <button
              onClick={handleSkip}
              className={cn(
                "block w-full py-3 px-6 rounded-xl text-center font-semibold text-sm",
                "border-2 border-primary-600 dark:border-primary-400",
                "text-primary-600 dark:text-primary-400",
                "hover:bg-primary-50 dark:hover:bg-primary-900/20",
                "transition-all duration-200 active:scale-[0.98]",
              )}
            >
              {lang(t.skip)}
            </button>
          ) : (
            <Link
              to="/auth/login"
              className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline mt-4"
            >
              {lang(t.backToLogin)}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // Phone Form
  // ============================================
  if (step === "phone") {
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

        {error && <ErrorAlert message={error} />}

        <form onSubmit={handleSendOtp} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="forgot-phone"
              className="block text-sm font-medium text-surface-700 dark:text-surface-300"
            >
              {lang(t.phoneNumber)}
            </label>
            <div className="relative">
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                  isAr ? "right-3" : "left-3",
                  fieldError
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
                id="forgot-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={lang(t.phoneNumberPlaceholder)}
                autoComplete="tel"
                dir="ltr"
                disabled={isSubmitting}
                className={cn(
                  inputClasses(!!fieldError),
                  isAr ? "pr-11 pl-4" : "pl-11 pr-4",
                )}
              />
            </div>
            {fieldError && (
              <p
                className={cn(
                  "text-xs text-error-500 dark:text-error-400 mt-1",
                  isAr ? "mr-1" : "ml-1",
                )}
              >
                {fieldError}
              </p>
            )}
            {!fieldError && (
              <p
                className={cn(
                  "text-[11px] text-surface-400 dark:text-surface-500 mt-1",
                  isAr ? "mr-1" : "ml-1",
                )}
              >
                {isAr ? "مثال: 01xxxxxxxxx" : "Format: 01xxxxxxxxx"}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-3 px-6 rounded-xl text-white font-semibold text-sm",
              "bg-primary-600 hover:bg-primary-700",
              "shadow-lg shadow-primary-600/25",
              "transition-all duration-200 disabled:opacity-60 active:scale-[0.98]",
              "flex items-center justify-center gap-2.5",
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
                <span>{lang(t.sendingCode)}</span>
              </>
            ) : (
              <span>{lang(t.sendCode)}</span>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ============================================
  // OTP Form
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
          {lang(t.otpTitle)}
        </h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
          {lang(t.otpSubtitle)}{" "}
          <span
            className="font-semibold text-surface-700 dark:text-surface-300"
            dir="ltr"
          >
            {phoneNumber}
          </span>
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleVerifyOtp} noValidate className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                otpInputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              onFocus={(e) => e.target.select()}
              disabled={isSubmitting}
              className={otpClasses(i)}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        {fieldError && (
          <p className="text-xs text-error-500 dark:text-error-400 text-center">
            {fieldError}
          </p>
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp(["", "", "", "", "", ""]);
              setError(null);
              setFieldError(null);
            }}
            disabled={isSubmitting}
            className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
          >
            {lang(t.changePhone)}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isSubmitting || resendCooldown > 0}
            className={cn(
              "text-sm font-medium transition-colors",
              resendCooldown > 0
                ? "text-surface-400 dark:text-surface-500 cursor-not-allowed"
                : "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
            )}
          >
            {resendCooldown > 0
              ? `${lang(t.resendCode)} (${resendCooldown}${lang(t.seconds)})`
              : lang(t.resendCode)}
          </button>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full py-3 px-6 rounded-xl text-white font-semibold text-sm",
            "bg-primary-600 hover:bg-primary-700",
            "shadow-lg shadow-primary-600/25",
            "transition-all duration-200 disabled:opacity-60 active:scale-[0.98]",
            "flex items-center justify-center gap-2.5",
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
              <span>{lang(t.verifying)}</span>
            </>
          ) : (
            <span>{lang(t.verify)}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;

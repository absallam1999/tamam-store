import { useState, useCallback, useRef, useMemo } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import {
  formatCurrency,
  formatNumber,
  getRelativeTime,
} from "@shared/utils/formatters";
import {
  useWallet,
  useWalletRequests,
  useWithdrawFromWallet,
  usePaymentNumbers,
  type WalletRequestDto,
} from "@shared/hooks/useStoreWallet";
import { useStoreProfile } from "@/shared/hooks/useStoreProfile";
import { apiClient } from "@/lib/api-client";

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "المحفظة", en: "Wallet" },
  subtitle: {
    ar: "إدارة أرباحك والمعاملات المالية",
    en: "Manage your earnings & transactions",
  },
  availableBalance: { ar: "الرصيد المتاح", en: "Available Balance" },
  totalEarnings: { ar: "إجمالي الأرباح", en: "Total Earnings" },
  currency: { ar: "جنيه مصري", en: "EGP" },
  storeAccount: { ar: "حساب المتجر", en: "Store Account" },
  withdraw: { ar: "سحب", en: "Withdraw" },
  deposit: { ar: "إيداع", en: "Deposit" },
  transactionHistory: { ar: "سجل المعاملات", en: "Transaction History" },
  noTransactions: { ar: "لا توجد معاملات", en: "No transactions yet" },
  noTransactionsDesc: {
    ar: "ستظهر معاملاتك المالية هنا",
    en: "Your financial transactions will appear here",
  },
  amount: { ar: "المبلغ", en: "Amount" },
  amountPlaceholder: { ar: "أدخل المبلغ", en: "Enter amount" },
  available: { ar: "المتاح", en: "Available" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  confirmWithdraw: { ar: "تأكيد السحب", en: "Confirm Withdrawal" },
  confirmDeposit: { ar: "تأكيد الإيداع", en: "Confirm Deposit" },
  processing: { ar: "جاري المعالجة...", en: "Processing..." },
  refresh: { ar: "تحديث", en: "Refresh" },
  hideBalance: { ar: "إخفاء الرصيد", en: "Hide Balance" },
  showBalance: { ar: "إظهار الرصيد", en: "Show Balance" },
  loadError: {
    ar: "فشل تحميل بيانات المحفظة",
    en: "Failed to load wallet data",
  },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  withdrawSuccess: {
    ar: "تم تقديم طلب السحب بنجاح",
    en: "Withdrawal request submitted",
  },
  depositSuccess: {
    ar: "تم تقديم طلب الإيداع بنجاح",
    en: "Deposit request submitted",
  },
  withdrawError: { ar: "فشل طلب السحب", en: "Withdrawal request failed" },
  depositError: { ar: "فشل طلب الإيداع", en: "Deposit request failed" },
  insufficientBalance: {
    ar: "المبلغ يتجاوز الرصيد المتاح",
    en: "Amount exceeds available balance",
  },
  minAmount: {
    ar: "المبلغ يجب أن يكون أكبر من صفر",
    en: "Amount must be greater than zero",
  },
  credit: { ar: "إيداع", en: "Credit" },
  debit: { ar: "خصم", en: "Debit" },
  withdrawal: { ar: "سحب", en: "Withdrawal" },
  orderPayment: { ar: "دفع طلب", en: "Order Payment" },
  depositType: { ar: "إيداع", en: "Deposit" },
  transaction: { ar: "معاملة", en: "Transaction" },
  totalTransactions: { ar: "إجمالي المعاملات", en: "Total Transactions" },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  pendingWithdrawals: { ar: "طلبات سحب معلقة", en: "Pending Withdrawals" },
  phoneFrom: { ar: "رقم الهاتف المحول منة", en: "Sender Phone Number" },
  phoneFromPlaceholder: {
    ar: "مثال: 01012345678",
    en: "e.g. 01012345678",
  },
  instapayAccountPlaceholder: {
    ar: "مثال: user@instapay",
    en: "e.g. user@instapay",
  },
  paymentMethod: { ar: "طريقة الدفع", en: "Payment Method" },
  paymentMethodPlaceholder: {
    ar: "اختر طريقة الدفع",
    en: "Select payment method",
  },
  mobileWallet: { ar: "محفظة جوال", en: "Mobile Wallet" },
  instapay: { ar: "InstaPay", en: "InstaPay" },
  screenshot: { ar: "لقطة شاشة للتحويل", en: "Transfer Screenshot" },
  uploadScreenshot: { ar: "رفع لقطة الشاشة", en: "Upload Screenshot" },
  changeScreenshot: { ar: "تغيير الصورة", en: "Change Image" },
  screenshotRequired: {
    ar: "لقطة الشاشة مطلوبة",
    en: "Screenshot is required",
  },
  selectPaymentMethod: {
    ar: "يرجى اختيار طريقة الدفع",
    en: "Please select a payment method",
  },
  enterSenderInfo: {
    ar: "أدخل معلومات المرسل",
    en: "Enter sender information",
  },
  invalidPhone: {
    ar: "يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 010, 011, 012, 015)",
    en: "Please enter a valid Egyptian phone number (11 digits starting with 010, 011, 012, 015)",
  },
  invalidInstapay: {
    ar: "يرجى إدخال حساب InstaPay صحيح (مثال: user@instapay)",
    en: "Please enter a valid Instapay account (e.g. user@instapay)",
  },
  requiredPhone: {
    ar: "يرجى إدخال رقم الهاتف",
    en: "Please enter a phone number",
  },
} as const;

// ============================================
// Helpers
// ============================================

const getTransactionLabel = (
  type: string,
  lang: (obj: { ar: string; en: string }) => string,
): string => {
  const lower = type?.toLowerCase() || "";
  if (lower.includes("credit") || lower.includes("deposit"))
    return lang(t.credit);
  if (lower.includes("withdraw")) return lang(t.withdrawal);
  if (lower.includes("order") || lower.includes("payment"))
    return lang(t.orderPayment);
  return lang(t.debit);
};

const isCreditTransaction = (type: string): boolean => {
  const lower = type?.toLowerCase() || "";
  return (
    lower.includes("credit") ||
    lower.includes("deposit") ||
    lower.includes("order")
  );
};

// Egyptian phone number validation
const isValidEgyptianPhone = (phone: string): boolean => {
  // Remove any non-digit characters
  const clean = phone.replace(/\D/g, "");
  // Check if it's exactly 11 digits and starts with 010, 011, 012, or 015
  return /^(010|011|012|015)\d{8}$/.test(clean);
};

// Instapay account validation
const isValidInstapay = (account: string): boolean => {
  // Should contain @ and at least 3 characters before and after
  const trimmed = account.trim();
  if (!trimmed.includes("@")) return false;
  const parts = trimmed.split("@");
  return parts.length === 2 && parts[0].length >= 3 && parts[1].length >= 3;
};

// ============================================
// WalletPage — Main Component
// ============================================

export const WalletPage: React.FC = () => {
  // ============================================
  // ALL HOOKS - MUST BE CALLED UNCONDITIONALLY
  // ============================================
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  // Data fetching hooks
  const { data: wallet, isLoading, isError, error, refetch } = useWallet();
  const { data: paymentNumbers = [] } = usePaymentNumbers();
  const { data: walletRequests = [] } = useWalletRequests();
  const withdrawMutation = useWithdrawFromWallet();
  const { data: profile } = useStoreProfile();

  // State hooks
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [phoneFrom, setPhoneFrom] = useState(profile?.phoneNumber || "");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "mobile_wallet" | "instapay" | ""
  >("");
  const [senderInfo, setSenderInfo] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived values
  const balance = wallet?.balance ?? 0;
  const currency = wallet?.currency ?? "EGP";
  const totalEarnings = wallet?.totalEarnings ?? balance;
  const storePhone = profile?.phoneNumber;
  const pendingWithdrawals = wallet?.pendingWithdrawals ?? [];

  // Validate sender info based on payment method
  const validateSenderInfo = useCallback((value: string, method: typeof selectedPaymentMethod): boolean => {
    if (!value.trim()) {
      toast.error(lang(t.requiredPhone));
      return false;
    }

    if (method === "mobile_wallet") {
      if (!isValidEgyptianPhone(value)) {
        toast.error(lang(t.invalidPhone));
        return false;
      }
    } else if (method === "instapay") {
      if (!isValidInstapay(value)) {
        toast.error(lang(t.invalidInstapay));
        return false;
      }
    }
    return true;
  }, [toast, lang]);

  // useMemo and useCallback hooks
  const formatHidden = useCallback(
    (val: number) => (hideBalance ? "••••••" : formatCurrency(val)),
    [hideBalance],
  );

  const transactions = useMemo(() => {
    const walletTxs = (wallet?.transactions ?? []).map((tx: any) => ({
      id: tx.id,
      type: tx.type || "Unknown",
      amount: tx.amount,
      description: tx.description || getTransactionLabel(tx.type, lang),
      status: tx.status,
      createdAt: tx.createdAt,
      source: "wallet",
      paymentMethod: undefined as string | undefined,
    }));

    const requestTxs = walletRequests.map((req: WalletRequestDto) => ({
      id: req.id,
      type: "Deposit",
      amount: req.amount,
      description: isAr
        ? `طلب إيداع${req.paymentMethod ? ` - ${req.paymentMethod}` : ""}`
        : `Deposit Request${req.paymentMethod ? ` - ${req.paymentMethod}` : ""}`,
      status: req.status,
      createdAt: req.createdAt,
      source: "requests",
      paymentMethod: req.paymentMethod,
    }));

    return [...walletTxs, ...requestTxs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [wallet?.transactions, walletRequests, isAr, lang]);

  const handleWithdraw = useCallback(() => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error(lang(t.minAmount));
      return;
    }
    if (wallet && amount > wallet.balance) {
      toast.error(lang(t.insufficientBalance));
      return;
    }
    withdrawMutation.mutate(
      { amount },
      {
        onSuccess: () => {
          toast.success(lang(t.withdrawSuccess));
          setShowWithdrawModal(false);
          setWithdrawAmount("");
        },
        onError: (err: any) => {
          toast.error(err?.message || lang(t.withdrawError));
        },
      },
    );
  }, [withdrawAmount, wallet, withdrawMutation, toast, lang]);

  const handleDeposit = useCallback(async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      toast.error(lang(t.minAmount));
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error(lang(t.selectPaymentMethod));
      return;
    }

    if (!senderInfo.trim()) {
      toast.error(
        isAr
          ? "يرجى إدخال معلومات المرسل"
          : "Please enter sender information",
      );
      return;
    }

    // Validate sender info based on payment method
    if (selectedPaymentMethod === "mobile_wallet") {
      if (!isValidEgyptianPhone(senderInfo)) {
        toast.error(lang(t.invalidPhone));
        return;
      }
    } else if (selectedPaymentMethod === "instapay") {
      if (!isValidInstapay(senderInfo)) {
        toast.error(lang(t.invalidInstapay));
        return;
      }
    }

    setIsDepositing(true);
    try {
      const formData = new FormData();
      // Always send the phone number (senderInfo) to the API
      formData.append("phoneFrom", senderInfo.trim());
      formData.append(
        "paymentMethod",
        selectedPaymentMethod === "mobile_wallet"
          ? "Mobile Wallet"
          : "InstaPay",
      );
      formData.append("amount", String(amount));
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const response: any = await apiClient.post(
        "/api/wallet/topup/with-screenshot",
        formData,
      );

      const responseData = response?.data || response;
      if (responseData?.success === false || responseData?.Success === false) {
        throw new Error(
          responseData?.message ||
            responseData?.Message ||
            lang(t.depositError),
        );
      }

      toast.success(lang(t.depositSuccess));
      setShowDepositModal(false);
      setDepositAmount("");
      setSenderInfo("");
      setSelectedPaymentMethod("");
      setScreenshot(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || lang(t.depositError));
    } finally {
      setIsDepositing(false);
    }
  }, [
    depositAmount,
    senderInfo,
    selectedPaymentMethod,
    screenshot,
    toast,
    lang,
    refetch,
    isAr,
  ]);

  // Reset sender info when payment method changes
  const handlePaymentMethodChange = useCallback(
    (method: "mobile_wallet" | "instapay") => {
      setSelectedPaymentMethod(method);
      // Clear sender info when switching methods
      setSenderInfo("");
    },
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-32 rounded-lg mb-2" />
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 space-y-4">
          <div className="skeleton h-4 w-24 rounded-lg" />
          <div className="skeleton h-12 w-48 rounded-lg" />
          <div className="skeleton h-4 w-32 rounded-lg" />
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-32 rounded-lg" />
                <div className="skeleton h-3 w-20 rounded-lg" />
              </div>
              <div className="skeleton h-5 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-error-100 dark:bg-error-500/10 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-error-500"
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
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
          {lang(t.loadError)}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          {(error as any)?.message || ""}
        </p>
        <button onClick={() => refetch()} className="btn btn-primary btn-sm">
          {lang(t.retry)}
        </button>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-12",
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
        <button onClick={() => refetch()} className="btn btn-ghost btn-sm">
          <svg
            className={cn("w-4 h-4")}
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
          {lang(t.refresh)}
        </button>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-surface-950 p-8 shadow-xl shadow-primary-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {lang(t.storeAccount)}
                </p>
                <p
                  className="text-xs text-white/60 font-mono tracking-wider"
                  dir="ltr"
                >
                  {storePhone || "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70"
            >
              {hideBalance ? (
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
          <div className="mb-6">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              {lang(t.availableBalance)}
            </p>
            <p className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums font-mono">
              {formatHidden(balance)}
            </p>
            <p className="text-sm font-medium text-white/50 mt-1">{currency}</p>
          </div>
          <div className="border-t-2 border-dashed border-white/10 my-6" />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setWithdrawAmount("");
                setShowWithdrawModal(true);
              }}
              // disabled={balance <= 0}
              className={cn(
                "flex-1 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-primary-700 hover:bg-white/90 active:scale-[0.98] shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              {lang(t.withdraw)}
            </button>
            <button
              onClick={() => {
                setDepositAmount("");
                setSenderInfo("");
                setSelectedPaymentMethod("");
                setScreenshot(null);
                setShowDepositModal(true);
              }}
              className={cn(
                "flex-1 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-white/20 text-white hover:bg-white/30 active:scale-[0.98] border border-white/20 flex items-center justify-center gap-2",
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              {lang(t.deposit)}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            {isAr ? formatNumber(transactions.length) : transactions.length}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.totalTransactions)}
          </p>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">
            {formatCurrency(totalEarnings)}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.totalEarnings)}
          </p>
        </div>
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="bg-warning-50 dark:bg-warning-500/5 rounded-2xl border border-warning-200 dark:border-warning-500/10 p-4">
          <p className="text-sm font-semibold text-warning-700 dark:text-warning-400">
            {lang(t.pendingWithdrawals)}: {pendingWithdrawals.length}
          </p>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-surface-100 dark:border-surface-800">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">
            {lang(t.transactionHistory)}
          </h3>
        </div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-surface-300 dark:text-surface-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {lang(t.noTransactions)}
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
              {lang(t.noTransactionsDesc)}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {transactions.map((tx) => {
              const isCredit = isCreditTransaction(tx.type);
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isCredit
                        ? "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400"
                        : "bg-error-100 dark:bg-error-500/10 text-error-600 dark:text-error-400",
                    )}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      {isCredit ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                      {tx.description || getTransactionLabel(tx.type, lang)}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {getRelativeTime(tx.createdAt)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-bold tabular-nums flex-shrink-0",
                      isCredit
                        ? "text-success-600 dark:text-success-400"
                        : "text-error-600 dark:text-error-400",
                    )}
                  >
                    {isCredit ? "+" : "-"}
                    {formatCurrency(Math.abs(tx.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={(e) =>
            e.target === e.currentTarget && setShowWithdrawModal(false)
          }
        >
          <div
            className={cn(
              "w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-scale mb-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl shadow-black/10 dark:shadow-black/30",
            )}
            dir={isAr ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "px-6 py-5 border-b border-surface-200 dark:border-surface-800 flex items-center sticky top-0 bg-white dark:bg-surface-900 z-10",
              )}
              style={{ flexDirection: isAr ? "row-reverse" : "row" }}
            >
              <button
                onClick={() => setShowWithdrawModal(false)}
                className={cn(
                  "p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors",
                  isAr ? "order-1" : "order-1",
                )}
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
              <div className={cn("flex-1", isAr && "text-right order-2")}>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                  {lang(t.withdraw)}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  {isAr
                    ? "أدخل المبلغ الذي تريد سحبه"
                    : "Enter the amount you want to withdraw"}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div
                className={cn(
                  "p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700",
                  isAr && "text-right",
                )}
              >
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {lang(t.available)}
                </p>
                <p
                  className="text-xl font-bold text-surface-900 dark:text-white mt-1 font-mono tabular-nums"
                  dir="ltr"
                >
                  {formatCurrency(balance)}
                </p>
              </div>

              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.amount)}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="1"
                    max={balance}
                    className={cn(
                      "w-full rounded-xl py-3 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-transparent focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all text-sm font-medium",
                      isAr ? "pr-4 pl-12 text-right" : "pl-4 pr-12 text-left",
                    )}
                    placeholder={lang(t.amountPlaceholder)}
                    autoFocus
                  />
                  <span
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-xs font-medium text-surface-400 dark:text-surface-500",
                      isAr ? "left-4" : "right-4",
                    )}
                  >
                    EGP
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "flex gap-2 flex-wrap",
                  isAr ? "justify-end flex-row-reverse" : "justify-start",
                )}
              >
                {[1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() =>
                      setWithdrawAmount(String(Math.min(amt, balance)))
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-white border border-surface-200 dark:border-surface-700",
                      Number(withdrawAmount) === amt &&
                        "border-primary-400 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/30",
                    )}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {Number(withdrawAmount) >= balance && balance > 0 && (
                <div
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20",
                    isAr && "flex-row-reverse",
                  )}
                >
                  <div
                    className={cn("flex-shrink-0 mt-0.5", isAr && "order-2")}
                  >
                    <svg
                      className="w-5 h-5 text-warning-500"
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
                  <p
                    className={cn(
                      "text-xs text-warning-700 dark:text-warning-400 flex-1",
                      isAr && "text-right order-1",
                    )}
                  >
                    {isAr
                      ? "سيتم سحب كامل الرصيد المتاح"
                      : "This will withdraw your entire available balance"}
                  </p>
                </div>
              )}

              <div
                className={cn("flex gap-3 pt-2", isAr && "flex-row-reverse")}
              >
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawMutation.isPending}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {lang(t.cancel)}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={
                    withdrawMutation.isPending ||
                    !withdrawAmount ||
                    Number(withdrawAmount) <= 0
                  }
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2",
                    isAr && "flex-row-reverse",
                  )}
                >
                  {withdrawMutation.isPending ? (
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
                      <span>{lang(t.processing)}</span>
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
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <span>{lang(t.confirmWithdraw)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
       {showDepositModal && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={(e) =>
            e.target === e.currentTarget && setShowDepositModal(false)
          }
        >
          <div
            className={cn(
              "w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-scale mb-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl shadow-black/10 dark:shadow-black/30",
            )}
            dir={isAr ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "px-6 py-5 border-b border-surface-200 dark:border-surface-800 flex items-center sticky top-0 bg-white dark:bg-surface-900 z-10",
              )}
              style={{ flexDirection: isAr ? "row-reverse" : "row" }}
            >
              <button
                onClick={() => setShowDepositModal(false)}
                className={cn(
                  "p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors",
                  isAr ? "order-1" : "order-1",
                )}
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
              <div className={cn("flex-1", isAr && "text-right order-2")}>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                  {lang(t.deposit)}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  {isAr
                    ? "أدخل بيانات الإيداع الخاصة بك"
                    : "Enter your deposit details"}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.amount)}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="1"
                    className={cn(
                      "w-full rounded-xl py-3 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-transparent focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all text-sm font-medium",
                      isAr ? "pr-4 pl-12 text-right" : "pl-4 pr-12 text-left",
                    )}
                    placeholder={lang(t.amountPlaceholder)}
                  />
                  <span
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-xs font-medium text-surface-400 dark:text-surface-500",
                      isAr ? "left-4" : "right-4",
                    )}
                  >
                    EGP
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "flex gap-2 flex-wrap",
                  isAr ? "justify-end flex-row-reverse" : "justify-start",
                )}
              >
                {[200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(String(amt))}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-white border border-surface-200 dark:border-surface-700",
                      Number(depositAmount) === amt &&
                        "border-primary-400 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/30",
                    )}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* Payment Method Selection */}
              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.paymentMethod)}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange("mobile_wallet")}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                      selectedPaymentMethod === "mobile_wallet"
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                        : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:border-primary-300",
                    )}
                  >
                    <svg
                      className={cn(
                        "w-6 h-6",
                        selectedPaymentMethod === "mobile_wallet"
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-surface-500 dark:text-surface-400",
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 0V3h3V1.5m-3 0h3"
                      />
                    </svg>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selectedPaymentMethod === "mobile_wallet"
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-surface-700 dark:text-surface-300",
                      )}
                    >
                      {lang(t.mobileWallet)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange("instapay")}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                      selectedPaymentMethod === "instapay"
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                        : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:border-primary-300",
                    )}
                  >
                    <svg
                      className={cn(
                        "w-6 h-6",
                        selectedPaymentMethod === "instapay"
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-surface-500 dark:text-surface-400",
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        rx="5.5"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle
                        cx="13.5"
                        cy="7.5"
                        r="1.75"
                        fill="currentColor"
                      />
                      <path
                        d="M13.5 11.5l-2 5.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selectedPaymentMethod === "instapay"
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-surface-700 dark:text-surface-300",
                      )}
                    >
                      {lang(t.instapay)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Sender Information */}
              {selectedPaymentMethod && (
                <div className={cn("space-y-1.5", isAr && "text-right")}>
                  <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                    {selectedPaymentMethod === "mobile_wallet"
                      ? lang(t.phoneFrom)
                      : "InstaPay " + lang(t.phoneFrom)}
                  </label>
                  <input
                    type="text"
                    value={senderInfo}
                    onChange={(e) => setSenderInfo(e.target.value)}
                    className={cn(
                      "w-full rounded-xl py-3 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-transparent focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all text-sm font-medium",
                      isAr ? "text-right" : "text-left",
                    )}
                    placeholder={
                      selectedPaymentMethod === "mobile_wallet"
                        ? lang(t.phoneFromPlaceholder)
                        : lang(t.instapayAccountPlaceholder)
                    }
                    dir="ltr"
                  />
                </div>
              )}

              {/* Payment Numbers */}
              {selectedPaymentMethod && paymentNumbers.length > 0 && (
                <div className={cn("space-y-1.5", isAr && "text-right")}>
                  <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                    {isAr
                      ? "أرقام التحويل المتاحة"
                      : "Available Transfer Numbers"}
                  </label>
                  <div className="space-y-2">
                    {paymentNumbers.map((pn) => (
                      <button
                        key={pn.id}
                        type="button"
                        onClick={() => {
                          setSenderInfo(pn.phoneNumber);
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all duration-200",
                          "bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700",
                          "hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-500/5",
                          senderInfo === pn.phoneNumber &&
                            "border-primary-400 bg-primary-50 dark:bg-primary-500/10",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className="text-sm font-semibold text-surface-900 dark:text-white"
                              dir="ltr"
                            >
                              {pn.phoneNumber}
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                              {pn.paymentMethod || pn.label}
                            </p>
                          </div>
                          {senderInfo === pn.phoneNumber && (
                            <svg
                              className="w-5 h-5 text-primary-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
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
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Screenshot Upload */}
              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.screenshot)}{" "}
                  <span className="font-normal text-surface-400">
                    ({isAr ? "اختياري" : "Optional"})
                  </span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setScreenshot(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full py-5 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2.5 hover:border-primary-400/50 hover:bg-primary-50/30 dark:hover:bg-primary-500/5 active:scale-[0.99]",
                    screenshot
                      ? "border-success-400 bg-success-50/50 dark:bg-success-500/10"
                      : "border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50",
                  )}
                >
                  {screenshot ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-success-600 dark:text-success-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-success-700 dark:text-success-400 truncate max-w-[200px]">
                        {screenshot.name}
                      </span>
                      <span className="text-xs text-success-500 dark:text-success-400/70">
                        {lang(t.changeScreenshot)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-surface-400 dark:text-surface-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                          {lang(t.uploadScreenshot)}
                        </p>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                          {isAr
                            ? "اختياري - PNG, JPG حتى 5MB"
                            : "Optional - PNG, JPG up to 5MB"}
                        </p>
                      </div>
                    </>
                  )}
                </button>
              </div>

              {/* Info Message */}
              <div
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20",
                  isAr && "flex-row-reverse",
                )}
              >
                <div className={cn("flex-shrink-0 mt-0.5", isAr && "order-2")}>
                  <svg
                    className="w-5 h-5 text-info-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <p
                  className={cn(
                    "text-xs text-info-700 dark:text-info-400 flex-1",
                    isAr && "text-right order-1",
                  )}
                >
                  {isAr
                    ? "سيتم مراجعة طلب الإيداع الخاص بك وسيتم إضافة الرصيد بعد التأكيد"
                    : "Your deposit request will be reviewed and the balance will be added after confirmation"}
                </p>
              </div>

              {/* Actions */}
              <div
                className={cn("flex gap-3 pt-2", isAr && "flex-row-reverse")}
              >
                <button
                  onClick={() => setShowDepositModal(false)}
                  disabled={isDepositing}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {lang(t.cancel)}
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={
                    isDepositing ||
                    !depositAmount ||
                    Number(depositAmount) <= 0 ||
                    !selectedPaymentMethod ||
                    !senderInfo.trim() ||
                    (selectedPaymentMethod === "mobile_wallet" && !isValidEgyptianPhone(senderInfo)) ||
                    (selectedPaymentMethod === "instapay" && !isValidInstapay(senderInfo))
                  }
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2",
                    isAr && "flex-row-reverse",
                  )}
                >
                  {isDepositing ? (
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
                      <span>{lang(t.processing)}</span>
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
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <span>{lang(t.confirmDeposit)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
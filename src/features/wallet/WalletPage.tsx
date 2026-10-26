import { useState, useCallback, useMemo } from "react";
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
  useWithdrawals,
  useRequestWithdrawal,
  useWalletTransactions,
  useCancelWithdrawal,
  usePaymentNumbers,
  useSubmitTopUp,
} from "@shared/hooks/useStoreWallet";
import { useStoreProfile } from "@/shared/hooks/useStoreProfile";
import type { WalletTransactionDto, WithdrawalDto } from "@shared/types";

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
  totalIn: { ar: "إجمالي الإيداعات", en: "Total Received" },
  totalOut: { ar: "إجمالي المسحوبات", en: "Total Withdrawn" },
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
  minimum: { ar: "الحد الأدنى", en: "Minimum" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  confirmWithdraw: { ar: "تأكيد السحب", en: "Confirm Withdrawal" },
  processing: { ar: "جاري المعالجة...", en: "Processing..." },
  refresh: { ar: "تحديث", en: "Refresh" },
  loadError: {
    ar: "فشل تحميل بيانات المحفظة",
    en: "Failed to load wallet data",
  },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  withdrawSuccess: {
    ar: "تم تقديم طلب السحب بنجاح",
    en: "Withdrawal request submitted",
  },
  withdrawError: { ar: "فشل طلب السحب", en: "Withdrawal request failed" },
  insufficientBalance: {
    ar: "المبلغ يتجاوز الرصيد المتاح",
    en: "Amount exceeds available balance",
  },
  minAmount: {
    ar: "المبلغ يجب أن يكون أكبر من صفر",
    en: "Amount must be greater than zero",
  },
  belowMinimum: {
    ar: "المبلغ أقل من الحد الأدنى للسحب",
    en: "Amount is below the minimum withdrawal",
  },
  credit: { ar: "إيداع", en: "Credit" },
  debit: { ar: "خصم", en: "Debit" },
  withdrawal: { ar: "سحب", en: "Withdrawal" },
  orderPayment: { ar: "دفع طلب", en: "Order Payment" },
  transaction: { ar: "معاملة", en: "Transaction" },
  totalTransactions: { ar: "إجمالي المعاملات", en: "Total Transactions" },
  pendingWithdrawals: { ar: "طلبات سحب معلقة", en: "Pending Withdrawals" },
  cancelRequest: { ar: "إلغاء الطلب", en: "Cancel" },
  cancelConfirm: {
    ar: "هل تريد إلغاء طلب السحب؟",
    en: "Cancel this withdrawal request?",
  },
  cancelSuccess: { ar: "تم إلغاء الطلب", en: "Request cancelled" },
  cancelError: { ar: "فشل إلغاء الطلب", en: "Failed to cancel request" },
  cannotWithdraw: {
    ar: "لا يمكن السحب حالياً",
    en: "Cannot withdraw right now",
  },
  depositSubtitle: {
    ar: "أضف رصيد إلى محفظتك",
    en: "Add money to your wallet",
  },
  selectPaymentMethod: { ar: "طريقة الدفع", en: "Payment method" },
  noPaymentNumbers: {
    ar: "لا توجد طرق دفع متاحة حالياً",
    en: "No payment methods available",
  },
  phoneFrom: { ar: "رقم هاتفك (المرسل)", en: "Your phone (sender)" },
  phoneFromPlaceholder: { ar: "مثال: 01012345678", en: "e.g. 01012345678" },
  phoneFromRequired: {
    ar: "يرجى إدخال رقم هاتفك",
    en: "Please enter your phone number",
  },
  phoneFromInvalid: {
    ar: "رقم الهاتف غير صحيح",
    en: "Invalid phone number",
  },
  notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)" },
  notesPlaceholder: { ar: "أي تفاصيل إضافية", en: "Any extra details" },
  confirmDeposit: { ar: "تأكيد الإيداع", en: "Confirm Deposit" },
  depositSuccess: {
    ar: "تم تقديم طلب الإيداع بنجاح",
    en: "Top-up request submitted",
  },
  depositError: { ar: "فشل طلب الإيداع", en: "Failed to submit top-up" },
  copy: { ar: "نسخ", en: "Copy" },
  copied: { ar: "تم النسخ", en: "Copied" },
  error: { ar: "حدث خطأ", en: "An error occurred" },
} as const;

// ============================================
// Helpers
// ============================================

const getTransactionLabel = (
  type: string | undefined,
  lang: (obj: { ar: string; en: string }) => string,
): string => {
  const lower = (type ?? "").toLowerCase();
  if (lower.includes("credit") || lower.includes("deposit"))
    return lang(t.credit);
  if (lower.includes("withdraw")) return lang(t.withdrawal);
  if (lower.includes("order") || lower.includes("payment"))
    return lang(t.orderPayment);
  return lang(t.debit);
};

const isCreditTransaction = (tx: WalletTransactionDto): boolean => {
  if (typeof tx.amount === "number" && tx.amount !== 0) return tx.amount > 0;
  const lower = (tx.type ?? "").toLowerCase();
  return !lower.match(/debit|withdraw|payment|out|charge/);
};

// Egyptian mobile: 11 digits starting with 01
const isValidPhone = (phone: string): boolean => /^01\d{9}$/.test(phone);

// ============================================
// WalletPage — Main Component
// ============================================

export const WalletPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  // ── Data ────────────────────────────────────────────────────
  const { data: wallet, isLoading, isError, error, refetch } = useWallet();
  const { data: transactionsPage, isLoading: txsLoading } =
    useWalletTransactions({ pageSize: 100 });
  const { data: paymentNumbers = [], isLoading: paymentNumbersLoading } =
    usePaymentNumbers();
  const { data: withdrawalsPage } = useWithdrawals({ pageSize: 100 });
  const requestWithdrawal = useRequestWithdrawal();
  const cancelWithdrawal = useCancelWithdrawal();
  const submitTopUp = useSubmitTopUp();
  const { data: profile } = useStoreProfile();

  // ── State ───────────────────────────────────────────────────
  const [hideBalance, setHideBalance] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhoneFrom, setDepositPhoneFrom] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [selectedPaymentNumberId, setSelectedPaymentNumberId] =
    useState<string>("");

  // ── Derived ─────────────────────────────────────────────────
  const balance = wallet?.balance ?? 0;
  const currency = wallet?.currency ?? "EGP";
  const totalIn = wallet?.totalIn ?? 0;
  const totalOut = wallet?.totalOut ?? 0;
  const minWithdrawal = wallet?.minimumWithdrawalAmount ?? 0;
  const canWithdraw = wallet?.canRequestWithdrawal ?? true;
  const pendingCount = wallet?.pendingWithdrawalCount ?? 0;
  const pendingAmount = wallet?.pendingWithdrawalAmount ?? 0;
  const storePhone = profile?.phoneNumber;

  const transactions = transactionsPage?.items ?? [];
  const totalTxCount = transactionsPage?.totalCount ?? transactions.length;

  const pendingWithdrawals = useMemo<WithdrawalDto[]>(() => {
    const items = withdrawalsPage?.items ?? [];
    return items.filter((w) => (w.status ?? "").toLowerCase() === "pending");
  }, [withdrawalsPage]);

  const activePaymentNumbers = useMemo(
    () => paymentNumbers.filter((pn) => pn.isActive),
    [paymentNumbers],
  );

  const selectedPaymentNumber = useMemo(
    () => paymentNumbers.find((pn) => pn.id === selectedPaymentNumberId),
    [paymentNumbers, selectedPaymentNumberId],
  );

  const quickAmounts = useMemo(() => {
    if (balance <= 0) return [] as number[];
    const candidates = new Set<number>();
    if (minWithdrawal > 0 && minWithdrawal <= balance) {
      candidates.add(minWithdrawal);
    }
    [1000, 5000, 10000].forEach((v) => {
      if (v <= balance) candidates.add(v);
    });
    return Array.from(candidates)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [balance, minWithdrawal]);

  // ── Handlers ────────────────────────────────────────────────
  const formatHidden = useCallback(
    (val: number) => (hideBalance ? "••••••" : formatCurrency(val)),
    [hideBalance],
  );

  const openWithdrawModal = useCallback(() => {
    if (!canWithdraw) {
      toast.error(lang(t.cannotWithdraw));
      return;
    }
    setWithdrawAmount("");
    setShowWithdrawModal(true);
  }, [canWithdraw, toast, lang]);

  const handleWithdraw = useCallback(() => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error(lang(t.minAmount));
      return;
    }
    if (minWithdrawal > 0 && amount < minWithdrawal) {
      toast.error(lang(t.belowMinimum));
      return;
    }
    if (amount > balance) {
      toast.error(lang(t.insufficientBalance));
      return;
    }
    requestWithdrawal.mutate(
      { amount },
      {
        onSuccess: () => {
          toast.success(lang(t.withdrawSuccess));
          setShowWithdrawModal(false);
          setWithdrawAmount("");
        },
        onError: (err) => {
          toast.error(err?.message || lang(t.withdrawError));
        },
      },
    );
  }, [withdrawAmount, minWithdrawal, balance, requestWithdrawal, toast, lang]);

  const handleCancelWithdrawal = useCallback(
    (id: string) => {
      if (!window.confirm(lang(t.cancelConfirm))) return;
      cancelWithdrawal.mutate(id, {
        onSuccess: () => toast.success(lang(t.cancelSuccess)),
        onError: (err) => toast.error(err?.message || lang(t.cancelError)),
      });
    },
    [cancelWithdrawal, toast, lang],
  );

  const openDepositModal = useCallback(() => {
    setDepositAmount("");
    setDepositPhoneFrom("");
    setDepositNotes("");
    setSelectedPaymentNumberId(activePaymentNumbers[0]?.id ?? "");
    setShowDepositModal(true);
  }, [activePaymentNumbers]);

  const handleDeposit = useCallback(() => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      toast.error(lang(t.minAmount));
      return;
    }
    if (!selectedPaymentNumberId || !selectedPaymentNumber) {
      toast.error(lang(t.selectPaymentMethod));
      return;
    }
    const phone = depositPhoneFrom.trim();
    if (!phone) {
      toast.error(lang(t.phoneFromRequired));
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error(lang(t.phoneFromInvalid));
      return;
    }
    submitTopUp.mutate(
      {
        amount,
        paymentNumberId: selectedPaymentNumberId,
        phoneFrom: phone,
        paymentMethod: selectedPaymentNumber.paymentMethod,
        notes: depositNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(lang(t.depositSuccess));
          setShowDepositModal(false);
        },
        onError: (err) => toast.error(err?.message || lang(t.depositError)),
      },
    );
  }, [
    depositAmount,
    depositPhoneFrom,
    depositNotes,
    selectedPaymentNumberId,
    selectedPaymentNumber,
    submitTopUp,
    toast,
    lang,
  ]);

  // ── Loading ─────────────────────────────────────────────────
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
            className="w-4 h-4"
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
              onClick={openWithdrawModal}
              disabled={balance <= 0 || !canWithdraw}
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 3v13.5m0 0-4.5-4.5M12 16.5l4.5-4.5"
                />
              </svg>

              {lang(t.withdraw)}
            </button>
            <button
              onClick={openDepositModal}
              title={lang(t.deposit)}
              className={cn(
                "flex-1 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-white/20 text-white border border-white/20 flex items-center justify-center gap-2 hover:bg-white/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
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
            {isAr ? formatNumber(totalTxCount) : totalTxCount}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.totalTransactions)}
          </p>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">
            {formatCurrency(totalIn)}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.totalEarnings)}
          </p>
          {totalOut > 0 && (
            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">
              {lang(t.totalOut)}: {formatCurrency(totalOut)}
            </p>
          )}
        </div>
      </div>

      {/* Pending Withdrawals */}
      {(pendingCount > 0 || pendingWithdrawals.length > 0) && (
        <div className="bg-warning-50 dark:bg-warning-500/5 rounded-2xl border border-warning-200 dark:border-warning-500/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-warning-700 dark:text-warning-400">
              {lang(t.pendingWithdrawals)}
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-200/60 dark:bg-warning-500/20 text-warning-800 dark:text-warning-300">
                  {pendingCount}
                </span>
              )}
            </p>
            {pendingAmount > 0 && (
              <p className="text-xs font-semibold text-warning-700 dark:text-warning-400 tabular-nums">
                {formatCurrency(pendingAmount)}
              </p>
            )}
          </div>
          {pendingWithdrawals.length > 0 && (
            <div className="space-y-2">
              {pendingWithdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-surface-900 border border-warning-200 dark:border-warning-500/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-surface-900 dark:text-white tabular-nums">
                      {formatCurrency(w.amount)}
                    </p>
                    <p className="text-[10px] text-surface-500 dark:text-surface-400">
                      {getRelativeTime(w.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelWithdrawal(w.id)}
                    disabled={cancelWithdrawal.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 border border-error-200 dark:border-error-500/20 hover:bg-error-100 dark:hover:bg-error-500/20 disabled:opacity-50 transition-colors"
                  >
                    {lang(t.cancelRequest)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-surface-100 dark:border-surface-800">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">
            {lang(t.transactionHistory)}
          </h3>
        </div>
        {txsLoading ? (
          <div className="p-6 space-y-3">
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
        ) : transactions.length === 0 ? (
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
              const isCredit = isCreditTransaction(tx);
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
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 7.5m0 0L7.5 12m4.5-4.5V21"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                      {tx.description || getTransactionLabel(tx.type, lang)}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {getRelativeTime(tx.createdAt)}
                      {tx.orderNumber && ` · #${tx.orderNumber}`}
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
            {/* Header — already correct */}
            <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800 flex flex-row-reverse items-center sticky top-0 bg-white dark:bg-surface-900 z-10">
              <button
                onClick={() => setShowWithdrawModal(false)}
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
              <div className={cn("flex-1", isAr && "text-right")}>
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
                  "grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700",
                  isAr && "text-right",
                )}
              >
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {lang(t.available)}
                  </p>
                  <p
                    className="text-lg font-bold text-surface-900 dark:text-white mt-0.5 font-mono tabular-nums"
                    dir="ltr"
                  >
                    {formatCurrency(balance)}
                  </p>
                </div>
                {minWithdrawal > 0 && (
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {lang(t.minimum)}
                    </p>
                    <p
                      className="text-lg font-bold text-surface-900 dark:text-white mt-0.5 font-mono tabular-nums"
                      dir="ltr"
                    >
                      {formatCurrency(minWithdrawal)}
                    </p>
                  </div>
                )}
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
                    min={minWithdrawal || 1}
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

              {quickAmounts.length > 0 && (
                <div className="flex gap-2 flex-wrap justify-start">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setWithdrawAmount(String(amt))}
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
              )}

              {Number(withdrawAmount) >= balance && balance > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20">
                  <div className="flex-shrink-0 mt-0.5">
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
                      isAr && "text-right",
                    )}
                  >
                    {isAr
                      ? "سيتم سحب كامل الرصيد المتاح"
                      : "This will withdraw your entire available balance"}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={requestWithdrawal.isPending}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {lang(t.cancel)}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={
                    requestWithdrawal.isPending ||
                    !withdrawAmount ||
                    Number(withdrawAmount) <= 0 ||
                    (minWithdrawal > 0 &&
                      Number(withdrawAmount) < minWithdrawal) ||
                    Number(withdrawAmount) > balance
                  }
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {requestWithdrawal.isPending ? (
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
            className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-scale mb-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl shadow-black/10 dark:shadow-black/30"
            dir={isAr ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800 flex flex-row-reverse items-center sticky top-0 bg-white dark:bg-surface-900 z-10">
              <button
                onClick={() => setShowDepositModal(false)}
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
              <div className={cn("flex-1", isAr && "text-right")}>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                  {lang(t.deposit)}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  {lang(t.depositSubtitle)}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment numbers */}
              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.selectPaymentMethod)}
                </label>
                {paymentNumbersLoading ? (
                  <div className="skeleton h-20 w-full rounded-xl" />
                ) : activePaymentNumbers.length === 0 ? (
                  <p className="text-xs text-error-500">
                    {lang(t.noPaymentNumbers)}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activePaymentNumbers.map((pn) => {
                      const selected = selectedPaymentNumberId === pn.id;
                      return (
                        <button
                          key={pn.id}
                          type="button"
                          onClick={() => setSelectedPaymentNumberId(pn.id)}
                          className={cn(
                            "w-full text-start p-3 rounded-xl border-2 transition-all",
                            selected
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                              : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:border-surface-300 dark:hover:border-surface-600",
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-between gap-2",
                              isAr && "flex-row-reverse",
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-surface-900 dark:text-white">
                                {pn.paymentMethod}
                                {pn.label && (
                                  <span className="text-xs font-normal text-surface-500 dark:text-surface-400">
                                    {" · "}
                                    {pn.label}
                                  </span>
                                )}
                              </p>
                              <p
                                className="text-xs font-mono text-surface-500 dark:text-surface-400 tabular-nums mt-0.5"
                                dir="ltr"
                              >
                                {pn.phoneNumber}
                              </p>
                            </div>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard?.writeText(pn.phoneNumber);
                                toast.success(lang(t.copied));
                              }}
                              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-600"
                            >
                              {lang(t.copy)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.amount)}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min={1}
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

              {/* Sender phone */}
              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.phoneFrom)}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={depositPhoneFrom}
                  onChange={(e) =>
                    setDepositPhoneFrom(
                      e.target.value.replace(/[^\d]/g, "").slice(0, 11),
                    )
                  }
                  className={cn(
                    "w-full rounded-xl py-3 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-transparent focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all text-sm font-medium",
                    isAr && "text-right",
                  )}
                  placeholder={lang(t.phoneFromPlaceholder)}
                  dir="ltr"
                />
              </div>

              {/* Notes (optional) */}
              <div className={cn("space-y-1.5", isAr && "text-right")}>
                <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">
                  {lang(t.notes)}
                </label>
                <textarea
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  rows={2}
                  className={cn(
                    "w-full rounded-xl py-2.5 px-4 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-transparent focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all text-sm font-medium resize-none",
                    isAr && "text-right",
                  )}
                  placeholder={lang(t.notesPlaceholder)}
                />
              </div>

              {/* Footer buttons */}
              <div
                className={cn("flex gap-3 pt-2", isAr && "flex-row-reverse")}
              >
                <button
                  onClick={() => setShowDepositModal(false)}
                  disabled={submitTopUp.isPending}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {lang(t.cancel)}
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={
                    submitTopUp.isPending ||
                    !depositAmount ||
                    Number(depositAmount) <= 0 ||
                    !selectedPaymentNumberId ||
                    !isValidPhone(depositPhoneFrom)
                  }
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2",
                    isAr && "flex-row-reverse",
                  )}
                >
                  {submitTopUp.isPending ? (
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
                    <span>{lang(t.confirmDeposit)}</span>
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

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { cn } from "@shared/utils/cn";

// ---- Types ----
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

interface ToastContextValue {
  success: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>,
  ) => void;
  error: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>,
  ) => void;
  warning: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>,
  ) => void;
  info: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>,
  ) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 4;
let toastCounter = 0;

const generateId = (): string => {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
};

// ============================================
// Glassmorphism iOS-style configs
// ============================================

const toastConfig: Record<
  ToastType,
  {
    glassBg: string;
    glassBorder: string;
    iconBg: string;
    iconColor: string;
    progressBg: string;
    glowColor: string;
    accentDot: string;
  }
> = {
  success: {
    glassBg: "bg-white/80 dark:bg-emerald-950/60",
    glassBorder: "border-emerald-200/50 dark:border-emerald-700/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    progressBg: "bg-emerald-500",
    glowColor: "shadow-emerald-500/10 dark:shadow-emerald-400/5",
    accentDot: "bg-emerald-500",
  },
  error: {
    glassBg: "bg-white/80 dark:bg-red-950/60",
    glassBorder: "border-red-200/50 dark:border-red-700/30",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    iconColor: "text-red-600 dark:text-red-400",
    progressBg: "bg-red-500",
    glowColor: "shadow-red-500/10 dark:shadow-red-400/5",
    accentDot: "bg-red-500",
  },
  warning: {
    glassBg: "bg-white/80 dark:bg-amber-950/60",
    glassBorder: "border-amber-200/50 dark:border-amber-700/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    progressBg: "bg-amber-500",
    glowColor: "shadow-amber-500/10 dark:shadow-amber-400/5",
    accentDot: "bg-amber-500",
  },
  info: {
    glassBg: "bg-white/80 dark:bg-sky-950/60",
    glassBorder: "border-sky-200/50 dark:border-sky-700/30",
    iconBg: "bg-sky-100 dark:bg-sky-900/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    progressBg: "bg-sky-500",
    glowColor: "shadow-sky-500/10 dark:shadow-sky-400/5",
    accentDot: "bg-sky-500",
  },
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  switch (type) {
    case "success":
      return (
        <svg
          className="w-5 h-5"
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
      );
    case "error":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      );
    case "info":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      );
  }
};

// ============================================
// Toast Item — iOS Glassmorphism
// ============================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  isAr: boolean;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, isAr }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const config = toastConfig[toast.type];

  useEffect(() => {
    if (!toast.duration || toast.duration === 0 || isPaused) return;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 400);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, toast.id, onDismiss, isPaused]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 400);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl",
        "backdrop-blur-2xl backdrop-saturate-150",
        config.glassBg,
        config.glassBorder,
        "border shadow-lg",
        config.glowColor,
        "transition-all duration-400 ease-out",
        isExiting
          ? "opacity-0 translate-y-3 scale-95"
          : "opacity-100 translate-y-0 scale-100 animate-slide-up",
      )}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && !isPaused && (
        <div className="absolute bottom-0 start-0 h-0.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", config.progressBg)}
            style={{
              animation: `toast-shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm",
          config.iconBg,
          config.iconColor,
        )}
      >
        <ToastIcon type={toast.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">
          {toast.message}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              handleDismiss();
            }}
            className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {toast.action.label} →
          </button>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        aria-label={isAr ? "إغلاق" : "Close"}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>

      <style>{`@keyframes toast-shrink { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
};

// ============================================
// ToasterProvider (with deduplication)
// ============================================

interface ToasterProviderProps {
  children: ReactNode;
}

export const ToasterProvider: React.FC<ToasterProviderProps> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      message: string,
      options?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>,
    ) => {
      // Deduplicate: if same type + message exists, don't add new one
      setToasts((prev) => {
        const exists = prev.find(
          (t) => t.type === type && t.message === message,
        );
        if (exists) return prev;

        const id = generateId();
        const newToast: Toast = {
          id,
          type,
          message,
          duration: options?.duration ?? DEFAULT_DURATION,
          description: options?.description,
          action: options?.action,
          createdAt: Date.now(),
        };
        const updated = [newToast, ...prev];
        return updated.length > MAX_TOASTS
          ? updated.slice(0, MAX_TOASTS)
          : updated;
      });
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const success = useCallback(
    (msg: string, opts?: any) => addToast("success", msg, opts),
    [addToast],
  );
  const error = useCallback(
    (msg: string, opts?: any) => addToast("error", msg, opts),
    [addToast],
  );
  const warning = useCallback(
    (msg: string, opts?: any) => addToast("warning", msg, opts),
    [addToast],
  );
  const info = useCallback(
    (msg: string, opts?: any) => addToast("info", msg, opts),
    [addToast],
  );

  return (
    <ToastContext.Provider
      value={{ success, error, warning, info, dismiss, dismissAll }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ============================================
// ToastContainer — Bottom Center
// ============================================

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === "ar";

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label={isAr ? "الإشعارات" : "Notifications"}
      className="fixed z-[200] flex flex-col-reverse items-center gap-2.5 pointer-events-none bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full">
          <ToastItem toast={toast} onDismiss={onDismiss} isAr={isAr} />
        </div>
      ))}
    </div>
  );
};

// ============================================
// Toaster Component (rendered in App.tsx)
// ============================================

export const Toaster: React.FC = () => null;

// ============================================
// useToast Hook
// ============================================

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined)
    throw new Error("useToast must be used within a <ToasterProvider>");
  return context;
};

export default Toaster;

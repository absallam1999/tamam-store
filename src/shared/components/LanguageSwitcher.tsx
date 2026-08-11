import React from "react";
import { useLanguage } from "@shared/hooks/useLanguage";
import { cn } from "@shared/utils/cn";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "navbar" | "sidebar" | "minimal";
}

// Simple counter for unique IDs
let flagInstanceCounter = 0;
function getFlagId() {
  flagInstanceCounter += 1;
  return `flag-${flagInstanceCounter}`;
}

/**
 * LanguageSwitcher — Bilingual Toggle Component
 *
 * Professional language toggle that seamlessly switches between
 * Arabic (Egypt) and English with proper flag representations.
 */

const EgyptFlag: React.FC<{ className?: string }> = ({ className }) => {
  const id = React.useMemo(() => getFlagId(), []);

  return (
    <svg
      className={cn("w-5 h-5", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Egyptian Flag"
    >
      <defs>
        <linearGradient id={`egRed-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4112A" />
          <stop offset="100%" stopColor="#B80F23" />
        </linearGradient>
        <linearGradient id={`egGold-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A800" />
          <stop offset="100%" stopColor="#A07800" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="20" height="5.33" fill={`url(#egRed-${id})`} />
      <rect x="2" y="9.33" width="20" height="5.33" fill="#FFFFFF" />
      <rect x="2" y="14.66" width="20" height="5.33" fill="#1A1A1A" />
      <line
        x1="2"
        y1="9.33"
        x2="22"
        y2="9.33"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="0.3"
      />
      <line
        x1="2"
        y1="14.66"
        x2="22"
        y2="14.66"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth="0.3"
      />
      <g transform="translate(12, 11.9) scale(0.33)">
        <path
          d="M0,-13 L2.5,-12 L4.5,-9 L6.5,-5 L8.5,-3 L9.5,-1 L10.5,3 L11.5,7 L9.5,8 L7.5,6 L5.5,7 L3.5,10 L1.5,12 L0,13 L-1.5,12 L-3.5,10 L-5.5,7 L-7.5,6 L-9.5,8 L-11.5,7 L-10.5,3 L-9.5,-1 L-8.5,-3 L-6.5,-5 L-4.5,-9 L-2.5,-12 Z"
          fill={`url(#egGold-${id})`}
          stroke="#8B6914"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
        <circle
          cx="0"
          cy="-11"
          r="2.2"
          fill={`url(#egGold-${id})`}
          stroke="#8B6914"
          strokeWidth="0.3"
        />
        <circle cx="-0.8" cy="-11.5" r="0.55" fill="#FFFFFF" />
        <circle cx="0.8" cy="-11.5" r="0.55" fill="#FFFFFF" />
        <circle cx="-0.8" cy="-11.5" r="0.3" fill="#1A1A1A" />
        <circle cx="0.8" cy="-11.5" r="0.3" fill="#1A1A1A" />
        <path
          d="M-0.4,-9.2 L0,-7.5 L0.4,-9.2"
          fill="#8B6914"
          stroke="#6B4F0A"
          strokeWidth="0.25"
          strokeLinejoin="round"
        />
        <path
          d="M-1.8,-13 L-1.2,-13.8 L0,-13 L1.2,-13.8 L1.8,-13"
          fill={`url(#egGold-${id})`}
          stroke="#8B6914"
          strokeWidth="0.3"
          strokeLinejoin="round"
        />
        <g
          fill="none"
          stroke="#8B6914"
          strokeWidth="0.45"
          strokeLinecap="round"
        >
          <path d="M-6.5,-4.5 C-7.5,-3.5 -8.5,-1.5 -9.5,-0.5" />
          <path d="M-7,-2.5 C-8,-1 -9,1 -10,2.5" />
          <path d="M-7.5,-0.5 C-8.5,1.5 -9,3.5 -9.5,5" />
        </g>
        <g
          fill="none"
          stroke="#8B6914"
          strokeWidth="0.45"
          strokeLinecap="round"
        >
          <path d="M6.5,-4.5 C7.5,-3.5 8.5,-1.5 9.5,-0.5" />
          <path d="M7,-2.5 C8,-1 9,1 10,2.5" />
          <path d="M7.5,-0.5 C8.5,1.5 9,3.5 9.5,5" />
        </g>
        <path
          d="M-2,-6.5 L0,-5 L2,-6.5 L2,-3 L0,-1.5 L-2,-3 Z"
          fill={`url(#egGold-${id})`}
          stroke="#8B6914"
          strokeWidth="0.35"
          strokeLinejoin="round"
        />
        <g fill="none" stroke="#8B6914" strokeWidth="0.5" strokeLinecap="round">
          <path d="M-3.5,11 L-4.5,13" />
          <path d="M-2.5,11 L-2.5,13" />
          <path d="M-1.5,11 L-0.5,13" />
        </g>
        <g fill="none" stroke="#8B6914" strokeWidth="0.5" strokeLinecap="round">
          <path d="M3.5,11 L4.5,13" />
          <path d="M2.5,11 L2.5,13" />
          <path d="M1.5,11 L0.5,13" />
        </g>
        <rect
          x="-5.5"
          y="12.5"
          width="11"
          height="2"
          rx="1"
          fill={`url(#egGold-${id})`}
          stroke="#8B6914"
          strokeWidth="0.35"
        />
      </g>
    </svg>
  );
};

const UKFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn("w-5 h-5", className)}
    viewBox="0 0 24 24"
    fill="none"
    aria-label="UK Flag"
  >
    <rect x="2" y="4" width="20" height="16" rx="1" fill="#012169" />
    <path d="M2 4l8.5 6.5L2 17" stroke="#FFFFFF" strokeWidth="2.5" />
    <path d="M22 4l-8.5 6.5L22 17" stroke="#FFFFFF" strokeWidth="2.5" />
    <path d="M2 4l8.5 6.5L2 17" stroke="#C8102E" strokeWidth="1.2" />
    <path d="M22 4l-8.5 6.5L22 17" stroke="#C8102E" strokeWidth="1.2" />
    <rect x="10.5" y="4" width="3" height="16" fill="#FFFFFF" />
    <rect x="2" y="10.5" width="20" height="3" fill="#FFFFFF" />
    <rect x="11" y="4" width="2" height="16" fill="#C8102E" />
    <rect x="2" y="11" width="20" height="2" fill="#C8102E" />
  </svg>
);

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  variant = "navbar",
}) => {
  const { currentLanguage, toggleLanguage } = useLanguage();
  const isArabic = currentLanguage === "ar";

  const variants = {
    navbar: {
      button: cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        "bg-surface-100 dark:bg-surface-800",
        "hover:bg-surface-200 dark:hover:bg-surface-700",
        "active:scale-95 transition-all duration-200",
        "border border-surface-200 dark:border-surface-700",
        "text-surface-700 dark:text-surface-300",
        "group",
      ),
      flagContainer:
        "relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
      label:
        "text-sm font-medium hidden sm:inline text-surface-700 dark:text-surface-300",
    },
    sidebar: {
      button: cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl w-full",
        "text-surface-600 dark:text-surface-400",
        "hover:bg-surface-100 dark:hover:bg-surface-800/50",
        "hover:text-surface-900 dark:hover:text-surface-200",
        "active:scale-[0.98] transition-all duration-200",
        "group",
      ),
      flagContainer:
        "relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
      label: "text-sm font-medium flex-1 truncate",
    },
    minimal: {
      button: cn(
        "flex items-center justify-center p-2 rounded-xl",
        "hover:bg-surface-100 dark:hover:bg-surface-800",
        "active:scale-95 transition-all duration-200",
        "text-surface-500 dark:text-surface-400",
        "group",
      ),
      flagContainer:
        "relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
      label: "hidden",
    },
  };

  const styles = variants[variant];

  return (
    <button
      onClick={toggleLanguage}
      className={cn(styles.button, className)}
      aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
      title={isArabic ? "Switch to English" : "التبديل إلى العربية"}
    >
      <span className={styles.flagContainer} role="img" aria-hidden="true">
        {isArabic ? <UKFlag /> : <EgyptFlag />}
      </span>
      <span className={styles.label}>{isArabic ? "English" : "العربية"}</span>
      {variant === "navbar" && (
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-surface-400 dark:text-surface-500 bg-surface-200 dark:bg-surface-700 rounded-md ms-1">
          <span className="text-xs">⌘</span>L
        </kbd>
      )}
    </button>
  );
};

export const LanguageSwitcherDropdown: React.FC<LanguageSwitcherProps> = ({
  className = "",
}) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const languages = [
    {
      code: "ar" as const,
      label: "العربية",
      shortLabel: "AR",
      flag: <EgyptFlag />,
    },
    {
      code: "en" as const,
      label: "English",
      shortLabel: "EN",
      flag: <UKFlag />,
    },
  ];

  const currentLang = languages.find((l) => l.code === currentLanguage);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as HTMLElement)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-surface-100 dark:bg-surface-800",
          "hover:bg-surface-200 dark:hover:bg-surface-700",
          "active:scale-95 transition-all duration-200",
          "border border-surface-200 dark:border-surface-700",
          "text-surface-700 dark:text-surface-300",
          isOpen &&
            "border-primary-500 dark:border-primary-400 bg-surface-200 dark:bg-surface-700",
        )}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="transition-transform duration-300 hover:scale-110">
          {currentLang?.flag}
        </span>
        <span className="text-sm font-medium hidden sm:inline">
          {currentLang?.shortLabel}
        </span>
        <svg
          className={cn(
            "w-3 h-3 text-surface-400 dark:text-surface-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
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
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full mt-2 w-44 end-0 glass glass-elevated rounded-2xl overflow-hidden animate-fade-in-scale origin-top-right z-20">
            <div className="p-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                    "hover:bg-surface-100 dark:hover:bg-surface-800/50",
                    currentLanguage === lang.code
                      ? "bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300 font-medium"
                      : "text-surface-700 dark:text-surface-300",
                  )}
                >
                  <span>{lang.flag}</span>
                  <span className="flex-1 text-start">{lang.label}</span>
                  {currentLanguage === lang.code && (
                    <svg
                      className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0"
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
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

/**
 * Theme — The application supports three theme modes:
 * - 'light'  → Always light mode
 * - 'dark'   → Always dark mode
 * - 'system' → Follows the user's OS preference (default)
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * ResolvedTheme — The actual rendered theme.
 * This is always either 'light' or 'dark', never 'system'.
 */
type ResolvedTheme = "light" | "dark";

/**
 * AccentColor — Store-specific accent color options.
 * Store owners can personalize their dashboard accent.
 */
export type AccentColor = "emerald" | "green" | "teal" | "cyan" | "blue";

interface AccentConfig {
  name: string;
  nameAr: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
}

const accentConfigs: Record<AccentColor, AccentConfig> = {
  emerald: {
    name: "Emerald",
    nameAr: "زمردي",
    primary: "var(--color-primary-500)",
    primaryHover: "var(--color-primary-600)",
    primaryLight: "var(--color-primary-100)",
    primaryDark: "var(--color-primary-400)",
  },
  green: {
    name: "Green",
    nameAr: "أخضر",
    primary: "#22c55e",
    primaryHover: "#16a34a",
    primaryLight: "#dcfce7",
    primaryDark: "#4ade80",
  },
  teal: {
    name: "Teal",
    nameAr: "تركواز",
    primary: "#14b8a6",
    primaryHover: "#0d9488",
    primaryLight: "#ccfbf1",
    primaryDark: "#2dd4bf",
  },
  cyan: {
    name: "Cyan",
    nameAr: "سماوي",
    primary: "#06b6d4",
    primaryHover: "#0891b2",
    primaryLight: "#cffafe",
    primaryDark: "#22d3ee",
  },
  blue: {
    name: "Blue",
    nameAr: "أزرق",
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryLight: "#dbeafe",
    primaryDark: "#60a5fa",
  },
};

interface ThemeContextValue {
  /** The user's selected preference (including 'system') */
  theme: ThemeMode;
  /** The currently active rendered theme */
  resolvedTheme: ResolvedTheme;
  /** Set a specific theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark (stores as explicit preference) */
  toggleTheme: () => void;
  /** Whether the current resolved theme is dark */
  isDark: boolean;
  /** Current accent color */
  accent: AccentColor;
  /** Set accent color */
  setAccent: (accent: AccentColor) => void;
  /** Available accent colors */
  availableAccents: AccentConfig[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---- Constants ----
const THEME_STORAGE_KEY = "store-theme-preference";
const ACCENT_STORAGE_KEY = "store-accent-preference";
const DARK_CLASS = "dark";

/**
 * Resolve the actual theme based on preference and system setting.
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

/**
 * Persist theme preference to localStorage.
 */
function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable — silent fail
  }
}

/**
 * Retrieve persisted theme preference.
 */
function getPersistedTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {}
  return "system";
}

/**
 * Persist accent preference.
 */
function persistAccent(accent: AccentColor): void {
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // localStorage unavailable
  }
}

/**
 * Retrieve persisted accent preference.
 */
function getPersistedAccent(): AccentColor {
  try {
    const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (stored && stored in accentConfigs) {
      return stored as AccentColor;
    }
  } catch {
    // localStorage unavailable
  }
  return "emerald";
}

/**
 * Apply or remove the dark class on the document element.
 * Also sets data attributes for CSS selectors and browser UI theming.
 */
function applyTheme(resolved: ResolvedTheme, accent: AccentColor): void {
  const root = document.documentElement;

  // Toggle Tailwind's dark class
  root.classList.toggle(DARK_CLASS, resolved === "dark");

  // Data attribute for CSS selectors
  root.setAttribute("data-theme", resolved);

  // Accent color attribute for custom theming
  root.setAttribute("data-accent", accent);

  // Browser UI theming (address bar, scrollbar, form controls)
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", resolved);
  } else {
    const newMeta = document.createElement("meta");
    newMeta.name = "color-scheme";
    newMeta.content = resolved;
    document.head.appendChild(newMeta);
  }

  // Mark as ready to enable CSS transitions
  root.classList.add("theme-ready");
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider — Store Dashboard Theming
 *
 * Manages the application's color scheme with full system preference
 * detection, persistence, and smooth transitions. Additionally supports
 * accent color personalization for store owners.
 *
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize from localStorage
  const [theme, setThemeState] = useState<ThemeMode>(getPersistedTheme);
  const [accent, setAccentState] = useState<AccentColor>(getPersistedAccent);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getPersistedTheme()),
  );

  // ---- Apply theme to DOM on changes ----
  useEffect(() => {
    applyTheme(resolvedTheme, accent);
  }, [resolvedTheme, accent]);

  // ---- Listen for system preference changes when in 'system' mode ----
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // ---- Sync resolved theme when user changes preference ----
  useEffect(() => {
    setResolvedTheme(resolveTheme(theme));
  }, [theme]);

  // ---- Set theme with persistence ----
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    persistTheme(mode);
  }, []);

  // ---- Toggle between light and dark ----
  const toggleTheme = useCallback(() => {
    const next: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setThemeState(next);
    persistTheme(next);
  }, [resolvedTheme]);

  // ---- Set accent with persistence ----
  const setAccent = useCallback((color: AccentColor) => {
    setAccentState(color);
    persistAccent(color);
  }, []);

  // ---- Derived values ----
  const isDark = resolvedTheme === "dark";

  // Available accents as array for UI rendering
  const availableAccents = useMemo(() => Object.values(accentConfigs), []);

  // ---- Memoized context value ----
  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isDark,
      accent,
      setAccent,
      availableAccents,
    }),
    [
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isDark,
      accent,
      setAccent,
      availableAccents,
    ],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme
 *
 * Hook to access the theme context from any component.
 * Throws if used outside of <ThemeProvider>.
 *
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme must be used within a <ThemeProvider>. " +
        "Wrap your application root with <ThemeProvider>.",
    );
  }

  return context;
};

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { ENDPOINTS } from "@/config/api";
import { apiClient, ApiError } from "@/lib/api-client";
import type { AuthResponseDto, UserRole } from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoreOwner {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
  remember?: boolean;
}

export interface SendOtpCredentials {
  phoneNumber: string;
}

export interface VerifyOtpCredentials {
  phoneNumber: string;
  code: string;
}

export interface StoreRequestCredentials {
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  city?: string;
  brandName?: string;
  note?: string;
  types: string[];
}

interface AuthContextValue {
  user: StoreOwner | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  submitStoreRequest: (credentials: StoreRequestCredentials) => Promise<void>;
  logout: () => void;
  sendOtp: (credentials: SendOtpCredentials) => Promise<void>;
  verifyOtp: (credentials: VerifyOtpCredentials) => Promise<boolean>;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<string | null>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ═════════════════════════════════════════════════════════════════════
// Storage keys
// ═════════════════════════════════════════════════════════════════════

const ACCESS_TOKEN_KEY = "store-access-token";
const REFRESH_TOKEN_KEY = "store-refresh-token";
const USER_DATA_KEY = "store-user-data";

// ═════════════════════════════════════════════════════════════════════
// Token storage helpers
// ═════════════════════════════════════════════════════════════════════

function getStoredTokens(): AuthTokens | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (accessToken && refreshToken) return { accessToken, refreshToken };
    return null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    /* storage disabled — session will not survive reload */
  }
}

function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch {
    /* ignore */
  }
}

function getStoredUser(): StoreOwner | null {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoreOwner;
  } catch {
    return null;
  }
}

function storeUser(user: StoreOwner): void {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

// ═════════════════════════════════════════════════════════════════════
// Map the flat AuthResponseDto → StoreOwner
// ═════════════════════════════════════════════════════════════════════

function mapAuthResponseToUser(
  dto: AuthResponseDto,
  phoneFallback?: string,
): StoreOwner {
  return {
    id: dto.userId,
    fullName: dto.fullName ?? "",
    phoneNumber: dto.phoneNumber ?? phoneFallback ?? "",
    email: undefined, // not in AuthResponseDto — filled in by StoreProvider profile fetch
    role: dto.role ?? "StoreOwner",
    isActive: dto.isActive,
  };
}

// ═════════════════════════════════════════════════════════════════════
// Provider
// ═════════════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StoreOwner | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ══════════════════════════════════════════════════════════════════
  // Read the current access token from storage.
  // api-client refreshes transparently on 401 — this is just a read.
  // ══════════════════════════════════════════════════════════════════
  const getAccessToken = useCallback((): string | null => {
    return getStoredTokens()?.accessToken ?? null;
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // Force a session check. If the token is expired, api-client's 401
  // interceptor refreshes it and retries. If refresh fails, api-client
  // clears tokens and redirects to /auth/login.
  //
  // Returns the (possibly refreshed) access token, or null when the
  // session is truly dead.
  // ══════════════════════════════════════════════════════════════════
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      // Any authenticated call exercises the auto-refresh path.
      await apiClient.get(ENDPOINTS.STORE.PROFILE);
      return getStoredTokens()?.accessToken ?? null;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return null; // Session is dead — api-client already cleaned up
      }
      // Transient error (network / 5xx) — token may still be valid
      return getStoredTokens()?.accessToken ?? null;
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // Session initialization on mount
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      const tokens = getStoredTokens();
      const storedUser = getStoredUser();

      // No tokens → no session, done.
      if (!tokens) {
        if (!cancelled) {
          setUser(null);
          clearTokens();
          setIsLoading(false);
        }
        return;
      }

      // Tokens exist — verify them by hitting the profile endpoint.
      // Triggers auto-refresh if expired; throws only when refresh fails.
      try {
        await apiClient.get(ENDPOINTS.STORE.PROFILE);

        if (!cancelled) {
          // Token is good. Keep stored user (identity doesn't change on refresh).
          setUser(storedUser);
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          // Refresh chain exhausted — session is dead
          clearTokens();
          setUser(null);
        } else {
          // Server / network hiccup — keep the stored user so UI stays alive
          setUser(storedUser);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════════════════════════════
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setError(null);

      try {
        const { data } = await apiClient.post<AuthResponseDto>(
          ENDPOINTS.AUTH.LOGIN,
          {
            phoneNumber: credentials.phoneNumber.trim(),
            password: credentials.password,
            role: "StoreOwner", // string — matches UserRole union
          },
          true, // skipAuth — we're not authenticated yet
        );

        if (!data.token || !data.refreshToken) {
          throw new Error("لم يتم استلام رمز الوصول من الخادم");
        }

        storeTokens({
          accessToken: data.token,
          refreshToken: data.refreshToken,
        });

        const newUser = mapAuthResponseToUser(data, credentials.phoneNumber);
        storeUser(newUser);
        setUser(newUser);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "فشل تسجيل الدخول";
        setError(message);
        throw err;
      }
    },
    [],
  );

  // ══════════════════════════════════════════════════════════════════
  // SEND OTP (login flow — not registration)
  // ══════════════════════════════════════════════════════════════════
  const sendOtp = useCallback(
    async (credentials: SendOtpCredentials): Promise<void> => {
      setError(null);

      try {
        await apiClient.post(
          ENDPOINTS.AUTH.SEND_OTP,
          {
            phoneNumber: credentials.phoneNumber.trim(),
            role: "StoreOwner",
          },
          true, // skipAuth
        );
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "فشل إرسال رمز التحقق";
        setError(message);
        throw err;
      }
    },
    [],
  );

  // ══════════════════════════════════════════════════════════════════
  // VERIFY OTP (login flow — returns AuthResponseDto on success)
  // ══════════════════════════════════════════════════════════════════
  const verifyOtp = useCallback(
    async (credentials: VerifyOtpCredentials): Promise<boolean> => {
      setError(null);

      try {
        const { data } = await apiClient.post<AuthResponseDto>(
          ENDPOINTS.AUTH.VERIFY_OTP,
          {
            phoneNumber: credentials.phoneNumber.trim(),
            code: credentials.code,
            role: "StoreOwner",
          },
          true, // skipAuth
        );

        if (!data.token || !data.refreshToken) {
          return false; // No session issued
        }

        storeTokens({
          accessToken: data.token,
          refreshToken: data.refreshToken,
        });

        const newUser = mapAuthResponseToUser(data, credentials.phoneNumber);
        storeUser(newUser);
        setUser(newUser);
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "فشل التحقق من الرمز";
        setError(message);
        throw err;
      }
    },
    [],
  );

  // ══════════════════════════════════════════════════════════════════
  // SUBMIT STORE REQUEST — endpoint not yet shipped
  // Kept in the interface so existing callers don't break; fails clearly.
  // ══════════════════════════════════════════════════════════════════
  const submitStoreRequest = useCallback(
    async (_credentials: StoreRequestCredentials): Promise<void> => {
      const message =
        "خدمة طلب إنشاء المتجر غير متاحة حالياً. يرجى التواصل مع الدعم.";
      setError(message);
      throw new Error(message);
    },
    [],
  );

  // ══════════════════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════════════════
  const logout = useCallback(() => {
    // Best-effort server-side logout (ignores failures — token will expire anyway)
    apiClient.post(ENDPOINTS.AUTH.LOGOUT).catch(() => undefined);

    clearTokens();
    setUser(null);
    setError(null);
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // Derived state
  // ══════════════════════════════════════════════════════════════════
  const isAuthenticated = user !== null;

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      submitStoreRequest,
      logout,
      sendOtp,
      verifyOtp,
      getAccessToken,
      refreshToken,
      error,
      clearError,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      login,
      submitStoreRequest,
      logout,
      sendOtp,
      verifyOtp,
      getAccessToken,
      refreshToken,
      error,
      clearError,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return context;
};

export default AuthProvider;
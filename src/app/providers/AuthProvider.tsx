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
import type {
  AuthResponseDto,
  UserRole,
  SubmitStoreOnboardingDto,
  OnboardingSubmissionResultDto,
  OtpSentResponseDto,
} from "@shared/types";

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

export type StoreRequestCredentials = SubmitStoreOnboardingDto;

interface AuthContextValue {
  user: StoreOwner | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  submitStoreRequest: (
    credentials: StoreRequestCredentials,
  ) => Promise<OnboardingSubmissionResultDto>;
  logout: () => void;
  sendOtp: (credentials: SendOtpCredentials) => Promise<OtpSentResponseDto>;
  verifyOtp: (credentials: VerifyOtpCredentials) => Promise<boolean>;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<string | null>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ═════════════════════════════════════════════════════════════════════
// Storage keys + helpers
// ═════════════════════════════════════════════════════════════════════

const ACCESS_TOKEN_KEY = "store-access-token";
const REFRESH_TOKEN_KEY = "store-refresh-token";
const USER_DATA_KEY = "store-user-data";

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
    email: undefined,
    role: dto.role ?? "StoreOwner",
    isActive: dto.isActive,
  };
}

function rejectIfWrongRole(dto: AuthResponseDto): string | null {
  if (dto.role && dto.role !== "StoreOwner") {
    return "هذا الحساب غير مصرح له بالدخول إلى بوابة المتجر";
  }
  return null;
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

  const getAccessToken = useCallback(
    (): string | null => getStoredTokens()?.accessToken ?? null,
    [],
  );

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      await apiClient.get(ENDPOINTS.STORE.PROFILE);
      return getStoredTokens()?.accessToken ?? null;
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        return null;
      }
      return getStoredTokens()?.accessToken ?? null;
    }
  }, []);

  // ── Session init ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      const tokens = getStoredTokens();
      const storedUser = getStoredUser();

      if (!tokens) {
        if (!cancelled) {
          setUser(null);
          clearTokens();
          setIsLoading(false);
        }
        return;
      }

      try {
        await apiClient.get(ENDPOINTS.STORE.PROFILE);
        if (!cancelled) setUser(storedUser);
      } catch (err) {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403)
        ) {
          clearTokens();
          setUser(null);
        } else {
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

  // ── LOGIN ────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setError(null);

      try {
        const { data } = await apiClient.post<AuthResponseDto>(
          ENDPOINTS.AUTH.LOGIN,
          {
            phoneNumber: credentials.phoneNumber.trim(),
            password: credentials.password,
            role: "StoreOwner",
          },
          true,
        );

        const roleError = rejectIfWrongRole(data);
        if (roleError) throw new Error(roleError);

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

  // ── SEND OTP (login flow) ────────────────────────────────────────
  const sendOtp = useCallback(
    async (credentials: SendOtpCredentials): Promise<OtpSentResponseDto> => {
      setError(null);

      try {
        const { data } = await apiClient.post<OtpSentResponseDto>(
          ENDPOINTS.AUTH.SEND_OTP,
          {
            phoneNumber: credentials.phoneNumber.trim(),
            role: "StoreOwner",
          },
          true,
        );
        return data;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "فشل إرسال رمز التحقق";
        setError(message);
        throw err;
      }
    },
    [],
  );

  // ── VERIFY OTP (login flow) ──────────────────────────────────────
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
          true,
        );

        const roleError = rejectIfWrongRole(data);
        if (roleError) throw new Error(roleError);

        if (!data.token || !data.refreshToken) return false;

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

  // ── SUBMIT STORE ONBOARDING ──────────────────────────────────────
  const submitStoreRequest = useCallback(
    async (
      credentials: StoreRequestCredentials,
    ): Promise<OnboardingSubmissionResultDto> => {
      setError(null);

      try {
        const { data } = await apiClient.post<OnboardingSubmissionResultDto>(
          ENDPOINTS.ONBOARDING.SUBMIT,
          credentials,
          true, // public submission
        );
        return data;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.status === 429
              ? "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل."
              : err.message
            : "فشل إرسال طلب إنشاء المتجر";
        setError(message);
        throw err;
      }
    },
    [],
  );

  // ── LOGOUT ───────────────────────────────────────────────────────
  const logout = useCallback(() => {
    apiClient.post(ENDPOINTS.AUTH.LOGOUT).catch(() => undefined);
    clearTokens();
    setUser(null);
    setError(null);
  }, []);

  // ── Derived state ────────────────────────────────────────────────
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
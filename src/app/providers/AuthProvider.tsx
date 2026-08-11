import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { ENDPOINTS, getApiUrl } from "@/config/api";

// ============================================
// Types
// ============================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoreOwner {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  storeId: string;
  storeName: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin: string;
}

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
  remember: boolean;
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
  prandName?: string;
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

// ============================================
// Constants
// ============================================

const ACCESS_TOKEN_KEY = "store-access-token";
const REFRESH_TOKEN_KEY = "store-refresh-token";
const USER_DATA_KEY = "store-user-data";

// ============================================
// Token Utilities
// ============================================

function getStoredTokens(): AuthTokens | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {}
}

function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch {}
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
  } catch {}
}

// ============================================
// Extract token
// ============================================

function extractTokens(responseData: Record<string, unknown>): AuthTokens | null {
  const inner = (responseData.data as Record<string, unknown>) ?? responseData;
  const token = (inner.token ?? responseData.token) as string | undefined;
  if (!token) return null;
  const refreshToken = (inner.refreshToken ?? responseData.refreshToken ?? token) as string;
  return { accessToken: token, refreshToken };
}

// ============================================
// Build StoreOwner
// ============================================

function buildStoreOwner(
  responseData: Record<string, unknown>,
  phoneFallback?: string,
  existingUser?: StoreOwner | null,
): StoreOwner {
  const inner = (responseData.data as Record<string, unknown>) ?? responseData;
  const id = (inner.userId ?? responseData.userId ?? existingUser?.id ?? "") as string;

  const fullName = (inner.fullName ?? responseData.fullName ?? existingUser?.fullName ?? inner.name ?? responseData.name ?? "") as string;

  const phoneNumber = (inner.phoneNumber ?? responseData.phoneNumber ?? phoneFallback ?? existingUser?.phoneNumber ?? "") as string;

  const storeName = (inner.storeNameEn ?? inner.nameEn ?? responseData.storeNameEn ?? responseData.nameEn ?? inner.name ?? responseData.name ?? existingUser?.storeName ?? "") as string;

  return {
    id,
    fullName,
    email: (inner.email ?? responseData.email ?? existingUser?.email ?? "") as string,
    phoneNumber,
    storeId: id,
    storeName,
    isEmailVerified: (inner.isEmailVerified ?? responseData.isEmailVerified ?? existingUser?.isEmailVerified ?? false) as boolean,
    isPhoneVerified: (inner.isActive ?? responseData.isActive ?? existingUser?.isPhoneVerified ?? false) as boolean,
    lastLogin: new Date().toISOString(),
  };
}

// ============================================
// Profile fetch - more resilient
// ============================================

async function fetchStoreProfile(
  accessToken: string,
  existingUser?: StoreOwner | null,
): Promise<StoreOwner | null> {
  try {
    const response = await fetch(getApiUrl(ENDPOINTS.STORE.PROFILE), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // If 401, token is invalid - don't clear everything yet, let refresh try first
    if (response.status === 401) {
      console.warn("Profile fetch returned 401, token may be expired");
      return null;
    }
    
    // If 500 or other server error, don't log out - just return existing user
    if (!response.ok) {
      console.warn("Profile fetch failed with status:", response.status);
      return existingUser || null;
    }
    
    const profile = await response.json();
    return buildStoreOwner(profile, undefined, existingUser);
  } catch (err) {
    console.error("Profile fetch network error:", err);
    // Network error - don't log out, return existing user
    return existingUser || null;
  }
}

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StoreOwner | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if a token refresh is in progress
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<string | null> | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ============================================
  // Get current access token
  // ============================================
  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.accessToken || null;
  }, []);

  // ============================================
  // Refresh Token - callable from api-client interceptor
  // ============================================
  const refreshToken = useCallback(async (): Promise<string | null> => {
    // If already refreshing, return the existing promise
    if (isRefreshing.current && refreshPromise.current) {
      return refreshPromise.current;
    }

    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) {
      return null;
    }

    isRefreshing.current = true;
    refreshPromise.current = (async () => {
      try {
        const response = await fetch(getApiUrl(ENDPOINTS.AUTH.REFRESH_TOKEN), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }),
        });

        if (!response.ok) {
          throw new Error("Token refresh failed");
        }

        const data = await response.json();
        const newTokens = extractTokens(data);
        
        if (newTokens) {
          storeTokens(newTokens);
          return newTokens.accessToken;
        }
        
        return null;
      } catch {
        console.error("Token refresh failed");
        return null;
      } finally {
        isRefreshing.current = false;
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, []);

  // ============================================
  // Session Initialization
  // ============================================
  useEffect(() => {
    const initSession = async (): Promise<void> => {
      const storedUser = getStoredUser();
      const storedTokens = getStoredTokens();

      // If one exists without the other, clean up
      if ((storedUser && !storedTokens) || (!storedUser && storedTokens)) {
        clearTokens();
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!storedTokens) {
        setIsLoading(false);
        return;
      }

      // Try to refresh the token on init (in case it's about to expire)
      try {
        const newToken = await refreshToken();
        if (!newToken) {
          // Refresh failed, try profile with existing token
          const profile = await fetchStoreProfile(storedTokens.accessToken, storedUser);
          if (profile) {
            setUser(profile);
            storeUser(profile);
          } else {
            // Profile also failed, clear everything
            clearTokens();
            setUser(null);
          }
        } else {
          // Token refreshed successfully, fetch profile with new token
          const profile = await fetchStoreProfile(newToken, storedUser);
          if (profile) {
            setUser(profile);
            storeUser(profile);
          } else {
            // Keep stored user data even if profile fetch fails
            setUser(storedUser);
          }
        }
      } catch {
        // Keep stored user if refresh fails
        setUser(storedUser);
      }

      setIsLoading(false);
    };

    initSession();
  }, [refreshToken]);

  // ============================================
  // Periodic token refresh (every 10 minutes)
  // ============================================
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const newToken = await refreshToken();
      if (!newToken) {
        console.warn("Periodic token refresh failed");
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // ============================================
  // LOGIN
  // ============================================
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setError(null);
      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.LOGIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          password: credentials.password,
          role: 2,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        const message =
          responseData?.message || responseData?.title || "فشل تسجيل الدخول";
        setError(message);
        throw new Error(message);
      }

      const tokens = extractTokens(responseData);
      if (!tokens) {
        const message = "لم يتم استلام رمز الوصول من الخادم";
        setError(message);
        throw new Error(message);
      }

      storeTokens(tokens);
      const newUser = buildStoreOwner(responseData, credentials.phoneNumber);
      storeUser(newUser);
      setUser(newUser);
    },
    [],
  );

  // ============================================
  // SUBMIT STORE REGISTRATION REQUEST
  // ============================================
  const submitStoreRequest = useCallback(
    async (credentials: StoreRequestCredentials): Promise<void> => {
      setError(null);
      const response = await fetch(getApiUrl(ENDPOINTS.REQUESTS), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: credentials.name,
          phoneNumber: credentials.phoneNumber.trim(),
          email: credentials.email || "",
          address: credentials.address || "",
          city: credentials.city || "",
          prandName: credentials.prandName || "",
          note: credentials.note || "",
          types: credentials.types,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        const message = data?.message || data?.title || "فشل إرسال الطلب";
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  // ============================================
  // LOGOUT
  // ============================================
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setError(null);
  }, []);

  // ============================================
  // SEND OTP
  // ============================================
  const sendOtp = useCallback(
    async (credentials: SendOtpCredentials): Promise<void> => {
      setError(null);
      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.SEND_OTP), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          role: 2,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          data?.Message || data?.message || data?.title || "فشل إرسال رمز التحقق";
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  // ============================================
  // VERIFY OTP
  // ============================================
  const verifyOtp = useCallback(
    async (credentials: VerifyOtpCredentials): Promise<boolean> => {
      setError(null);
      const response = await fetch(getApiUrl(ENDPOINTS.AUTH.VERIFY_OTP), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber.trim(),
          code: credentials.code,
          role: 2,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok || responseData?.success === false) {
        const message =
          responseData?.message || responseData?.Message || responseData?.title || "فشل التحقق من الرمز";
        setError(message);
        throw new Error(message);
      }

      const tokens = extractTokens(responseData);
      if (tokens) {
        storeTokens(tokens);
        const newUser = buildStoreOwner(responseData, credentials.phoneNumber);
        storeUser(newUser);
        setUser(newUser);
        return true;
      }

      return false;
    },
    [],
  );

  // ============================================
  // Derived State
  // ============================================
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
    [user, isLoading, isAuthenticated, login, submitStoreRequest, logout, sendOtp, verifyOtp, getAccessToken, refreshToken, error, clearError],
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
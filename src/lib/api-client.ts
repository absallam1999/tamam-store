import { getApiUrl, ENDPOINTS } from "@/config/api";

// ═════════════════════════════════════════════════════════════════════
// Server envelope — matches ApiResponse<T> on the server
// (returned by ApiResponseWrapperFilter for every controller response)
// ═════════════════════════════════════════════════════════════════════
interface ServerEnvelope<T> {
  success: boolean;
  message?: string | null;
  data: T;
  errors?: string[];
}

// ═════════════════════════════════════════════════════════════════════
// What this client returns — .data is the unwrapped payload
// ═════════════════════════════════════════════════════════════════════
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string | null;
}

// ═════════════════════════════════════════════════════════════════════
// Typed error — carries status + field-level errors for UI display
// ═════════════════════════════════════════════════════════════════════
export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// ═════════════════════════════════════════════════════════════════════
// Query params — scalars only; null/undefined are dropped
// ═════════════════════════════════════════════════════════════════════
export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

interface RequestOptions extends RequestInit {
  params?: QueryParams;
  skipAuth?: boolean;
}

// ═════════════════════════════════════════════════════════════════════
// Token storage
// ═════════════════════════════════════════════════════════════════════
const ACCESS_TOKEN_KEY = "store-access-token";
const REFRESH_TOKEN_KEY = "store-refresh-token";
const USER_DATA_KEY = "store-user-data";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token!);
  });
  failedQueue = [];
}

function getStoredTokens(): {
  accessToken: string;
  refreshToken: string;
} | null {
  try {
    const accessToken =
      localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("token");
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (accessToken && refreshToken) return { accessToken, refreshToken };
    return null;
  } catch {
    return null;
  }
}

function clearAllAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

// ═════════════════════════════════════════════════════════════════════
// Refresh — hits the real path, unwraps the envelope
// ═════════════════════════════════════════════════════════════════════
async function refreshAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens) {
    throw new ApiError("No refresh token available", 401);
  }

  const response = await fetch(getApiUrl(ENDPOINTS.AUTH.REFRESH_TOKEN), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new ApiError("Token refresh failed", response.status);
  }

  const body = await response.json();

  // Server returns { success, data: { token, refreshToken, … } }
  const payload = body?.data ?? body;
  const newToken: string | undefined = payload?.token;
  const newRefreshToken: string | undefined = payload?.refreshToken;

  if (!newToken) {
    throw new ApiError("No token in refresh response", 500);
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
  if (newRefreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
  }

  return newToken;
}

// ═════════════════════════════════════════════════════════════════════
// Client
// ═════════════════════════════════════════════════════════════════════
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, skipAuth, ...fetchOptions } = options;

    // ── 1. Build URL with query string ─────────────────────────────
    let url = getApiUrl(endpoint);

    if (params) {
      const usp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) continue;
        usp.append(key, String(value));
      }
      const qs = usp.toString();
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }

    // ── 2. Headers — Content-Type only for non-FormData ────────────
    const isFormData = fetchOptions.body instanceof FormData;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("token");

    if (token && !skipAuth) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
      // Harmless for bearer-only auth; kept for forward-compat if the
      // backend adds cookie-based flows later.
      credentials: "include",
    };

    // ── 3. Execute ────────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new ApiError("Network error: unable to reach the server", 0);
      }
      throw error;
    }

    // ── 4. Retry once on 401 (unless we're already the refresh call) ──
    if (response.status === 401 && !skipAuth) {
      if (endpoint === ENDPOINTS.AUTH.REFRESH_TOKEN) {
        clearAllAuth();
        this.redirectToLogin();
        throw new ApiError("Session expired. Please log in again.", 401);
      }

      if (isRefreshing) {
        try {
          const newToken = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });

          headers["Authorization"] = `Bearer ${newToken}`;
          const retry = await fetch(url, { ...config, headers });
          return this.handleResponse<T>(retry);
        } catch {
          clearAllAuth();
          this.redirectToLogin();
          throw new ApiError("Session expired. Please log in again.", 401);
        }
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        headers["Authorization"] = `Bearer ${newToken}`;
        const retry = await fetch(url, { ...config, headers });
        return this.handleResponse<T>(retry);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAllAuth();
        this.redirectToLogin();
        throw new ApiError("Session expired. Please log in again.", 401);
      } finally {
        isRefreshing = false;
      }
    }

    return this.handleResponse<T>(response);
  }

  // ═════════════════════════════════════════════════════════════════
  // Response handling — unwraps the server envelope
  // ═════════════════════════════════════════════════════════════════
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 204) {
      return { data: null as T, status: 204 };
    }

    // Read body once — used by both error and success paths
    const text = await response.text();
    let parsed: unknown = null;

    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    // ── Error path ────────────────────────────────────────────────
    if (!response.ok) {
      const envelope =
        parsed && typeof parsed === "object"
          ? (parsed as Partial<ServerEnvelope<unknown>>)
          : null;

      const message =
        envelope?.message ||
        (typeof parsed === "string" ? parsed : null) ||
        `HTTP ${response.status}`;

      const errors: string[] = Array.isArray(envelope?.errors)
        ? (envelope!.errors as string[])
        : [];

      throw new ApiError(message, response.status, errors);
    }

    // ── Success path — unwrap if it's an envelope ─────────────────
    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      "data" in parsed
    ) {
      const envelope = parsed as ServerEnvelope<T>;
      return {
        data: envelope.data,
        status: response.status,
        message: envelope.message,
      };
    }

    // Raw payload (defensive fallback — the wrapper filter guarantees
    // every controller response is an envelope, so this branch is
    // only reached for non-controller endpoints like /swagger).
    return { data: parsed as T, status: response.status };
  }

  private redirectToLogin() {
    const path = window.location.pathname;
    if (!path.includes("/auth/login") && !path.includes("/login")) {
      window.location.href = "/auth/login";
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // Body serialization — FormData passes through untouched
  // ═════════════════════════════════════════════════════════════════
  private buildBody(body: unknown): BodyInit | undefined {
    if (body === undefined) return undefined;
    if (body instanceof FormData) return body;
    if (body instanceof Blob) return body;
    if (body instanceof URLSearchParams) return body;
    if (body instanceof ArrayBuffer) return body;
    if (typeof body === "string") return body;
    return JSON.stringify(body);
  }

  // ═════════════════════════════════════════════════════════════════
  // Public verbs
  // ═════════════════════════════════════════════════════════════════
  async get<T>(
    endpoint: string,
    params?: QueryParams,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", params, skipAuth });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: this.buildBody(body),
      skipAuth,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: this.buildBody(body),
      skipAuth,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: this.buildBody(body),
      skipAuth,
    });
  }

  async delete<T>(
    endpoint: string,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", skipAuth });
  }
}

export const apiClient = new ApiClient();
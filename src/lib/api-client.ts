import { getApiUrl } from "@/config/api";

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

// ============================================
// Token management
// ============================================

const ACCESS_TOKEN_KEY = "store-access-token";
const REFRESH_TOKEN_KEY = "store-refresh-token";
const USER_DATA_KEY = "store-user-data";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
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
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
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

async function refreshAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens) {
    throw new Error("No tokens available");
  }

  const response = await fetch(getApiUrl("/api/Auth/refresh"), {
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
  const inner = data?.data || data;
  const newToken = inner?.token || inner?.accessToken || data?.token;
  const newRefreshToken = inner?.refreshToken || data?.refreshToken;

  if (newToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    if (newRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }
    return newToken;
  }

  throw new Error("No token in refresh response");
}

// ============================================
// API Client
// ============================================

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, skipAuth, ...fetchOptions } = options;

    let url = getApiUrl(endpoint);

    if (params) {
      const urlObj = new URL(url, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
      });
      url = urlObj.toString();
    }

    // Check if body is FormData - if so, DON'T set Content-Type
    const isFormData = fetchOptions.body instanceof FormData;

    const defaultHeaders: Record<string, string> = {
      Accept: "application/json",
    };

    // Only add Content-Type for non-FormData requests
    if (!isFormData) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("token");

    if (token && !skipAuth) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Merge headers - fetchOptions.headers override defaults
    const mergedHeaders: Record<string, string> = {
      ...defaultHeaders,
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    // For FormData, ensure Content-Type is removed (browser sets it automatically)
    if (isFormData) {
      delete mergedHeaders["Content-Type"];
      delete mergedHeaders["content-type"];
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers: mergedHeaders,
      credentials: "include",
    };

    try {
      console.log("🔍 API Request:", {
        url,
        method: config.method,
        headers: mergedHeaders,
        isFormData,
        bodyType: fetchOptions.body?.constructor?.name,
      });

      const response = await fetch(url, config);

      // ============================================
      // Handle 401 - Attempt token refresh
      // ============================================
      if (response.status === 401 && !skipAuth) {
        if (endpoint.includes("/Auth/refresh")) {
          clearAllAuth();
          this.redirectToLogin();
          throw new Error("Session expired. Please login again.");
        }

        if (isRefreshing) {
          try {
            const newToken = await new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });

            mergedHeaders["Authorization"] = `Bearer ${newToken}`;

            const retryResponse = await fetch(url, {
              ...config,
              headers: mergedHeaders,
            });

            return this.handleResponse<T>(retryResponse);
          } catch {
            clearAllAuth();
            this.redirectToLogin();
            throw new Error("Session expired. Please login again.");
          }
        }

        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);

          mergedHeaders["Authorization"] = `Bearer ${newToken}`;

          const retryResponse = await fetch(url, {
            ...config,
            headers: mergedHeaders,
          });

          return this.handleResponse<T>(retryResponse);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearAllAuth();
          this.redirectToLogin();
          throw new Error("Session expired. Please login again.");
        } finally {
          isRefreshing = false;
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Network error: Unable to connect to the server");
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          errorData?.Message ||
          `HTTP error! status: ${response.status}`,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: null as T, status: 204 };
    }

    // Check if response has a body
    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type");
    const hasBody =
      contentLength !== "0" && contentType?.includes("application/json");

    if (!hasBody) {
      return { data: null as T, status: response.status };
    }

    const data = await response.json();
    return { data, status: response.status };
  }

  private redirectToLogin() {
    if (
      !window.location.pathname.includes("/auth/login") &&
      !window.location.pathname.includes("/login")
    ) {
      window.location.href = "/auth/login";
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", params, skipAuth });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    skipAuth?: boolean,
  ): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;

    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
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
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "@app/providers/AuthProvider";
import { apiClient, ApiError } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type { StoreProfileDto, UpdateStoreProfileDto } from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════

export type StoreProfile = StoreProfileDto;

interface StoreContextValue {
  store: StoreProfile | null;
  isLoading: boolean;

  // Derived
  isOpen: boolean;
  isBusy: boolean;
  isActive: boolean;

  // Mutations
  toggleStoreStatus: () => Promise<void>;
  toggleStoreBusy: () => Promise<void>;
  updateStore: (dto: UpdateStoreProfileDto) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  uploadCover: (file: File) => Promise<void>;
  refreshStore: () => Promise<void>;

  // Meta
  error: string | null;
  clearError: () => void;
  getStoreName: () => string;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

// ═════════════════════════════════════════════════════════════════════
// Provider
// ═════════════════════════════════════════════════════════════════════

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ══════════════════════════════════════════════════════════════════
  // Derived state
  // ══════════════════════════════════════════════════════════════════
  const isOpen = store?.isOpen ?? false;
  const isBusy = store?.isBusy ?? false;
  const isActive = store?.verificationStatus === "Approved";

  const getStoreName = useCallback(
    (): string => store?.nameEn ?? store?.nameAr ?? "",
    [store],
  );

  // ══════════════════════════════════════════════════════════════════
  // Fetch
  // ══════════════════════════════════════════════════════════════════
  const fetchStore = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<StoreProfile>(
        ENDPOINTS.STORE.PROFILE,
      );
      setStore(data);
    } catch (err) {
      // 401 already handled by api-client (redirect).
      if (!(err instanceof ApiError) || err.status !== 401) {
        setError(err instanceof Error ? err.message : "Failed to load store");
      }
      setStore(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStore = useCallback(async (): Promise<void> => {
    await fetchStore();
  }, [fetchStore]);

  // ══════════════════════════════════════════════════════════════════
  // Toggle open/closed
  // ══════════════════════════════════════════════════════════════════
  const toggleStoreStatus = useCallback(async (): Promise<void> => {
    if (!store) return;

    const previous = store;
    const newIsOpen = !store.isOpen;

    // Optimistic
    setStore((prev) => (prev ? { ...prev, isOpen: newIsOpen } : prev));

    try {
      const { data } = await apiClient.patch<StoreProfile>(
        ENDPOINTS.STORE.TOGGLE_OPEN,
        { isOpen: newIsOpen },
      );
      setStore(data); // Authoritative from server
    } catch (err) {
      setStore(previous); // Rollback
      setError(err instanceof Error ? err.message : "Failed to toggle store");
      throw err; // Let callers surface a toast / retry
    }
  }, [store]);

  // ══════════════════════════════════════════════════════════════════
  // Toggle busy/unbusy
  // ══════════════════════════════════════════════════════════════════
  const toggleStoreBusy = useCallback(async (): Promise<void> => {
    if (!store) return;

    const previous = store;
    const newIsBusy = !store.isBusy;

    // Optimistic
    setStore((prev) => (prev ? { ...prev, isBusy: newIsBusy } : prev));

    try {
      const { data } = await apiClient.patch<StoreProfile>(
        ENDPOINTS.STORE.TOGGLE_BUSY,
        { isBusy: newIsBusy },
      );
      setStore(data); // Authoritative from server
    } catch (err) {
      setStore(previous); // Rollback
      setError(err instanceof Error ? err.message : "Failed to toggle busy");
      throw err; // Let callers surface a toast / retry
    }
  }, [store]);

  // ══════════════════════════════════════════════════════════════════
  // Update profile
  // ══════════════════════════════════════════════════════════════════
  const updateStore = useCallback(
    async (dto: UpdateStoreProfileDto): Promise<void> => {
      if (!store) return;

      setError(null);

      try {
        const { data } = await apiClient.put<StoreProfile>(
          ENDPOINTS.STORE.PROFILE,
          dto,
        );
        setStore(data);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to update store";
        setError(message);
        throw err; // Let form handlers show field errors
      }
    },
    [store],
  );

  // ══════════════════════════════════════════════════════════════════
  // Asset uploads
  // ══════════════════════════════════════════════════════════════════
  const uploadLogo = useCallback(async (file: File): Promise<void> => {
    setError(null);

    try {
      // 1. Upload to file store
      const formData = new FormData();
      formData.append("file", file);

      const { data: uploaded } = await apiClient.post<{ url: string }>(
        ENDPOINTS.FILES.UPLOAD_WITH_CATEGORY("store-logos"),
        formData,
      );

      // 2. Attach to store profile
      const { data: updated } = await apiClient.put<StoreProfile>(
        ENDPOINTS.STORE.LOGO,
        { imageUrl: uploaded.url },
      );

      setStore(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload logo";
      setError(message);
      throw err;
    }
  }, []);

  const uploadCover = useCallback(async (file: File): Promise<void> => {
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: uploaded } = await apiClient.post<{ url: string }>(
        ENDPOINTS.FILES.UPLOAD_WITH_CATEGORY("store-covers"),
        formData,
      );

      const { data: updated } = await apiClient.put<StoreProfile>(
        ENDPOINTS.STORE.COVER,
        { imageUrl: uploaded.url },
      );

      setStore(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload cover";
      setError(message);
      throw err;
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // Load on auth
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isAuthenticated) {
      fetchStore();
    } else {
      setStore(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchStore]);

  // ══════════════════════════════════════════════════════════════════
  // Context value
  // ══════════════════════════════════════════════════════════════════
  const contextValue = useMemo<StoreContextValue>(
    () => ({
      store,
      isLoading,
      isOpen,
      isBusy,
      isActive,
      toggleStoreStatus,
      toggleStoreBusy,
      updateStore,
      uploadLogo,
      uploadCover,
      refreshStore,
      error,
      clearError,
      getStoreName,
    }),
    [
      store,
      isLoading,
      isOpen,
      isBusy,
      isActive,
      toggleStoreStatus,
      toggleStoreBusy,
      updateStore,
      uploadLogo,
      uploadCover,
      refreshStore,
      error,
      clearError,
      getStoreName,
    ],
  );

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextValue => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a <StoreProvider>.");
  }
  return context;
};

export default StoreProvider;
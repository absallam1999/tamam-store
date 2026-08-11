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
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";

// ============================================================
// Types
// ============================================================

export interface StoreProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  email?: string;
  phoneNumber?: string;
  logoUrl?: string;
  coverUrl?: string;
  streetAr?: string;
  streetEn?: string;
  cityId?: string;
  city?: string;
  latitude: number;
  longitude: number;
  openingTime?: string;
  closingTime?: string;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedPreparationMinutes: number;
  isOpen: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
}

interface StoreContextValue {
  store: StoreProfile | null;
  isLoading: boolean;
  isOpen: boolean;
  isActive: boolean;
  toggleStoreStatus: () => Promise<void>;
  refreshStore: () => Promise<void>;
  updateStore: (dto: Partial<StoreProfile>) => Promise<void>;
  error: string | null;
  getStoreName: () => string;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

// ============================================================
// Helpers
// ============================================================

/**
 * Unwraps the API response wrapper { success, data, message, ... }
 */
function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

// ============================================================
// Provider
// ============================================================

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const isOpen = store?.isOpen ?? false;
  const isActive = store?.isVerified ?? false;

  const getStoreName = useCallback((): string => {
    return store?.nameEn ?? store?.nameAr ?? "";
  }, [store]);

  // ============================================================
  // Fetch Store Profile
  // ============================================================
  const fetchStore = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<StoreProfile>(
        ENDPOINTS.STORE.PROFILE,
      );
      const profile = unwrap<StoreProfile>(response.data);
      if (profile) {
        setStore(profile);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load store data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStore = useCallback(async (): Promise<void> => {
    await fetchStore();
  }, [fetchStore]);

  // ============================================================
  // Toggle Store Open/Closed
  // ============================================================
  const toggleStoreStatus = useCallback(async (): Promise<void> => {
    if (!store) return;
    const newIsOpen = !store.isOpen;

    // Optimistic update
    setStore((prev) => (prev ? { ...prev, isOpen: newIsOpen } : prev));

    try {
      await apiClient.patch(ENDPOINTS.STORE.TOGGLE_OPEN, { isOpen: newIsOpen });
    } catch {
      // Rollback on failure
      setStore((prev) => (prev ? { ...prev, isOpen: !newIsOpen } : prev));
    }
  }, [store]);

  // ============================================================
  // Update Store Profile
  // ============================================================
  const updateStore = useCallback(
    async (dto: Partial<StoreProfile>): Promise<void> => {
      if (!store) return;

      // Optimistic update
      const previous = { ...store };
      setStore((prev) => (prev ? { ...prev, ...dto } : prev));

      try {
        const response = await apiClient.put<StoreProfile>(
          ENDPOINTS.STORE.PROFILE,
          dto,
        );
        const updated = unwrap<StoreProfile>(response.data);
        if (updated) {
          setStore(updated);
        }
      } catch {
        // Rollback
        setStore(previous);
      }
    },
    [store],
  );

  // ============================================================
  // Load store on auth
  // ============================================================
  useEffect(() => {
    if (isAuthenticated) {
      fetchStore();
    } else {
      setStore(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchStore]);

  // ============================================================
  // Context Value
  // ============================================================
  const contextValue = useMemo<StoreContextValue>(
    () => ({
      store,
      isLoading,
      isOpen,
      isActive,
      toggleStoreStatus,
      refreshStore,
      updateStore,
      error,
      getStoreName,
    }),
    [
      store,
      isLoading,
      isOpen,
      isActive,
      toggleStoreStatus,
      refreshStore,
      updateStore,
      error,
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

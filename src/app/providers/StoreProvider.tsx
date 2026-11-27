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
import { storeApi } from "@/config/store.api";
import { ApiError } from "@/lib/api-client";
import type { StoreProfileDto, UpdateStoreProfileDto } from "@shared/types";

export type StoreProfile = StoreProfileDto;

interface StoreContextValue {
  store: StoreProfile | null;
  isLoading: boolean;
  isOpen: boolean;
  isBusy: boolean;
  isActive: boolean;
  toggleStoreStatus: () => Promise<void>;
  toggleStoreBusy: () => Promise<void>;
  updateStore: (dto: UpdateStoreProfileDto) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  uploadCover: (file: File) => Promise<void>;
  refreshStore: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  getStoreName: () => string;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const isOpen = store?.isOpen ?? false;
  const isBusy = store?.isBusy ?? false;
  const isActive = store?.verificationStatus === "Verified";

  const getStoreName = useCallback(
    (): string => store?.nameEn ?? store?.nameAr ?? "",
    [store],
  );

  const fetchStore = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await storeApi.profile.get();
      setStore(data);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        setError(err instanceof Error ? err.message : "Failed to load store");
      }
      setStore(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStore = useCallback(
    (): Promise<void> => fetchStore(),
    [fetchStore],
  );

  const toggleStoreStatus = useCallback(async (): Promise<void> => {
    if (!store) return;
    const previous = store;
    const newIsOpen = !store.isOpen;

    setStore((prev) => (prev ? { ...prev, isOpen: newIsOpen } : prev));

    try {
      const updated = await storeApi.profile.toggleOpen(newIsOpen);
      setStore(updated);
    } catch (err) {
      setStore(previous);
      setError(err instanceof Error ? err.message : "Failed to toggle store");
      throw err;
    }
  }, [store]);

  const toggleStoreBusy = useCallback(async (): Promise<void> => {
    if (!store) return;
    const previous = store;
    const newIsBusy = !store.isBusy;

    setStore((prev) => (prev ? { ...prev, isBusy: newIsBusy } : prev));

    try {
      const updated = await storeApi.profile.toggleBusy(newIsBusy);
      setStore(updated);
    } catch (err) {
      setStore(previous);
      setError(err instanceof Error ? err.message : "Failed to toggle busy");
      throw err;
    }
  }, [store]);

  const updateStore = useCallback(
    async (dto: UpdateStoreProfileDto): Promise<void> => {
      if (!store) return;
      setError(null);
      try {
        const updated = await storeApi.profile.update(dto);
        setStore(updated);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to update store";
        setError(message);
        throw err;
      }
    },
    [store],
  );

  const uploadLogo = useCallback(async (file: File): Promise<void> => {
    setError(null);
    try {
      const updated = await storeApi.profile.uploadLogo(file);
      setStore(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
      throw err;
    }
  }, []);

  const uploadCover = useCallback(async (file: File): Promise<void> => {
    setError(null);
    try {
      const updated = await storeApi.profile.uploadCover(file);
      setStore(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover");
      throw err;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStore();
    } else {
      setStore(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchStore]);

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
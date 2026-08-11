import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StoreProfileDto, UpdateStoreProfileDto } from "../types";
import { storeApi } from "../../config/storeApi";
import { ENDPOINTS } from "@/config/api";

export const STORE_PROFILE_KEY = "storeProfile";

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

// Default empty profile to show when API fails
const EMPTY_PROFILE: StoreProfileDto = {
  id: "",
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  email: "",
  phoneNumber: "",
  logoUrl: "",
  coverImageUrl: "",
  streetAr: "",
  streetEn: "",
  cityId: "",
  city: "",
  latitude: 0,
  longitude: 0,
  openingTime: "",
  closingTime: "",
  minimumOrderAmount: 0,
  deliveryFee: 0,
  estimatedPreparationMinutes: 15,
  isOpen: false,
  isVerified: false,
  rating: 0,
  reviewCount: 0,
};

// ============================================================
// Queries
// ============================================================

export const useStoreProfile = () => {
  return useQuery<StoreProfileDto>({
    queryKey: [STORE_PROFILE_KEY],
    queryFn: async () => {
      try {
        const response = await storeApi.getProfile();
        const data = unwrap<any>(response);

        // If data is null/undefined or missing id, return empty profile
        if (!data || !data.id) {
          console.warn("⚠️ Profile returned null/empty, using defaults");
          return EMPTY_PROFILE;
        }

        return data as StoreProfileDto;
      } catch (error: any) {
        // If 500 error, return empty profile instead of throwing
        console.error("❌ Profile fetch failed:", error?.message || error);
        return EMPTY_PROFILE;
      }
    },
    staleTime: 0, // Don't cache - always refetch
    refetchOnMount: true,
    retry: false, // Don't retry on failure
  });
};

// ============================================================
// Mutations
// ============================================================

export const useUpdateStoreProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateStoreProfileDto) => {
      const response = await storeApi.updateProfile(dto);
      return unwrap<StoreProfileDto>(response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<StoreProfileDto>([STORE_PROFILE_KEY], data);
    },
  });
};

export const useToggleStoreOpen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isOpen: boolean) => {
      await storeApi.toggleOpen(isOpen);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORE_PROFILE_KEY] });
    },
  });
};

export const useUpdateLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("store-access-token");
      const response = await fetch(`${baseUrl}${ENDPOINTS.STORE.LOGO}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORE_PROFILE_KEY] });
    },
  });
};

export const useUpdateCover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("store-access-token");
      const response = await fetch(`${baseUrl}${ENDPOINTS.STORE.COVER}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORE_PROFILE_KEY] });
    },
  });
};

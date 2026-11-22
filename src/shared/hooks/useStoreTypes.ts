import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  CategoryWithTypesDto,
  PublicStoreCategoryDto,
  StoreTypeListDto,
  StoreTypeProfileDto,
} from "@shared/types";
import { STORE_PROFILE_KEY } from "./useStoreProfile";

// ============================================================
// Query Keys
// ============================================================

export const STORE_TYPES_KEY = "storeTypes";
export const AVAILABLE_STORE_TYPES_KEY = "availableStoreTypes";
export const GROUPED_STORE_TYPES_KEY = "groupedStoreTypes";
export const STORE_CATEGORIES_KEY = "storeCategories";
export const PUBLIC_STORE_CATEGORIES_KEY = "publicStoreCategories";

// ============================================================
// Queries
// ============================================================

export function useMyTypeApplications() {
  return useQuery<StoreTypeProfileDto[]>({
    queryKey: [STORE_TYPES_KEY],
    queryFn: () => storeApi.storeTypes.getMyApplications(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAvailableStoreTypes(categoryId?: string) {
  return useQuery<StoreTypeListDto[]>({
    queryKey: [AVAILABLE_STORE_TYPES_KEY, categoryId ?? null],
    queryFn: () =>
      categoryId
        ? storeApi.storeTypes.getAvailableByCategory(categoryId)
        : storeApi.storeTypes.getAvailable(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupedStoreTypes() {
  return useQuery<CategoryWithTypesDto[]>({
    queryKey: [GROUPED_STORE_TYPES_KEY],
    queryFn: () => storeApi.storeTypes.getGrouped(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * GET /api/browse/store-categories
 */
export function usePublicStoreCategories() {
  return useQuery<PublicStoreCategoryDto[]>({
    queryKey: [PUBLIC_STORE_CATEGORIES_KEY],
    queryFn: () =>
      storeApi.storeTypes.getCategories() as Promise<PublicStoreCategoryDto[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export const useStoreCategories = usePublicStoreCategories;

// ============================================================
// Mutations
// ============================================================

export function useAddStoreType() {
  const qc = useQueryClient();
  return useMutation<StoreTypeProfileDto, Error, string>({
    mutationFn: (storeTypeId) => storeApi.storeTypes.requestType(storeTypeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORE_PROFILE_KEY] });
      qc.invalidateQueries({ queryKey: [STORE_TYPES_KEY] });
    },
  });
}

export function useRemoveStoreType() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (mappingId) =>
      storeApi.storeTypes.cancelApplication(mappingId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORE_PROFILE_KEY] });
      qc.invalidateQueries({ queryKey: [STORE_TYPES_KEY] });
    },
  });
}
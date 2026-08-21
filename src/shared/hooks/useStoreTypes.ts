import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { StoreTypeMappingDto, StoreTypeDto, StoreCategoryDto } from "../types";
import { storeApi } from "../../config/storeApi";

export const STORE_TYPES_KEY = "storeTypes";
export const AVAILABLE_STORE_TYPES_KEY = "availableStoreTypes";
export const STORE_CATEGORIES_KEY = "storeCategories";
export const PUBLIC_STORE_CATEGORIES_KEY = "publicStoreCategories";

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

// ============================================================
// Queries
// ============================================================

/**
 * Fetch the store's current approved + pending types
 */
export const useStoreTypes = () => {
  return useQuery<StoreTypeMappingDto[]>({
    queryKey: [STORE_TYPES_KEY],
    queryFn: async () => {
      const response = await storeApi.getStoreTypes();
      const data = unwrap<any>(response);
      if (data?.items) return data.items as StoreTypeMappingDto[];
      if (Array.isArray(data)) return data as StoreTypeMappingDto[];
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch available categories (GET /api/store/categories/available)
 * Used in authenticated store dashboard.
 */
export const useStoreCategories = () => {
  return useQuery<StoreCategoryDto[]>({
    queryKey: [STORE_CATEGORIES_KEY],
    queryFn: async () => {
      const response = await storeApi.getAvailableCategories();
      const data = unwrap<any>(response);
      if (data?.items) return data.items as StoreCategoryDto[];
      if (Array.isArray(data)) return data as StoreCategoryDto[];
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch public store categories (GET /api/browse/store-categories)
 * No authentication required — used on the registration page.
 */
export const usePublicStoreCategories = () => {
  return useQuery<StoreCategoryDto[]>({
    queryKey: [PUBLIC_STORE_CATEGORIES_KEY],
    queryFn: async () => {
      const response = await storeApi.getPublicStoreCategories();
      const data = unwrap<any>(response);
      if (data?.items) return data.items as StoreCategoryDto[];
      if (Array.isArray(data)) return data as StoreCategoryDto[];
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch available store types, optionally filtered by category
 * GET /api/store/types/available?categoryId={categoryId}
 */
export const useAvailableStoreTypes = (categoryId?: string) => {
  return useQuery<StoreTypeDto[]>({
    queryKey: [AVAILABLE_STORE_TYPES_KEY, categoryId],
    queryFn: async () => {
      const response = categoryId
        ? await storeApi.getAvailableStoreTypesByCategory(categoryId)
        : await storeApi.getAvailableStoreTypes();
      const data = unwrap<any>(response);
      if (data?.items) return data.items as StoreTypeDto[];
      if (Array.isArray(data)) return data as StoreTypeDto[];
      return [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================
// Mutations
// ============================================================

export const useAddStoreType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storeTypeId: string) => {
      const response = await storeApi.addStoreType(storeTypeId);
      return unwrap<void>(response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORE_TYPES_KEY] });
      qc.invalidateQueries({ queryKey: ["store"] });
    },
  });
};

export const useRemoveStoreType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mappingId: string) => {
      const response = await storeApi.removeStoreType(mappingId);
      return unwrap<void>(response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORE_TYPES_KEY] });
      qc.invalidateQueries({ queryKey: ["store"] });
    },
  });
};
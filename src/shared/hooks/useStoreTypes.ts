import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoreTypeMappingDto, StoreTypeDto } from '../types';
import { storeApi } from '../../config/storeApi';

export const STORE_TYPES_KEY = 'storeTypes';
export const AVAILABLE_STORE_TYPES_KEY = 'availableStoreTypes';

/**
 * Unwraps the API response wrapper
 */
function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

// ============================================================
// Queries
// ============================================================

export const useStoreTypes = () => {
  return useQuery<StoreTypeMappingDto[]>({
    queryKey: [STORE_TYPES_KEY],
    queryFn: async () => {
      const response = await storeApi.getStoreTypes();
      const data = unwrap<any>(response);
      // Handle different response structures
      if (data?.items) return data.items as StoreTypeMappingDto[];
      if (Array.isArray(data)) return data as StoreTypeMappingDto[];
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAvailableStoreTypes = () => {
  return useQuery<StoreTypeDto[]>({
    queryKey: [AVAILABLE_STORE_TYPES_KEY],
    queryFn: async () => {
      const response = await storeApi.getAvailableStoreTypes();
      const data = unwrap<any>(response);
      // Handle different response structures
      if (data?.items) return data.items as StoreTypeDto[];
      if (Array.isArray(data)) return data as StoreTypeDto[];
      return [];
    },
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
      qc.invalidateQueries({ queryKey: ['store'] }); // Also refresh store profile
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
      qc.invalidateQueries({ queryKey: ['store'] }); // Also refresh store profile
    },
  });
};
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CouponDto, CreateCouponDto, UpdateCouponDto } from "../types";
import { storeApi } from "../../config/storeApi";

export const COUPONS_KEY = "storeCoupons";

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object") {
    // Check if response has a 'data' property (axios response)
    const resp = response as Record<string, unknown>;
    if ("data" in resp) {
      return resp.data as T;
    }
  }
  return response as T;
}

// Helper to check if API response indicates an error
function checkApiError(response: any): never | void {
  // Handle axios response wrapper - check response.data for API errors
  const apiResponse = response?.data || response;
  
  // Check both PascalCase and camelCase
  const isSuccess = apiResponse?.Success ?? apiResponse?.success;
  
  if (isSuccess === false) {
    // Extract the best error message
    const message = apiResponse?.Message || 
                   apiResponse?.message || 
                   (apiResponse?.Errors && apiResponse.Errors[0]) ||
                   (apiResponse?.errors && apiResponse.errors[0]) ||
                   "An error occurred";
    
    throw new Error(message);
  }
}

export const useCoupons = () => {
  return useQuery<CouponDto[]>({
    queryKey: [COUPONS_KEY],
    queryFn: async () => {
      const response = await storeApi.getCoupons();
      const data = unwrap<any>(response);
      
      // Handle different response structures
      if (data?.items) return data.items as CouponDto[];
      if (Array.isArray(data)) return data as CouponDto[];
      if (data?.data?.items) return data.data.items as CouponDto[];
      if (Array.isArray(data?.data)) return data.data as CouponDto[];
      
      return [];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCoupon = (couponId: string) => {
  return useQuery<CouponDto>({
    queryKey: [COUPONS_KEY, couponId],
    queryFn: async () => {
      const response = await storeApi.getCoupon(couponId);
      return unwrap<CouponDto>(response);
    },
    enabled: !!couponId,
  });
};

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCouponDto) => {
      const response = await storeApi.createCoupon(dto);
      
      // Check the response for API errors (checks both response and response.data)
      checkApiError(response);
      
      return unwrap<CouponDto>(response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COUPONS_KEY] });
    },
    onError: (error: Error) => {
      console.error("Create coupon failed:", error.message);
    },
  });
};

export const useUpdateCoupon = (couponId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateCouponDto) => {
      const response = await storeApi.updateCoupon(couponId, dto);
      
      // Check the response for API errors
      checkApiError(response);
      
      return unwrap<CouponDto>(response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COUPONS_KEY] });
      qc.invalidateQueries({ queryKey: [COUPONS_KEY, couponId] });
    },
    onError: (error: Error) => {
      console.error("Update coupon failed:", error.message);
    },
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (couponId: string) => {
      const response = await storeApi.deleteCoupon(couponId);
      
      // Check the response for API errors
      checkApiError(response);
      
      return unwrap<void>(response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COUPONS_KEY] });
    },
    onError: (error: Error) => {
      console.error("Delete coupon failed:", error.message);
    },
  });
};

export const useToggleCouponActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (couponId: string) => {
      const response = await storeApi.toggleCouponActive(couponId);
      
      // Check the response for API errors
      checkApiError(response);
      
      return unwrap<void>(response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COUPONS_KEY] });
    },
    onError: (error: Error) => {
      console.error("Toggle coupon failed:", error.message);
    },
  });
};
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  StoreCouponDto,
  CreateCouponDto,
  UpdateCouponDto,
} from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Query keys
// ═════════════════════════════════════════════════════════════════════
export const COUPONS_KEY = "storeCoupons";

export const couponKeys = {
  all: [COUPONS_KEY] as const,
  list: () => [COUPONS_KEY, "list"] as const,
  detail: (id: string) => [COUPONS_KEY, "detail", id] as const,
};

// ═════════════════════════════════════════════════════════════════════
// Queries
// ═════════════════════════════════════════════════════════════════════

export function useCoupons() {
  return useQuery<StoreCouponDto[]>({
    queryKey: couponKeys.list(),
    queryFn: () => storeApi.coupons.list(),
    staleTime: 60_000,
  });
}

export function useCoupon(couponId: string | undefined) {
  return useQuery<StoreCouponDto>({
    queryKey: couponKeys.detail(couponId ?? ""),
    queryFn: () => storeApi.coupons.get(couponId!),
    enabled: Boolean(couponId),
    staleTime: 60_000,
  });
}

// ═════════════════════════════════════════════════════════════════════
// Mutations
// ═════════════════════════════════════════════════════════════════════

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation<StoreCouponDto, Error, CreateCouponDto>({
    mutationFn: (dto) => storeApi.coupons.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

/**
 * Update
 */
export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreCouponDto,
    Error,
    { couponId: string; dto: UpdateCouponDto }
  >({
    mutationFn: ({ couponId, dto }) => storeApi.coupons.update(couponId, dto),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        couponKeys.detail(variables.couponId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: couponKeys.list() });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (couponId) => {
      await storeApi.coupons.remove(couponId);
    },
    onSuccess: (_data, couponId) => {
      queryClient.removeQueries({ queryKey: couponKeys.detail(couponId) });
      queryClient.invalidateQueries({ queryKey: couponKeys.list() });
    },
  });
}

/**
 * Toggle availability
 */
export function useToggleCoupon() {
  const queryClient = useQueryClient();

  return useMutation<StoreCouponDto, Error, string>({
    mutationFn: (couponId) => storeApi.coupons.toggle(couponId),
    onSuccess: (updated, couponId) => {
      queryClient.setQueryData(couponKeys.detail(couponId), updated);
      queryClient.setQueryData<StoreCouponDto[]>(
        couponKeys.list(),
        (prev) =>
          prev?.map((c) => (c.id === couponId ? updated : c)) ?? [],
      );
    },
  });
}
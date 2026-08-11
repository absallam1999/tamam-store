import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GroupDealDto, CreateGroupDealDto, UpdateGroupDealDto } from "../types";
import { storeApi } from "../../config/storeApi";

export const GROUP_DEALS_KEY = "storeGroupDeals";

function unwrap<T>(response: unknown): T {
  if (response === null || response === undefined || response === "") {
    return undefined as unknown as T;
  }

  if (response && typeof response === "object" && "data" in response) {
    const data = (response as Record<string, unknown>).data;
    return data as T;
  }

  return response as T;
}

// ============================================================
// Queries
// ============================================================

export const useGroupDeals = () => {
  return useQuery<GroupDealDto[]>({
    queryKey: [GROUP_DEALS_KEY],
    queryFn: async () => {
      const response = await storeApi.getGroupDeals();
      console.log("Raw group deals response:", response);
      const data = unwrap<any>(response);
      console.log("Unwrapped group deals data:", data);
      if (data?.items) {
        console.log("Group deals items:", data.items);
        return data.items as GroupDealDto[];
      }
      if (Array.isArray(data)) return data as GroupDealDto[];
      return [];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useGroupDeal = (dealId: string) => {
  return useQuery<GroupDealDto>({
    queryKey: [GROUP_DEALS_KEY, dealId],
    queryFn: async () => {
      const response = await storeApi.getGroupDeal(dealId);
      return unwrap<GroupDealDto>(response);
    },
    enabled: !!dealId,
  });
};

// ============================================================
// Mutations
// ============================================================

export const useCreateGroupDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateGroupDealDto) => {
      const response = await storeApi.createGroupDeal(dto);
      return unwrap<GroupDealDto>(response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [GROUP_DEALS_KEY] }),
  });
};

export const useUpdateGroupDeal = (dealId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateGroupDealDto) => {
      const response = await storeApi.updateGroupDeal(dealId, dto);
      return unwrap<GroupDealDto>(response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUP_DEALS_KEY] });
      qc.invalidateQueries({ queryKey: [GROUP_DEALS_KEY, dealId] });
    },
  });
};

export const useDeleteGroupDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dealId: string) => {
      await storeApi.deleteGroupDeal(dealId);
      // API returns 200 with no body – just return void
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [GROUP_DEALS_KEY] }),
  });
};

// ============================================================
// Note: If you need toggle active for group deals, add it here
// ============================================================

// Optional: Toggle active status (if endpoint exists)
// export const useToggleGroupDealActive = () => {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (dealId: string) => {
//       await storeApi.toggleGroupDealActive(dealId);
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: [GROUP_DEALS_KEY] }),
//   });
// };
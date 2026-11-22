import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  OfferDto,
  CreateOfferDto,
  UpdateOfferDto,
} from "@shared/types";

export type GroupDealDto = OfferDto & { type: "GroupDeal" };

export type CreateGroupDealDto = Omit<CreateOfferDto, "type">;

export type UpdateGroupDealDto = Omit<UpdateOfferDto, "type">;

// ═════════════════════════════════════════════════════════════════════
// Query keys
// ═════════════════════════════════════════════════════════════════════

export const GROUP_DEALS_KEY = "storeGroupDeals";

export const groupDealKeys = {
  all: [GROUP_DEALS_KEY] as const,
  list: () => [GROUP_DEALS_KEY, "list"] as const,
  detail: (id: string) => [GROUP_DEALS_KEY, "detail", id] as const,
};

// ═════════════════════════════════════════════════════════════════════
// Guard — narrow OfferDto to GroupDealDto
// ═════════════════════════════════════════════════════════════════════

function assertGroupDeal(offer: OfferDto): GroupDealDto {
  if (offer.type !== "GroupDeal") {
    throw new Error(
      `Expected a GroupDeal offer, got "${offer.type ?? "Standard"}".`,
    );
  }
  return offer as GroupDealDto;
}

/**
 * Derives the `productIds[]` array
 */
function deriveProductIds(
  items: { productId: string }[] | undefined,
): string[] {
  if (!items || items.length === 0) return [];
  return Array.from(
    new Set(items.map((i) => i.productId).filter(Boolean)),
  );
}

// ═════════════════════════════════════════════════════════════════════
// Queries
// ═════════════════════════════════════════════════════════════════════

export function useGroupDeals() {
  return useQuery<GroupDealDto[]>({
    queryKey: groupDealKeys.list(),
    queryFn: async () => {
      const offers = await storeApi.offers.list();
      return offers.filter((o) => o.type === "GroupDeal") as GroupDealDto[];
    },
    staleTime: 60_000,
  });
}

export function useGroupDeal(dealId: string | undefined) {
  return useQuery<GroupDealDto>({
    queryKey: groupDealKeys.detail(dealId ?? ""),
    queryFn: async () => {
      const offer = await storeApi.offers.get(dealId!);
      return assertGroupDeal(offer);
    },
    enabled: Boolean(dealId),
    staleTime: 60_000,
  });
}

// ═════════════════════════════════════════════════════════════════════
// Mutations
// ═════════════════════════════════════════════════════════════════════

export function useCreateGroupDeal() {
  const queryClient = useQueryClient();

  return useMutation<GroupDealDto, Error, CreateGroupDealDto>({
    mutationFn: async (dto) => {
      const productIds = deriveProductIds(dto.items);

      const created = await storeApi.offers.create({
        ...dto,
        type: "GroupDeal",
        productIds: productIds.length > 0 ? productIds : undefined,
      });
      return assertGroupDeal(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROUP_DEALS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["storeOffers"] });
    },
  });
}

/**
 * Update
 */
export function useUpdateGroupDeal() {
  const queryClient = useQueryClient();

  return useMutation<
    GroupDealDto,
    Error,
    { dealId: string; dto: UpdateGroupDealDto }
  >({
    mutationFn: async ({ dealId, dto }) => {
      const updated = await storeApi.offers.update(dealId, {
        ...dto,
        type: "GroupDeal",
      });
      return assertGroupDeal(updated);
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        groupDealKeys.detail(variables.dealId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: groupDealKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["storeOffers"] });
    },
  });
}

export function useDeleteGroupDeal() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (dealId) => {
      await storeApi.offers.remove(dealId);
    },
    onSuccess: (_data, dealId) => {
      queryClient.removeQueries({ queryKey: groupDealKeys.detail(dealId) });
      queryClient.invalidateQueries({ queryKey: groupDealKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["storeOffers"] });
    },
  });
}

/**
 * Toggle active
 */
export function useToggleGroupDeal() {
  const queryClient = useQueryClient();

  return useMutation<GroupDealDto, Error, string>({
    mutationFn: async (dealId) => {
      const updated = await storeApi.offers.toggle(dealId);
      return assertGroupDeal(updated);
    },
    onSuccess: (updated, dealId) => {
      queryClient.setQueryData(groupDealKeys.detail(dealId), updated);
      queryClient.setQueryData<GroupDealDto[]>(
        groupDealKeys.list(),
        (prev) => prev?.map((g) => (g.id === dealId ? updated : g)) ?? [],
      );
      queryClient.invalidateQueries({ queryKey: ["storeOffers"] });
    },
  });
}
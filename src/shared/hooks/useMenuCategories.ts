import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  MenuCategoryDto,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Query keys
// ═════════════════════════════════════════════════════════════════════
export const MENU_CATEGORIES_KEY = "menuCategories";

export const menuCategoryKeys = {
  all: [MENU_CATEGORIES_KEY] as const,
  list: () => [MENU_CATEGORIES_KEY, "list"] as const,
  detail: (id: string) => [MENU_CATEGORIES_KEY, "detail", id] as const,
};

// ═════════════════════════════════════════════════════════════════════
// Queries
// ═════════════════════════════════════════════════════════════════════

export function useMenuCategories() {
  return useQuery<MenuCategoryDto[]>({
    queryKey: menuCategoryKeys.list(),
    queryFn: () => storeApi.menuCategories.list(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMenuCategory(categoryId: string | undefined) {
  return useQuery<MenuCategoryDto>({
    queryKey: menuCategoryKeys.detail(categoryId ?? ""),
    queryFn: () => storeApi.menuCategories.get(categoryId!),
    enabled: Boolean(categoryId),
    staleTime: 2 * 60 * 1000,
  });
}

// ═════════════════════════════════════════════════════════════════════
// Mutations
// ═════════════════════════════════════════════════════════════════════

export function useCreateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation<MenuCategoryDto, Error, CreateMenuCategoryDto>({
    mutationFn: (dto) => storeApi.menuCategories.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all });
    },
  });
}

export function useUpdateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    MenuCategoryDto,
    Error,
    { categoryId: string; dto: UpdateMenuCategoryDto }
  >({
    mutationFn: ({ categoryId, dto }) =>
      storeApi.menuCategories.update(categoryId, dto),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        menuCategoryKeys.detail(variables.categoryId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.list() });
    },
  });
}

export function useDeleteMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (categoryId) => {
      await storeApi.menuCategories.remove(categoryId);
    },
    onSuccess: (_data, categoryId) => {
      queryClient.removeQueries({
        queryKey: menuCategoryKeys.detail(categoryId),
      });
      // Refetch the list so it no longer contains the deleted category.
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.list() });
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Toggle availability
// ═════════════════════════════════════════════════════════════════════
export function useToggleMenuCategoryAvailability() {
  const queryClient = useQueryClient();

  return useMutation<MenuCategoryDto, Error, string>({
    mutationFn: (categoryId) =>
      storeApi.menuCategories.toggleAvailability(categoryId),
    onSuccess: (updated, categoryId) => {
      // Patch caches in place — no refetch needed since the server returned
      // the authoritative new state.
      queryClient.setQueryData(
        menuCategoryKeys.detail(categoryId),
        updated,
      );
      queryClient.setQueryData<MenuCategoryDto[]>(
        menuCategoryKeys.list(),
        (prev) =>
          prev?.map((c) => (c.id === categoryId ? updated : c)) ?? [],
      );
    },
  });
}
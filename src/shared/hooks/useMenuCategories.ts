import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MenuCategoryDto,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from "../types";
import { storeApi } from "../../config/storeApi";

export const MENU_CATEGORIES_KEY = "menuCategories";

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

export const useMenuCategories = () => {
  return useQuery<MenuCategoryDto[]>({
    queryKey: [MENU_CATEGORIES_KEY],
    queryFn: async () => {
      const response = await storeApi.getMenuCategories();
      return unwrap<MenuCategoryDto[]>(response);
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useMenuCategory = (categoryId: string) => {
  return useQuery<MenuCategoryDto>({
    queryKey: [MENU_CATEGORIES_KEY, categoryId],
    queryFn: async () => {
      const response = await storeApi.getMenuCategory(categoryId);
      return unwrap<MenuCategoryDto>(response);
    },
    enabled: !!categoryId,
  });
};

export const useCreateMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateMenuCategoryDto) => {
      const response = await storeApi.createMenuCategory(dto);
      return unwrap<MenuCategoryDto>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MENU_CATEGORIES_KEY] });
    },
  });
};

export const useUpdateMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      dto,
    }: {
      categoryId: string;
      dto: UpdateMenuCategoryDto;
    }) => {
      const response = await storeApi.updateMenuCategory(categoryId, dto);
      return unwrap<MenuCategoryDto>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MENU_CATEGORIES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [MENU_CATEGORIES_KEY, variables.categoryId],
      });
    },
  });
};

export const useDeleteMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      await storeApi.deleteMenuCategory(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MENU_CATEGORIES_KEY] });
    },
  });
};

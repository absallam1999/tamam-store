import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  ProductOptionGroupDto,
  CreateProductOptionDto,
  CreateProductOptionValueDto,
} from "../types";
import { storeApi } from "../../config/storeApi";

export const PRODUCTS_KEY = "storeProducts";

/**
 * Unwraps the API response wrapper
 */
function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

// ============================================================
// Products
// ============================================================

export const useStoreProducts = (categoryId?: string) => {
  return useQuery<ProductDto[]>({
    queryKey: [PRODUCTS_KEY, categoryId],
    queryFn: async () => {
      const response = await storeApi.getProducts(categoryId);
      return unwrap<ProductDto[]>(response);
    },
    staleTime: 0, // Always consider data stale — refetch on every mount
    refetchOnMount: true, // Refetch when component mounts (after navigating back)
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};

export const useProduct = (productId: string) => {
  return useQuery<ProductDto>({
    queryKey: [PRODUCTS_KEY, productId],
    queryFn: async () => {
      const response = await storeApi.getProduct(productId);
      return unwrap<ProductDto>(response);
    },
    enabled: !!productId,
    staleTime: 0,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      const response = await storeApi.createProduct(dto);
      return unwrap<ProductDto>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
};

export const useUpdateProduct = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateProductDto) => {
      const response = await storeApi.updateProduct(productId, dto);
      return unwrap<ProductDto>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      await storeApi.deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
};

export const useToggleProductAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      await storeApi.toggleProductAvailability(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
};

// ============================================================
// Product Options
// ============================================================

export const useProductOptions = (productId: string) => {
  return useQuery<ProductOptionGroupDto[]>({
    queryKey: [PRODUCTS_KEY, productId, "options"],
    queryFn: async () => {
      const response = await storeApi.getProductOptions(productId);
      return unwrap<ProductOptionGroupDto[]>(response);
    },
    enabled: !!productId,
  });
};

export const useCreateProductOption = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProductOptionDto) => {
      const response = await storeApi.createProductOption(productId, dto);
      return unwrap<ProductOptionGroupDto>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PRODUCTS_KEY, productId, "options"],
      });
    },
  });
};

export const useDeleteProductOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (optionId: string) => {
      const response = await storeApi.deleteProductOption(optionId);
      return unwrap<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
};

export const useCreateProductOptionValue = (optionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProductOptionValueDto) => {
      const response = await storeApi.createProductOptionValue(optionId, dto);
      return unwrap<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
};

export const useDeleteProductOptionValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valueId: string) => {
      const response = await storeApi.deleteProductOptionValue(valueId);
      return unwrap<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
};

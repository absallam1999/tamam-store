import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  ProductOptionDto,
  ProductOptionValueDto,
  CreateProductOptionDto,
  CreateProductOptionValueDto,
  UpdateProductOptionDto,
  UpdateProductOptionValueDto,
  PagedResult,
} from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Query keys
// ═════════════════════════════════════════════════════════════════════
export const PRODUCTS_KEY = "storeProducts";

export const productKeys = {
  all: [PRODUCTS_KEY] as const,
  list: (filter?: {
    menuCategoryId?: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
    search?: string;
    sortBy?: string;
    pageIndex?: number;
    pageSize?: number;
  }) => [PRODUCTS_KEY, "list", filter ?? null] as const,
  detail: (productId: string) =>
    [PRODUCTS_KEY, "detail", productId] as const,
  options: (productId: string) =>
    [PRODUCTS_KEY, "detail", productId, "options"] as const,
};

// ═════════════════════════════════════════════════════════════════════
// Products — list
// ═════════════════════════════════════════════════════════════════════

export function useStoreProducts(
  menuCategoryId?: string,
  pageIndex = 1,
  pageSize = 50,
) {
  return useQuery<PagedResult<ProductDto>>({
    queryKey: productKeys.list({ menuCategoryId, pageIndex, pageSize }),
    queryFn: () =>
      storeApi.products.list({ menuCategoryId, pageIndex, pageSize }),
    staleTime: 60_000,
  });
}

// ═════════════════════════════════════════════════════════════════════
// Products — detail
// ═════════════════════════════════════════════════════════════════════

export function useProduct(productId: string | undefined) {
  return useQuery<ProductDto>({
    queryKey: productKeys.detail(productId ?? ""),
    queryFn: () => storeApi.products.get(productId!),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

// ═════════════════════════════════════════════════════════════════════
// Products — create / update / delete
// ═════════════════════════════════════════════════════════════════════

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<ProductDto, Error, CreateProductDto>({
    mutationFn: (dto) => storeApi.products.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

/**
 * Update
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductDto,
    Error,
    { productId: string; dto: UpdateProductDto }
  >({
    mutationFn: ({ productId, dto }) =>
      storeApi.products.update(productId, dto),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (productId) => {
      await storeApi.products.remove(productId);
    },
    onSuccess: (_data, productId) => {
      queryClient.removeQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Products — availability (PATCH with explicit state)
// ═════════════════════════════════════════════════════════════════════

export function useSetProductAvailability() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductDto,
    Error,
    { productId: string; isAvailable: boolean }
  >({
    mutationFn: ({ productId, isAvailable }) =>
      storeApi.products.setAvailability(productId, isAvailable),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        updated,
      );
      // Patch the list cache in place — no refetch.
      queryClient.setQueryData<PagedResult<ProductDto>>(
        productKeys.list(),
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((p) =>
                  p.id === variables.productId ? updated : p,
                ),
              }
            : prev,
      );
    },
  });
}

/**
 * Featured
 */
export function useSetProductFeatured() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductDto,
    Error,
    { productId: string; isFeatured: boolean }
  >({
    mutationFn: ({ productId, isFeatured }) =>
      storeApi.products.setFeatured(productId, isFeatured),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        updated,
      );
      queryClient.setQueryData<PagedResult<ProductDto>>(
        productKeys.list(),
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((p) =>
                  p.id === variables.productId ? updated : p,
                ),
              }
            : prev,
      );
    },
  });
}

/**
 * Discount
 */
export function useSetProductDiscount() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductDto,
    Error,
    { productId: string; discountedPrice: number | null }
  >({
    mutationFn: ({ productId, discountedPrice }) =>
      storeApi.products.setDiscount(productId, discountedPrice),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        updated,
      );
      queryClient.setQueryData<PagedResult<ProductDto>>(
        productKeys.list(),
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((p) =>
                  p.id === variables.productId ? updated : p,
                ),
              }
            : prev,
      );
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Product Options
// ═════════════════════════════════════════════════════════════════════

export function useProductOptions(productId: string | undefined) {
  return useQuery<ProductOptionDto[]>({
    queryKey: productKeys.options(productId ?? ""),
    queryFn: () => storeApi.productOptions.listForProduct(productId!),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

/**
 * Create option
 */
export function useCreateProductOption() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductOptionDto,
    Error,
    { productId: string; dto: CreateProductOptionDto }
  >({
    mutationFn: ({ productId, dto }) =>
      storeApi.productOptions.create(productId, dto),
    onSuccess: (_data, variables) => {
      // Options cache for this product + parent product detail are now stale
      queryClient.invalidateQueries({
        queryKey: productKeys.options(variables.productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useUpdateProductOption() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductOptionDto,
    Error,
    { optionId: string; dto: UpdateProductOptionDto }
  >({
    mutationFn: ({ optionId, dto }) =>
      storeApi.productOptions.update(optionId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (optionId) => {
      await storeApi.productOptions.remove(optionId);
    },
    onSuccess: () => {
      // Option subtree lives inside a product — invalidate to refetch
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Product Option Values
// ═════════════════════════════════════════════════════════════════════

/**
 * Create value
 */
export function useCreateProductOptionValue() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductOptionValueDto,
    Error,
    { optionId: string; dto: CreateProductOptionValueDto }
  >({
    mutationFn: ({ optionId, dto }) =>
      storeApi.productOptions.createValue(optionId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useUpdateProductOptionValue() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductOptionValueDto,
    Error,
    { valueId: string; dto: UpdateProductOptionValueDto }
  >({
    mutationFn: ({ valueId, dto }) =>
      storeApi.productOptions.updateValue(valueId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useDeleteProductOptionValue() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (valueId) => {
      await storeApi.productOptions.removeValue(valueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useSetProductOptionValueDefault() {
  const queryClient = useQueryClient();

  return useMutation<ProductOptionValueDto, Error, string>({
    mutationFn: (valueId) => storeApi.productOptions.setValueDefault(valueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Product image — two-step upload
// ═════════════════════════════════════════════════════════════════════

export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductDto,
    Error,
    { productId: string; file: File }
  >({
    mutationFn: ({ productId, file }) =>
      storeApi.products.uploadImage(productId, file),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}
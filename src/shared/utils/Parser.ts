// ============================================================
// Image Parser Utility
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_URL = API_BASE_URL.replace(/\/$/, "");

const PLACEHOLDER = "/images/placeholder-product.png";

/**
 * Resolves any media path/URL
 */
export function resolveMediaUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  if (raw.startsWith("/")) {
    return `${API_URL}${raw.replace(/\/Store\//g, "/stores/")}`;
  }

  return `${API_URL}/${raw}`;
}

/**
 * Resolves a product image URL
 */
export const getProductImage = (
  product: { id: string; imageUrl?: string | null },
  storeId?: string,
  size: "thumbnail" | "medium" | "large" | "original" = "medium",
): string => {
  const raw = product?.imageUrl?.trim();
  if (!raw) return PLACEHOLDER;

  // Absolute path or full URL — resolveMediaUrl handles both
  if (raw.startsWith("/") || /^https?:\/\//i.test(raw)) {
    return resolveMediaUrl(raw) ?? PLACEHOLDER;
  }

  if (storeId) {
    return `${API_URL}/stores/${storeId}/products/${size}/${raw}`;
  }

  return PLACEHOLDER;
};

/**
 * Check if a product has an image.
 */
export const hasProductImage = (product: {
  imageUrl?: string | null;
}): boolean => {
  return !!product.imageUrl && product.imageUrl.trim().length > 0;
};
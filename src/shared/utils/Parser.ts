// ============================================================
// Image Parser Utility
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_URL = API_BASE_URL.replace(/\/$/, "");

/**
 * Get product image URL with fallback
 * Removes ANY /uploads/ from the path and uses /stores/ instead
 */
export const getProductImage = (
  product: {
    id: string;
    imageUrl?: string | null;
  },
  storeId?: string,
  size: "thumbnail" | "medium" | "large" | "original" = "medium",
): string => {
  // If no product or no image URL
  if (!product || !product.imageUrl) {
    return "/images/placeholder-product.png";
  }

  let url = product.imageUrl.trim();

  // Remove ANY "/uploads/" from the URL
  url = url.replace(/\/uploads\//g, "/");

  // If it's already a full URL with the domain
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // Remove /uploads/ from the middle if present
    url = url.replace(/\/uploads\//g, "/");
    // Fix any /Store/ to /stores/
    url = url.replace(/\/Store\//g, "/stores/");
    // If it already contains /stores/, return as is
    if (url.includes("/stores/")) {
      return url;
    }
    // Otherwise extract filename and build stores URL
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    if (storeId) {
      return `${API_URL}/stores/${storeId}/products/${fileName}`;
    }
    return url;
  }

  // If it starts with /Store/ - fix to /stores/
  if (url.startsWith("/Store/")) {
    url = url.replace(/^\/Store\//, `/stores/${storeId}/products/`);
    return `${API_URL}${url}`;
  }

  // If it starts with Store/ (no leading slash) - fix to stores/
  if (url.startsWith("Store/")) {
    url = url.replace(/^Store\//, `stores/${storeId}/products/`);
    return `${API_URL}/${url}`;
  }

  // If it starts with /stores/ - already correct
  if (url.startsWith("/stores/")) {
    return `${API_URL}${url}`;
  }

  // If it starts with stores/ (no leading slash)
  if (url.startsWith("stores/")) {
    return `${API_URL}/${url}`;
  }

  // If it starts with /uploads/ - remove and use stores path
  if (url.startsWith("/uploads/")) {
    const fileName = url.replace(/^\/uploads\//, "");
    if (storeId) {
      return `${API_URL}/stores/${storeId}/products/${fileName}`;
    }
    return `${API_URL}/stores/products/${fileName}`;
  }

  // If it starts with uploads/ (no leading slash)
  if (url.startsWith("uploads/")) {
    const fileName = url.replace(/^uploads\//, "");
    if (storeId) {
      return `${API_URL}/stores/${storeId}/products/${fileName}`;
    }
    return `${API_URL}/stores/products/${fileName}`;
  }

  // If it's just a filename, construct the stores URL
  if (storeId) {
    // Remove any remaining /uploads/ from the filename
    const cleanFileName = url.replace(/\/uploads\//g, "");
    return `${API_URL}/stores/${storeId}/products/${cleanFileName}`;
  }

  // Fallback: return as is
  return url;
};

/**
 * Check if product has an image
 */
export const hasProductImage = (product: {
  imageUrl?: string | null;
}): boolean => {
  return !!product.imageUrl && product.imageUrl.trim().length > 0;
};

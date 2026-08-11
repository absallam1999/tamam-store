import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StoreOrderDto, StoreOrderStatsDto } from "../types";
import { storeApi } from "../../config/storeApi";

// ============================================================
// Query Key Factory
// ============================================================

export const orderKeys = {
  all: ["storeOrders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters?: { status?: string; page?: number; pageSize?: number }) =>
    [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, "stats"] as const,
};

// ============================================================
// Helpers
// ============================================================

function unwrap<T>(response: unknown): T {
  if (response === null || response === undefined || response === "") {
    return undefined as unknown as T;
  }
  if (typeof response !== "object") return response as T;
  const resp = response as Record<string, unknown>;
  if ("data" in resp && resp.data !== null && resp.data !== undefined) {
    const data = resp.data as Record<string, unknown>;
    if (
      ("success" in data || "Success" in data) &&
      "data" in data &&
      data.data !== null &&
      data.data !== undefined
    ) {
      return data.data as T;
    }
    if ("items" in data) return data.items as T;
    if ("orders" in data) return data.orders as T;
    if ("active" in data || "completed" in data) return data as T;
    return data as T;
  }
  if ("items" in resp) return resp.items as T;
  if ("orders" in resp) return resp.orders as T;
  if ("active" in resp || "completed" in resp) return resp as T;
  return response as T;
}

// ============================================================
// Status Mapping — Frontend ↔ API
// ============================================================

/**
 * Map frontend status to API OrderStatus enum value
 */
const frontendToApiStatus = (frontendStatus: string): string => {
  const map: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    preparing: "Preparing",
    ready: "ReadyForDriver",
    picked_up: "PickedUp",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[frontendStatus] || frontendStatus;
};

/**
 * Map API OrderStatus enum value to frontend status
 */
const apiToFrontendStatus = (apiStatus: string): StoreOrderDto["status"] => {
  const map: Record<string, StoreOrderDto["status"]> = {
    Pending: "pending",
    Accepted: "accepted",
    Rejected: "cancelled",
    Preparing: "preparing",
    ReadyForDriver: "ready",
    DriverAssigned: "accepted",
    PickedUp: "picked_up",
    InTransit: "picked_up",
    Delivered: "delivered",
    Cancelled: "cancelled",
    Failed: "cancelled",
    Placed: "pending",
    OutForDelivery: "picked_up",
    NotAccepted: "cancelled",
    Returned: "cancelled",
    AwaitingConfirmation: "pending",
    ScheduledCancelled: "cancelled",
    ScheduledConfirmed: "accepted",
  };
  return map[apiStatus] || "pending";
};

/**
 * Normalize a raw order from the API to StoreOrderDto
 */
function normalizeOrder(raw: any): StoreOrderDto {
  return {
    id: raw.id || "",
    orderNumber: raw.orderNumber || "",
    customerName: raw.customerName || "",
    customerPhone: raw.customerPhone || "",
    status: apiToFrontendStatus(raw.status || "Pending"),
    items: (raw.items || []).map((item: any) => ({
      productId: item.productId || item.id || "",
      productName:
        item.productNameEn ||
        item.productName ||
        item.nameEn ||
        item.name ||
        "Product",
      productNameAr: item.productNameAr || item.nameAr || null,
      productNameEn: item.productNameEn || item.nameEn || null,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice || item.price) || 0,
      options: item.options || item.selectedOptions || "",
    })),
    totalAmount: Number(raw.totalAmount || raw.total) || 0,
    deliveryFee: Number(raw.deliveryFee) || 0,
    discount: Number(raw.discount) || 0,
    subtotal: Number(raw.subtotal) || 0,
    specialInstructions: raw.specialInstructions || raw.notes || null,
    scheduledDeliveryTime: raw.scheduledDeliveryTime || null,
    createdAt: raw.createdAt || "",
    acceptedAt: raw.acceptedAt || null,
    deliveredAt: raw.deliveredAt || null,
    rejectionReason: raw.rejectionReason || null,
    driverName: raw.driverName || raw.driver?.name || null,
    storeName: raw.storeNameEn || raw.storeName || "",
    paymentMethod: raw.paymentMethod || "",
    paymentStatus: raw.paymentStatus || "",
    orderType: raw.orderType || "Normal",
  } as any;
}

// ============================================================
// Queries
// ============================================================

export const useStoreOrders = (filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery<StoreOrderDto[]>({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const response = await storeApi.getOrders(filters?.status);
      const data = unwrap<any>(response);

      // Handle { active: [...], completed: [...] } structure
      let allOrders: any[] = [];
      if (data?.active || data?.completed) {
        allOrders = [...(data.active || []), ...(data.completed || [])];
      } else if (Array.isArray(data)) {
        allOrders = data;
      } else if (data?.items) {
        allOrders = data.items;
      }

      return allOrders.map(normalizeOrder);
    },
    staleTime: 0, // Always stale
    refetchOnMount: true, // Refetch on mount
    refetchOnWindowFocus: true, // Refetch when tab focuses
  });
};

export const useStoreOrder = (orderId: string) => {
  return useQuery<StoreOrderDto>({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      if (!orderId) {
        throw new Error("No order ID provided");
      }

      // Call the API
      const response = await storeApi.getOrder(orderId);

      // Manual unwrapping
      let data: any = response;

      // Check if response has a 'data' property (axios/fetch wrapper)
      if (data && typeof data === "object" && "data" in data) {
        data = data.data;
      }

      // Check for API wrapper { success, data, message }
      if (
        data &&
        typeof data === "object" &&
        ("success" in data || "Success" in data)
      ) {
        if (data.data) {
          data = data.data;
        }
      }

      if (!data) {
        throw new Error("Order not found");
      }

      // If data is an array, get first element
      if (Array.isArray(data)) {
        data = data[0];
      }

      const normalized = normalizeOrder(data);

      return normalized;
    },
    enabled: !!orderId,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Always refetch when component mounts
    retry: 1,
  });
};

export const useStoreOrderStats = () => {
  return useQuery<StoreOrderStatsDto>({
    queryKey: orderKeys.stats(),
    queryFn: async () => {
      const response: any = await storeApi.getOrderStats();
      let data: any = response?.data || response;
      if (data?.success !== undefined && data?.data) {
        data = data.data;
      }

      const pendingOrders = Number(data?.pending ?? 0);
      const activeOrders =
        Number(data?.accepting ?? 0) +
        Number(data?.preparing ?? 0) +
        Number(data?.readyForDriver ?? 0) +
        Number(data?.inDelivery ?? 0);
      const completedToday = Number(data?.completedToday ?? 0);
      const revenueToday = Number(data?.revenueToday ?? 0);
      const totalOrdersToday = pendingOrders + activeOrders + completedToday;

      return {
        revenueToday,
        totalOrdersToday,
        pendingOrders,
        activeOrders,
        completedToday,
      } as StoreOrderStatsDto;
    },
    staleTime: 30 * 1000,
  });
};

// ============================================================
// Cache Invalidation Helper
// ============================================================

const useInvalidateOrderQueries = () => {
  const qc = useQueryClient();
  return (orderId?: string) => {
    qc.invalidateQueries({ queryKey: orderKeys.lists() });
    qc.invalidateQueries({ queryKey: orderKeys.stats() });
    if (orderId) {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      // Force immediate refetch of the specific order
      qc.refetchQueries({ queryKey: orderKeys.detail(orderId) });
    }
    // Also refetch the lists
    qc.refetchQueries({ queryKey: orderKeys.lists() });
  };
};
// ============================================================
// Mutations
// ============================================================

export const useAcceptOrder = () => {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async (orderId: string) => {
      await storeApi.acceptOrder(orderId);
    },
    onSuccess: (_, orderId) => invalidate(orderId),
  });
};

export const useRejectOrder = () => {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason?: string;
    }) => {
      await storeApi.rejectOrder(orderId, reason);
    },
    onSuccess: (_, variables) => invalidate(variables.orderId),
  });
};

export const useUpdateOrderStatus = () => {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      rejectionReason,
    }: {
      orderId: string;
      status: string;
      rejectionReason?: string;
    }) => {
      // Convert frontend status to API enum value
      const apiStatus = frontendToApiStatus(status);
      console.log("🔍 Updating order status:", {
        orderId,
        frontendStatus: status,
        apiStatus,
      });
      await storeApi.updateOrderStatus(orderId, {
        status: apiStatus,
        rejectionReason,
      });
    },
    onSuccess: (_, variables) => invalidate(variables.orderId),
  });
};

export const useReadyForDriver = () => {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async (orderId: string) => {
      await storeApi.readyForDriver(orderId);
    },
    onSuccess: (_, orderId) => invalidate(orderId),
  });
};

export const usePickedUpOrder = () => {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async (orderId: string) => {
      await storeApi.orderPickedUp(orderId);
    },
    onSuccess: (_, orderId) => invalidate(orderId),
  });
};

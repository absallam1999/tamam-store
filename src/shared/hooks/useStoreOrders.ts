import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  StoreOrderDto,
  StoreOrderStatsDto,
  OrderStatus,
  UpdateOrderStatusDto,
} from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Query keys
// ═════════════════════════════════════════════════════════════════════

export const orderKeys = {
  all: ["storeOrders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters?: { status?: string; page?: number; pageSize?: number }) =>
    [...orderKeys.lists(), filters ?? null] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, "stats"] as const,
};

// ═════════════════════════════════════════════════════════════════════
// Frontend status union
// ═════════════════════════════════════════════════════════════════════

export type FrontendOrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface NormalizedOrder
  extends Omit<StoreOrderDto, "status"> {
  status: FrontendOrderStatus;
}

const frontendToApiStatus = (s: string): OrderStatus => {
  const map: Record<string, OrderStatus> = {
    pending: "Pending",
    accepted: "Accepted",
    preparing: "Preparing",
    ready: "ReadyForDriver",
    picked_up: "PickedUp",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return (map[s] ?? "Pending") as OrderStatus;
};

const apiToFrontendStatus = (apiStatus: string): FrontendOrderStatus => {
  const map: Record<string, FrontendOrderStatus> = {
    Pending: "pending",
    Accepted: "accepted",
    Preparing: "preparing",
    ReadyForDriver: "ready",
    DriverAssigned: "ready",
    PickedUp: "picked_up",
    InTransit: "picked_up",
    OutForDelivery: "picked_up",
    Delivered: "delivered",
    Rejected: "cancelled",
    Cancelled: "cancelled",
    Failed: "cancelled",
    Placed: "pending",
    NotAccepted: "cancelled",
    Returned: "cancelled",
    AwaitingConfirmation: "pending",
    ScheduledCancelled: "cancelled",
    ScheduledConfirmed: "accepted",
  };
  return map[apiStatus] ?? "pending";
};

// Normalize a raw API order → frontend view model
function normalizeOrder(raw: StoreOrderDto): NormalizedOrder {
  return {
    ...raw,
    status: apiToFrontendStatus(raw.status ?? "Pending"),
  };
}

// ═════════════════════════════════════════════════════════════════════
// Queries
// ═════════════════════════════════════════════════════════════════════

export function useStoreOrders(filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery<NormalizedOrder[]>({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const orders = await storeApi.orders.list(filters?.status);
      return orders.map(normalizeOrder);
    },
    staleTime: 30_000,
  });
}

export function useStoreOrder(orderId: string | undefined) {
  return useQuery<NormalizedOrder>({
    queryKey: orderKeys.detail(orderId ?? ""),
    queryFn: async () => {
      const order = await storeApi.orders.get(orderId!);
      return normalizeOrder(order);
    },
    enabled: Boolean(orderId),
    staleTime: 30_000,
  });
}

export function useStoreOrderStats() {
  return useQuery<StoreOrderStatsDto>({
    queryKey: orderKeys.stats(),
    queryFn: () => storeApi.orders.stats(),
    staleTime: 30_000,
  });
}

// ═════════════════════════════════════════════════════════════════════
// Cache invalidation
// ═════════════════════════════════════════════════════════════════════

function useInvalidateOrderQueries() {
  const qc = useQueryClient();
  return (orderId?: string) => {
    qc.invalidateQueries({ queryKey: orderKeys.lists() });
    qc.invalidateQueries({ queryKey: orderKeys.stats() });
    if (orderId) {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    }
  };
}

// ═════════════════════════════════════════════════════════════════════
// Mutations
// ═════════════════════════════════════════════════════════════════════

export function useAcceptOrder() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: (orderId: string) => storeApi.orders.accept(orderId),
    onSuccess: (_d, orderId) => invalidate(orderId),
  });
}

export function useRejectOrder() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      storeApi.orders.reject(orderId, reason ?? ""),
    onSuccess: (_d, v) => invalidate(v.orderId),
  });
}

export function useCancelOrder() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      storeApi.orders.cancel(orderId, reason),
    onSuccess: (_d, v) => invalidate(v.orderId),
  });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
      rejectionReason,
    }: {
      orderId: string;
      status: string;
      rejectionReason?: string;
    }) => {
      const dto: UpdateOrderStatusDto = {
        status: frontendToApiStatus(status),
        rejectionReason,
      };
      return storeApi.orders.setStatus(orderId, dto);
    },
    onSuccess: (_d, v) => invalidate(v.orderId),
  });
}

export function useReadyForDriver() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: (orderId: string) => storeApi.orders.readyForDriver(orderId),
    onSuccess: (_d, orderId) => invalidate(orderId),
  });
}

export function usePickedUpOrder() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: (orderId: string) => storeApi.orders.pickedUp(orderId),
    onSuccess: (_d, orderId) => invalidate(orderId),
  });
}

// ═════════════════════════════════════════════════════════════════════
// Store-own-delivery composite
// ═════════════════════════════════════════════════════════════════════

export function useCompleteStoreDelivery() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async (orderId: string) => {
      await storeApi.orders.readyForDriver(orderId);
      await storeApi.orders.outForDelivery(orderId);
      await storeApi.orders.setStatus(orderId, {
        status: "Delivered",
      });
    },
    onSuccess: (_d, orderId) => invalidate(orderId),
  });
}
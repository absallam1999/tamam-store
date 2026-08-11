import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";

export const NOTIFICATIONS_KEY = "notifications";
export const UNREAD_COUNT_KEY = "notificationsUnreadCount";

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  dataJson: string | null;
  createdAt: string;
  link?: string;
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data as T;
  }
  return response as T;
}

/**
 * Parses dataJson to extract a navigation link if present.
 */
function parseLink(dataJson: string | null): string | undefined {
  if (!dataJson) return undefined;
  try {
    const parsed = JSON.parse(dataJson);
    if (parsed.action === "navigate" && parsed.targetPage) {
      const pageRoutes: Record<string, string> = {
        StoreProfile: "/dashboard/settings",
        Orders: "/dashboard/orders",
        Products: "/dashboard/products",
        Menu: "/dashboard/menu",
        Wallet: "/dashboard/wallet",
        Notifications: "/dashboard/notifications",
      };
      return (
        pageRoutes[parsed.targetPage] ||
        `/dashboard/${parsed.targetPage.toLowerCase()}`
      );
    }
    if (parsed.orderId) {
      return `/dashboard/orders/${parsed.orderId}`;
    }
    if (parsed.url) {
      return parsed.url;
    }
  } catch {
    // Invalid JSON — ignore
  }
  return undefined;
}

// ============================================================
// Queries
// ============================================================

/**
 * GET /api/notifications?page=&pageSize=
 */
export const useNotifications = (page = 1, pageSize = 5) => {
  return useQuery<NotificationDto[]>({
    queryKey: [NOTIFICATIONS_KEY, page, pageSize],
    queryFn: async () => {
      const url = `${ENDPOINTS.NOTIFICATIONS.BASE}?page=${page}&pageSize=${pageSize}`;
      const response = await apiClient.get(url);
      const result = unwrap<any>(response.data || response);

      const notifications: NotificationDto[] = Array.isArray(result)
        ? result
        : ((result as any)?.notifications ?? (result as any)?.items ?? []);

      return notifications.map((n) => ({
        ...n,
        link: parseLink(n.dataJson),
      }));
    },
    staleTime: 30_000,
  });
};

/**
 * GET /api/notifications/unread-count
 * Returns the unread count as a number
 */
export const useUnreadCount = () => {
  return useQuery<number>({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const result = unwrap<any>(response.data || response);

      // Handle different response shapes
      if (typeof result === "number") return result;
      if (result?.count !== undefined) return result.count;
      if (result?.unreadCount !== undefined) return result.unreadCount;
      return 0;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
};

/**
 * PATCH /api/notifications/{notificationId}/read
 */
export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
};

/**
 * PATCH /api/notifications/read-all
 */
export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
};

/**
 * DELETE /api/notifications/{notificationId}
 */
export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE(notificationId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
};

/**
 * DELETE /api/notifications/clear-all
 */
export const useDeleteAllNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE_ALL);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
};
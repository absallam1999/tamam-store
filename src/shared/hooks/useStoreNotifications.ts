import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  NotificationSummaryDto,
  NotificationDto,
  NotificationFilterDto,
  UnreadCountDto,
  MarkAllAsReadResultDto,
  PagedResult,
} from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Query keys
// ═════════════════════════════════════════════════════════════════════
export const NOTIFICATIONS_KEY = "notifications";
export const UNREAD_COUNT_KEY = "notificationsUnreadCount";

export const notificationKeys = {
  all: [NOTIFICATIONS_KEY] as const,
  list: (pageIndex: number, pageSize: number, filter?: NotificationFilterDto) =>
    [NOTIFICATIONS_KEY, "list", pageIndex, pageSize, filter ?? null] as const,
  detail: (id: string) => [NOTIFICATIONS_KEY, "detail", id] as const,
  unreadCount: () => [UNREAD_COUNT_KEY] as const,
};

// ═════════════════════════════════════════════════════════════════════
// List
// ═════════════════════════════════════════════════════════════════════
export function useNotifications(
  pageIndex = 1,
  pageSize = 20,
  filter?: NotificationFilterDto,
) {
  return useQuery<PagedResult<NotificationSummaryDto>>({
    queryKey: notificationKeys.list(pageIndex, pageSize, filter),
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<NotificationSummaryDto>>(
        ENDPOINTS.NOTIFICATIONS.LIST,
        {
          pageIndex,
          pageSize,
          ...(filter?.type !== undefined && { Type: filter.type }),
          ...(filter?.isRead !== undefined && { IsRead: filter.isRead }),
          ...(filter?.from && { From: filter.from }),
          ...(filter?.to && { To: filter.to }),
        },
      );
      return data;
    },
    staleTime: 30_000,
  });
}

// ═════════════════════════════════════════════════════════════════════
// Detail — single notification
// ═════════════════════════════════════════════════════════════════════
export function useNotification(id: string | undefined) {
  return useQuery<NotificationDto>({
    queryKey: notificationKeys.detail(id ?? ""),
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationDto>(
        ENDPOINTS.NOTIFICATIONS.BY_ID(id!),
      );
      return data;
    },
    enabled: Boolean(id),
  });
}

// ═════════════════════════════════════════════════════════════════════
// Unread count — returns UnreadCountDto { total, byType }
// ═════════════════════════════════════════════════════════════════════
export function useUnreadCount() {
  return useQuery<UnreadCountDto>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const { data } = await apiClient.get<UnreadCountDto>(
        ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
      );
      return data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}


export function useUnreadCountValue(): number {
  const { data } = useUnreadCount();
  return data?.total ?? 0;
}

// ═════════════════════════════════════════════════════════════════════
// Mark as read — single
// ═════════════════════════════════════════════════════════════════════
export function useMarkAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.post<void>(
        ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
      );
    },
    onSuccess: (_data, notificationId) => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
      qc.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Mark all as read
// ═════════════════════════════════════════════════════════════════════
export function useMarkAllAsRead() {
  const qc = useQueryClient();

  return useMutation<MarkAllAsReadResultDto>({
    mutationFn: async () => {
      const { data } = await apiClient.post<MarkAllAsReadResultDto>(
        ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Delete — single
// ═════════════════════════════════════════════════════════════════════
export function useDeleteNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete<void>(
        ENDPOINTS.NOTIFICATIONS.DELETE(notificationId),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// Delete all
// ═════════════════════════════════════════════════════════════════════
export function useDeleteAllNotifications() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      throw new Error(
        "Bulk delete is not available yet. Please delete notifications individually.",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}
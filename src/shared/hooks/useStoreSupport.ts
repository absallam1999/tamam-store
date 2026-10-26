import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type {
  ConversationDto,
  ConversationListItemDto,
  CreateConversationDto,
  MessageDto,
  MessageType,
  PagedResult,
  SendMessageDto,
} from "@shared/types";

// ============================================================
// Query Keys
// ============================================================

export const SUPPORT_KEYS = {
  all: ["supportTickets"] as const,
  tickets: () => [...SUPPORT_KEYS.all, "tickets"] as const,
  ticket: (id: string) => [...SUPPORT_KEYS.all, "ticket", id] as const,
  messages: (ticketId: string) =>
    [...SUPPORT_KEYS.all, "messages", ticketId] as const,
  unreadCount: () => [...SUPPORT_KEYS.all, "unreadCount"] as const,
};

// ============================================================
// Input types
// ============================================================

export interface CreateTicketInput {
  subject: string;
  message: string;
  orderId?: string;
}

export interface SendTicketMessageInput {
  ticketId: string;
  content: string;
  attachmentUrl?: string;
  messageType?: MessageType;
}

export interface CloseTicketInput {
  ticketId: string;
  reason?: string;
}

export interface ChatUnreadCount {
  totalUnread: number;
  conversationsWithUnread: number;
  byConversation?: Record<string, number>;
}

// ============================================================
// Queries
// ============================================================

/**
 * GET /api/chat — the caller's conversations (paged)
 */
export const useSupportTickets = () =>
  useQuery<ConversationListItemDto[]>({
    queryKey: SUPPORT_KEYS.tickets(),
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<ConversationListItemDto>>(
        ENDPOINTS.CHAT.CONVERSATIONS,
        { PageSize: 100 },
      );
      return res.data.items;
    },
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 2,
  });

/**
 * GET /api/chat/{id}/messages 
 */
export const useTicketMessages = (ticketId: string) =>
  useQuery<MessageDto[]>({
    queryKey: SUPPORT_KEYS.messages(ticketId),
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<MessageDto>>(
        ENDPOINTS.CHAT.MESSAGES(ticketId),
        { PageSize: 200, Order: "asc" },
      );
      return res.data.items;
    },
    enabled: !!ticketId,
    staleTime: 10_000,
    refetchInterval: 5_000,
    retry: 2,
  });

/**
 * GET /api/chat/{id}
 */
export const useConversation = (ticketId: string) =>
  useQuery<ConversationDto>({
    queryKey: SUPPORT_KEYS.ticket(ticketId),
    queryFn: async () => {
      const res = await apiClient.get<ConversationDto>(
        ENDPOINTS.CHAT.CONVERSATION_BY_ID(ticketId),
      );
      return res.data;
    },
    enabled: !!ticketId,
    staleTime: 30_000,
  });

/**
 * GET /api/chat/unread-count
 */
export const useChatUnreadCount = () =>
  useQuery<ChatUnreadCount>({
    queryKey: SUPPORT_KEYS.unreadCount(),
    queryFn: async () => {
      const res = await apiClient.get<ChatUnreadCount>(
        ENDPOINTS.CHAT.UNREAD_COUNT,
      );
      return res.data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

// ============================================================
// Mutations
// ============================================================

/**
 * POST /api/chat
 */
export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation<ConversationDto, Error, CreateTicketInput>({
    mutationFn: async (input) => {
      const payload: CreateConversationDto = {
        subject: input.subject,
        firstMessage: input.message,
        orderId: input.orderId,
      };
      const res = await apiClient.post<ConversationDto>(
        ENDPOINTS.CHAT.CONVERSATIONS,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.unreadCount() });
    },
  });
};

/**
 * POST /api/chat/{id}/messages
 */
export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation<MessageDto, Error, SendTicketMessageInput>({
    mutationFn: async (input) => {
      const payload: SendMessageDto = {
        content: input.content,
        attachmentUrl: input.attachmentUrl,
        messageType: input.messageType ?? "Text",
      };
      const res = await apiClient.post<MessageDto>(
        ENDPOINTS.CHAT.MESSAGES(input.ticketId),
        payload,
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: SUPPORT_KEYS.messages(vars.ticketId),
      });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
    },
  });
};

/**
 * POST /api/chat/{id}/read
 */
export const useMarkTicketRead = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (ticketId) => {
      await apiClient.post<void>(ENDPOINTS.CHAT.MARK_READ(ticketId));
    },
    onSuccess: (_, ticketId) => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.unreadCount() });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.messages(ticketId) });
    },
  });
};

/**
 * POST /api/chat/{id}/close
 */
export const useCloseTicket = () => {
  const qc = useQueryClient();
  return useMutation<ConversationDto, Error, CloseTicketInput>({
    mutationFn: async ({ ticketId, reason }) => {
      const res = await apiClient.post<ConversationDto>(
        ENDPOINTS.CHAT.CLOSE(ticketId),
        { reason },
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
      qc.invalidateQueries({
        queryKey: SUPPORT_KEYS.messages(vars.ticketId),
      });
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.unreadCount() });
    },
  });
};
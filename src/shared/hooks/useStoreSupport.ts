import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  SupportTicketDto,
  SupportMessageDto,
  CreateSupportTicketDto,
  SendSupportMessageDto,
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

  // Check for nested data structure (common in API responses)
  if ("data" in resp && resp.data !== null && resp.data !== undefined) {
    const data = resp.data as Record<string, unknown>;

    // Check for success wrapper
    if (
      ("success" in data || "Success" in data) &&
      "data" in data &&
      data.data !== null &&
      data.data !== undefined
    ) {
      return data.data as T;
    }

    // Check for items array
    if ("items" in data) return data.items as T;
    if ("tickets" in data) return data.tickets as T;
    if ("conversations" in data) return data.conversations as T;
    if ("messages" in data) return data.messages as T;

    return data as T;
  }

  // Direct response with items
  if ("items" in resp) return resp.items as T;
  if ("tickets" in resp) return resp.tickets as T;
  if ("conversations" in resp) return resp.conversations as T;
  if ("messages" in resp) return resp.messages as T;

  return response as T;
}

// ============================================================
// Queries
// ============================================================

/**
 * GET /api/chat/conversations
 * Fetch all support tickets (conversations) for store owner
 */
export const useSupportTickets = () => {
  return useQuery<SupportTicketDto[]>({
    queryKey: SUPPORT_KEYS.tickets(),
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/chat/conversations");
        console.log("[Support API] Tickets response:", response);

        const data = unwrap<any>(response);

        let tickets: any[] = [];

        if (Array.isArray(data)) {
          tickets = data;
        } else if (data?.items) {
          tickets = data.items;
        } else if (data?.tickets) {
          tickets = data.tickets;
        } else if (data?.conversations) {
          tickets = data.conversations;
        } else if (data?.data && Array.isArray(data.data)) {
          tickets = data.data;
        }

        console.log("[Support API] Processed tickets:", tickets);

        return tickets.map((t: any) => ({
          id: t.id || "",
          subject: t.subject || t.title || "Support Ticket",
          status: t.status || "Open",
          priority: t.priority || "Medium",
          createdAt: t.createdAt || t.created_at || new Date().toISOString(),
          updatedAt:
            t.updatedAt ||
            t.updated_at ||
            t.createdAt ||
            new Date().toISOString(),
          messages: (t.recentMessages || t.messages || []).map((m: any) => ({
            id: m.id || "",
            ticketId: m.ticketId || m.conversationId || t.id || "",
            content: m.content || m.body || m.message || "",
            // Use the actual userType from the API, but override for store owner messages
            userType: "Store",
            userName: m.userName || m.senderName || m.sender_name || "",
            createdAt: m.createdAt || m.created_at || new Date().toISOString(),
            attachmentUrl: m.attachmentUrl || m.attachment_url || null,
          })),
          lastMessage:
            t.lastMessage ||
            (t.recentMessages?.length > 0
              ? t.recentMessages[t.recentMessages.length - 1]
              : null),
        })) as SupportTicketDto[];
      } catch (error) {
        console.error("[Support API] Error fetching tickets:", error);
        throw error;
      }
    },
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 2,
  });
};

/**
 * GET /api/chat/conversations/{conversationId}/messages
 * Fetch messages for a specific ticket
 */
export const useTicketMessages = (ticketId: string) => {
  return useQuery<SupportMessageDto[]>({
    queryKey: SUPPORT_KEYS.messages(ticketId),
    queryFn: async () => {
      try {
        console.log("[Support API] Fetching messages for ticket:", ticketId);

        const response = await apiClient.get(
          `/api/chat/conversations/${ticketId}/messages`,
        );
        console.log("[Support API] Messages response:", response);

        const data = unwrap<any>(response);

        let messages: any[] = [];

        if (Array.isArray(data)) {
          messages = data;
        } else if (data?.items) {
          messages = data.items;
        } else if (data?.messages) {
          messages = data.messages;
        } else if (data?.data && Array.isArray(data.data)) {
          messages = data.data;
        }

        console.log("[Support API] Processed messages:", messages);

        const mappedMessages = messages.map((m: any) => ({
          id: m.id || "",
          ticketId: m.ticketId || m.conversationId || ticketId || "",
          content: m.content || m.body || m.message || "",
          // Override userType to "Store" for all messages (store owner)
          userType: "Store",
          userName: m.userName || m.senderName || m.sender_name || "",
          createdAt: m.createdAt || m.created_at || new Date().toISOString(),
          attachmentUrl: m.attachmentUrl || m.attachment_url || null,
        }));

        console.log("[Support API] Mapped messages:", mappedMessages);
        return mappedMessages as SupportMessageDto[];
      } catch (error) {
        console.error("[Support API] Error fetching messages:", error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
      }
    },
    enabled: !!ticketId,
    staleTime: 10_000,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
    retry: 2,
  });
};

// ============================================================
// Mutations
// ============================================================

/**
 * POST /api/chat/conversations
 * Create a new support ticket (StartConversationDto)
 */
export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation<SupportTicketDto, Error, CreateSupportTicketDto>({
    mutationFn: async (dto) => {
      try {
        console.log("[Support API] Creating ticket:", dto);

        const response = await apiClient.post("/api/chat/conversations", {
          subject: dto.subject,
          initialMessage: dto.message,
          orderId: dto.orderId || null,
        });

        console.log("[Support API] Create ticket response:", response);

        const data = unwrap<any>(response);
        console.log("[Support API] Unwrapped ticket data:", data);

        return {
          id: data?.id || "",
          subject: data?.subject || dto.subject,
          status: data?.status || "Open",
          priority: data?.priority || dto.priority || "Medium",
          createdAt: data?.createdAt || new Date().toISOString(),
          updatedAt: data?.updatedAt || new Date().toISOString(),
          messages: [],
        } as SupportTicketDto;
      } catch (error) {
        console.error("[Support API] Error creating ticket:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[Support API] Ticket created successfully:", data);
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
    },
    onError: (error) => {
      console.error("[Support API] Create ticket error:", error);
    },
  });
};

/**
 * POST /api/chat/conversations/{conversationId}/messages
 * Send a message in a ticket
 */
export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation<SupportMessageDto, Error, SendSupportMessageDto>({
    mutationFn: async (dto) => {
      try {
        console.log("[Support API] Sending message:", dto);

        const response = await apiClient.post(
          `/api/chat/conversations/${dto.ticketId}/messages`,
          {
            content: dto.content,
            messageType: "Text",
            attachmentUrl: dto.attachmentUrl || null,
          },
        );

        console.log("[Support API] Send message response:", response);

        const data = unwrap<any>(response);
        console.log("[Support API] Unwrapped message data:", data);

        // The API might return the message directly or wrapped in data
        const messageData = data?.data || data;

        return {
          id: messageData?.id || "",
          ticketId: dto.ticketId,
          content: messageData?.content || dto.content,
          // Always use "Store" for messages sent by the store owner
          userType: "Store",
          userName: messageData?.userName || messageData?.senderName || "",
          createdAt: messageData?.createdAt || new Date().toISOString(),
          attachmentUrl: messageData?.attachmentUrl || null,
        } as SupportMessageDto;
      } catch (error) {
        console.error("[Support API] Error sending message:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("[Support API] Message sent successfully:", data);

      // Invalidate messages query to refresh the list
      qc.invalidateQueries({
        queryKey: SUPPORT_KEYS.messages(variables.ticketId),
      });

      // Also invalidate tickets to update last message
      qc.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets() });
    },
    onError: (error) => {
      console.error("[Support API] Send message error:", error);
    },
  });
};

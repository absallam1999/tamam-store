import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { formatTime, formatDate } from "@shared/utils/formatters";
import {
  useSupportTickets,
  useSendMessage,
  useCreateTicket,
  useTicketMessages,
} from "@shared/hooks/useStoreSupport";
import { useStoreOrders } from "@shared/hooks/useStoreOrders";
import type { SupportTicketDto, SupportMessageDto } from "@shared/types";

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "الدعم الفني", en: "Technical Support" },
  subtitle: {
    ar: "نحن هنا لمساعدتك. تواصل مع فريق الدعم لدينا",
    en: "We're here to help. Get in touch with our support team",
  },
  newTicket: { ar: "طلب دعم جديد", en: "New Support Ticket" },
  myTickets: { ar: "تذاكري", en: "My Tickets" },
  noTickets: { ar: "لا توجد تذاكر دعم", en: "No support tickets" },
  noTicketsDesc: {
    ar: "ستظهر تذاكر الدعم الخاصة بك هنا",
    en: "Your support tickets will appear here",
  },
  createTicket: { ar: "إنشاء تذكرة", en: "Create Ticket" },
  subject: { ar: "الموضوع", en: "Subject" },
  subjectPlaceholder: { ar: "أدخل موضوع التذكرة", en: "Enter ticket subject" },
  message: { ar: "الرسالة", en: "Message" },
  messagePlaceholder: {
    ar: "اكتب رسالتك هنا...",
    en: "Type your message here...",
  },
  priority: { ar: "الأولوية", en: "Priority" },
  low: { ar: "منخفضة", en: "Low" },
  medium: { ar: "متوسطة", en: "Medium" },
  high: { ar: "عالية", en: "High" },
  urgent: { ar: "عاجلة", en: "Urgent" },
  status: { ar: "الحالة", en: "Status" },
  open: { ar: "مفتوح", en: "Open" },
  inProgress: { ar: "قيد المعالجة", en: "In Progress" },
  resolved: { ar: "تم الحل", en: "Resolved" },
  closed: { ar: "مغلق", en: "Closed" },
  send: { ar: "إرسال", en: "Send" },
  sending: { ar: "جاري الإرسال...", en: "Sending..." },
  cancel: { ar: "إلغاء", en: "Cancel" },
  create: { ar: "إنشاء", en: "Create" },
  creating: { ar: "جاري الإنشاء...", en: "Creating..." },
  typeMessage: { ar: "اكتب رسالتك...", en: "Type your message..." },
  online: { ar: "متصل", en: "Online" },
  offline: { ar: "غير متصل", en: "Offline" },
  supportTeam: { ar: "فريق الدعم", en: "Support Team" },
  selectTicket: { ar: "اختر تذكرة", en: "Select a ticket" },
  selectTicketDesc: {
    ar: "اختر تذكرة من القائمة لعرض المحادثة",
    en: "Select a ticket from the list to view the conversation",
  },
  noMessages: { ar: "لا توجد رسائل", en: "No messages yet" },
  noMessagesDesc: {
    ar: "ابدأ المحادثة بإرسال رسالة",
    en: "Start the conversation by sending a message",
  },
  attachFile: { ar: "إرفاق ملف", en: "Attach File" },
  maxFileSize: { ar: "الحد الأقصى 5MB", en: "Max 5MB" },
  support: { ar: "الدعم الفني", en: "Support" },
  back: { ar: "رجوع", en: "Back" },
  replied: { ar: "تم الرد", en: "Replied" },
  awaitingReply: { ar: "في انتظار الرد", en: "Awaiting reply" },
  loadMessages: { ar: "جارٍ تحميل الرسائل...", en: "Loading messages..." },
  noMessagesYet: { ar: "لا توجد رسائل بعد", en: "No messages yet" },
  startConversation: {
    ar: "ابدأ المحادثة بإرسال رسالة",
    en: "Start the conversation by sending a message",
  },
  ticketInfo: { ar: "معلومات التذكرة", en: "Ticket Info" },
  created: { ar: "تم الإنشاء", en: "Created" },
  order: { ar: "الطلب", en: "Order" },
  noOrder: { ar: "بدون طلب", en: "No order" },
} as const;

const lang = (key: keyof typeof t, isAr: boolean) =>
  isAr ? t[key].ar : t[key].en;

// ============================================================
// Types
// ============================================================

interface Ticket extends SupportTicketDto {
  messages?: SupportMessageDto[];
}

// ============================================================
// Skeleton Loader
// ============================================================

const SkeletonLoader: React.FC<{ isAr: boolean }> = ({ isAr }) => {
  const isRTL = isAr;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
        <div className="space-y-2">
          <div className="skeleton h-7 w-40 rounded-lg" />
          <div className="skeleton h-4 w-56 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Ticket List Skeleton */}
        <div className="w-80 border-l border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton h-4 w-28 rounded-lg" />
            <div className="skeleton h-4 w-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="skeleton h-4 w-36 rounded-lg" />
                    <div className="skeleton h-3 w-28 rounded-lg mt-1.5" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="skeleton h-5 w-16 rounded-lg" />
                    <div className="skeleton h-3 w-14 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area Skeleton */}
        <div className="flex-1 flex flex-col bg-white dark:bg-surface-900">
          {/* Chat Header Skeleton */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-48 rounded-lg" />
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-20 rounded-lg" />
                  <div className="skeleton h-5 w-20 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="skeleton h-4 w-20 rounded-lg" />
          </div>

          {/* Messages Skeleton */}
          <div className="flex-1 px-6 py-4 space-y-4 bg-surface-50/30 dark:bg-surface-900/30">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex items-end gap-3",
                  i % 2 === 0 ? "flex-row" : "flex-row-reverse",
                )}
              >
                <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                <div
                  className={cn(
                    "max-w-[70%] space-y-1.5",
                    i % 2 === 0 ? "items-start" : "items-end",
                  )}
                >
                  <div className="skeleton h-12 w-56 rounded-2xl" />
                  <div className="skeleton h-3 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Skeleton */}
          <div className="border-t border-surface-200 dark:border-surface-800 px-4 py-3 bg-white dark:bg-surface-900">
            <div className="flex items-end gap-2">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="skeleton flex-1 h-12 rounded-xl" />
              <div className="skeleton w-24 h-10 rounded-xl flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Priority Badge
// ============================================================

const PriorityBadge: React.FC<{ priority: string; isAr: boolean }> = ({
  priority,
  isAr,
}) => {
  const config: Record<
    string,
    { bg: string; label: string; icon: React.ReactNode }
  > = {
    Low: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
      label: lang("low", isAr),
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    Medium: {
      bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      label: lang("medium", isAr),
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    High: {
      bg: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
      label: lang("high", isAr),
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    Urgent: {
      bg: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
      label: lang("urgent", isAr),
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const c = config[priority] || config.Medium;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
        c.bg,
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
};

// ============================================================
// Status Badge
// ============================================================

const StatusBadge: React.FC<{ status: string; isAr: boolean }> = ({
  status,
  isAr,
}) => {
  const config: Record<string, { bg: string; dot: string; label: string }> = {
    Open: {
      bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
      dot: "bg-blue-500",
      label: lang("open", isAr),
    },
    InProgress: {
      bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      dot: "bg-amber-500",
      label: lang("inProgress", isAr),
    },
    Resolved: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
      label: lang("resolved", isAr),
    },
    Closed: {
      bg: "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700",
      dot: "bg-surface-400",
      label: lang("closed", isAr),
    },
  };

  const c = config[status] || config.Open;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
        c.bg,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
};

// ============================================================
// Message Bubble - Modern & Clean
// ============================================================

const MessageBubble: React.FC<{
  message: SupportMessageDto;
  isOwn: boolean;
  isAr: boolean;
}> = ({ message, isOwn, isAr }) => {
  const isRTL = isAr;

  return (
    <div
      className={cn(
        "flex items-end gap-3 animate-fade-in",
        isOwn
          ? isRTL
            ? "flex-row-reverse"
            : "flex-row"
          : isRTL
            ? "flex-row"
            : "flex-row-reverse",
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
          isOwn
            ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20"
            : "bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600 text-surface-700 dark:text-surface-300",
        )}
      >
        {isOwn ? "م" : "د"}
      </div>

      <div
        className={cn(
          "max-w-[70%] px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isOwn
            ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/20"
            : "bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700",
          "rounded-2xl",
          isRTL && isOwn ? "rounded-tr-none" : "",
          isRTL && !isOwn ? "rounded-tl-none" : "",
          !isRTL && isOwn ? "rounded-tr-none" : "",
          !isRTL && !isOwn ? "rounded-tl-none" : "",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1.5",
            isRTL ? "justify-start" : "justify-end",
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              isOwn
                ? "text-white/70"
                : "text-surface-400 dark:text-surface-500",
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <svg
              className="w-3 h-3 text-white/50"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================

export const SupportPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const isRTL = isAr;

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState<string>("Medium");
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    data: tickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useSupportTickets();
  const {
    data: messages = [],
    refetch: refetchMessages,
    isLoading: messagesLoading,
  } = useTicketMessages(selectedTicketId || "");
  const sendMessage = useSendMessage();
  const createTicket = useCreateTicket();
  const { data: recentOrders = [] } = useStoreOrders();

  const selectedTicket = (tickets as Ticket[])?.find(
    (t) => t.id === selectedTicketId,
  );

  // Refetch messages when a ticket is selected
  useEffect(() => {
    if (selectedTicketId) {
      refetchMessages();
    }
  }, [selectedTicketId, refetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedTicketId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage.mutateAsync({
        ticketId: selectedTicketId,
        content: newMessage.trim(),
      });
      setNewMessage("");
      textareaRef.current?.focus();

      // Refetch messages to get the updated list
      await refetchMessages();
      // Also refetch tickets to update the last message preview
      await refetchTickets();
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(isAr ? "فشل إرسال الرسالة" : "Failed to send message", {
        description: isAr ? "يرجى المحاولة مرة أخرى" : "Please try again",
      });
    } finally {
      setIsSending(false);
    }
  }, [
    newMessage,
    selectedTicketId,
    isSending,
    sendMessage,
    refetchMessages,
    refetchTickets,
    isAr,
    toast,
  ]);

  const handleCreateTicket = useCallback(async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || isCreating)
      return;

    setIsCreating(true);
    try {
      const ticket = await createTicket.mutateAsync({
        subject: newTicketSubject.trim(),
        message: newTicketMessage.trim(),
        priority: newTicketPriority,
        orderId: selectedOrderId || null,
      });
      setShowNewTicket(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      setNewTicketPriority("Medium");
      setSelectedOrderId("");
      setSelectedTicketId(ticket.id);

      await refetchTickets();
      await refetchMessages();

      toast.success(
        isAr ? "تم إنشاء التذكرة بنجاح" : "Ticket created successfully",
        {
          description: isAr
            ? "سيتم الرد عليك قريباً"
            : "You will be responded to shortly",
        },
      );
    } catch (err: any) {
      let errorMessage = isAr ? "فشل إنشاء التذكرة" : "Failed to create ticket";
      let errorDescription = isAr
        ? "يرجى المحاولة مرة أخرى"
        : "Please try again";

      if (err?.response?.data) {
        const responseData = err.response.data;
        errorMessage =
          responseData?.Message || responseData?.message || errorMessage;
        if (
          errorMessage.includes("DbUpdateException") ||
          errorMessage.includes("database")
        ) {
          errorDescription = isAr
            ? "تأكّد من اكتمال بيانات متجرك. إذا استمرت المشكلة، تواصل مع الدعم."
            : "Make sure your store profile is complete. If the issue persists, contact support.";
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { description: errorDescription });
    } finally {
      setIsCreating(false);
    }
  }, [
    newTicketSubject,
    newTicketMessage,
    isCreating,
    createTicket,
    newTicketPriority,
    selectedOrderId,
    refetchTickets,
    refetchMessages,
    isAr,
    toast,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [newMessage]);

  if (ticketsLoading) {
    return <SkeletonLoader isAr={isAr} />;
  }

  return (
    <div
      className={cn(
        "h-[calc(100vh-80px)] flex flex-col bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800",
        isRTL ? "text-right" : "text-left",
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/80 to-surface-100/50 dark:from-surface-900/80 dark:to-surface-800/50 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            {lang("title", isAr)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {lang("subtitle", isAr)}
          </p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:scale-95 transition-all duration-200 shadow-lg shadow-primary-500/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {lang("newTicket", isAr)}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Ticket List */}
        <div
          className={cn(
            "w-80 border-l border-surface-200 dark:border-surface-800 overflow-y-auto flex-shrink-0 bg-surface-50/30 dark:bg-surface-900/30",
            isRTL ? "border-l-0 border-r" : "border-r-0 border-l",
          )}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                {lang("myTickets", isAr)}
              </span>
              <span className="text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-200 dark:bg-surface-800 px-2.5 py-0.5 rounded-full">
                {tickets?.length || 0}
              </span>
            </div>

            {tickets && tickets.length > 0 ? (
              <div className="space-y-2">
                {(tickets as Ticket[])?.map((ticket) => {
                  const isActive = ticket.id === selectedTicketId;
                  const lastMessage =
                    ticket.messages?.[ticket.messages.length - 1];

                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary-50 dark:bg-primary-500/10 border-2 border-primary-500/30 dark:border-primary-500/30 shadow-sm shadow-primary-500/5"
                          : "hover:bg-surface-100 dark:hover:bg-surface-800 border-2 border-transparent",
                        isRTL && "text-right",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              isActive
                                ? "text-primary-700 dark:text-primary-400"
                                : "text-surface-900 dark:text-white",
                            )}
                          >
                            {ticket.subject}
                          </p>
                          {lastMessage && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-1">
                              {lastMessage.content}
                            </p>
                          )}
                          {!lastMessage &&
                            ticket.messages &&
                            ticket.messages.length === 0 && (
                              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1 italic">
                                {lang("noMessagesYet", isAr)}
                              </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <StatusBadge status={ticket.status} isAr={isAr} />
                          <span className="text-[10px] text-surface-400 font-medium">
                            {formatTime(ticket.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-surface-300 dark:text-surface-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  {lang("noTickets", isAr)}
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                  {lang("noTicketsDesc", isAr)}
                </p>
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                >
                  {lang("createTicket", isAr)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-surface-900">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/50 to-surface-100/30 dark:from-surface-900/50 dark:to-surface-800/30">
                <div
                  className={cn(
                    "flex items-center gap-3",
                    isRTL && "flex-row-reverse",
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-600/20 flex items-center justify-center shadow-lg shadow-primary-500/10 flex-shrink-0">
                    <svg
                      className={cn(
                        "w-6 h-6 text-primary-500 transition-transform duration-200",
                        isRTL && "scale-x-[-1]",
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                      />
                    </svg>
                  </div>
                  <div
                    className={cn(
                      "flex-1 min-w-0",
                      isRTL ? "text-right" : "text-left",
                    )}
                  >
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                      {selectedTicket.subject}
                    </p>
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-0.5 flex-wrap",
                        isRTL ? "flex-row-reverse" : "flex-row",
                      )}
                    >
                      <StatusBadge status={selectedTicket.status} isAr={isAr} />
                      <PriorityBadge
                        priority={selectedTicket.priority}
                        isAr={isAr}
                      />
                      <span className="text-[10px] text-surface-400">
                        • {lang("created", isAr)}{" "}
                        {formatDate(selectedTicket.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-surface-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lang("online", isAr)}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-surface-50/30 to-white dark:from-surface-900/30 dark:to-surface-900">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-3 text-surface-500 dark:text-surface-400">
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm">
                        {lang("loadMessages", isAr)}
                      </span>
                    </div>
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg: SupportMessageDto, idx: number) => (
                    <MessageBubble
                      key={msg.id || idx}
                      message={msg}
                      isOwn={msg.userType === "Store"}
                      isAr={isAr}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-surface-300 dark:text-surface-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                      {lang("noMessages", isAr)}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      {lang("startConversation", isAr)}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-surface-200 dark:border-surface-800 px-4 py-3 bg-white dark:bg-surface-900">
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
                    title={lang("attachFile", isAr)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                      />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang("typeMessage", isAr)}
                    className={cn(
                      "flex-1 resize-none rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all min-h-[44px] max-h-32",
                      isRTL && "text-right",
                    )}
                    rows={1}
                    style={{ height: "44px" }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 shadow-lg shadow-primary-500/20",
                      isSending && "opacity-70",
                    )}
                  >
                    {isSending ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {lang("sending", isAr)}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {lang("send", isAr)}
                        </span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1.5">
                  {lang("maxFileSize", isAr)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
                <svg
                  className="w-12 h-12 text-surface-300 dark:text-surface-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.25 21a5.972 5.972 0 0 1-2.25-3.903A7.5 7.5 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                {lang("selectTicket", isAr)}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mt-1">
                {lang("selectTicketDesc", isAr)}
              </p>
              <button
                onClick={() => setShowNewTicket(true)}
                className="mt-5 px-6 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 active:scale-95 transition-all duration-200 shadow-lg shadow-primary-500/20"
              >
                {lang("createTicket", isAr)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) =>
            e.target === e.currentTarget && setShowNewTicket(false)
          }
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-scale bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-gradient-to-r from-surface-50/80 to-surface-100/50 dark:from-surface-900/80 dark:to-surface-800/50">
              <div className={cn(isRTL && "text-right")}>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                  {lang("newTicket", isAr)}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {isAr
                    ? "املأ البيانات لإنشاء تذكرة جديدة"
                    : "Fill in the details to create a new ticket"}
                </p>
              </div>
              <button
                onClick={() => setShowNewTicket(false)}
                className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Subject */}
              <div className={cn("space-y-1.5", isRTL && "text-right")}>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300">
                  {lang("subject", isAr)}
                </label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder={lang("subjectPlaceholder", isAr)}
                  className={cn(
                    "w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all",
                    isRTL ? "text-right" : "text-left",
                  )}
                />
              </div>

              {/* Order Selection (Optional) */}
              <div className={cn("space-y-1.5", isRTL && "text-right")}>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300">
                  {isAr ? "مرتبط بطلب (اختياري)" : "Related Order (Optional)"}
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className={cn(
                    "w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all",
                    isRTL && "text-right",
                  )}
                >
                  <option value="">
                    {isAr
                      ? "بدون طلب (تذكرة عامة)"
                      : "No order (General ticket)"}
                  </option>
                  {recentOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.orderNumber} — {order.totalAmount} EGP
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className={cn("space-y-1.5", isRTL && "text-right")}>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300">
                  {lang("priority", isAr)}
                </label>
                <select
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value)}
                  className={cn(
                    "w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all",
                    isRTL && "text-right",
                  )}
                >
                  <option value="Low">{lang("low", isAr)}</option>
                  <option value="Medium">{lang("medium", isAr)}</option>
                  <option value="High">{lang("high", isAr)}</option>
                  <option value="Urgent">{lang("urgent", isAr)}</option>
                </select>
              </div>

              {/* Message */}
              <div className={cn("space-y-1.5", isRTL && "text-right")}>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300">
                  {lang("message", isAr)}
                </label>
                <textarea
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder={lang("messagePlaceholder", isAr)}
                  rows={4}
                  className={cn(
                    "w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all resize-none",
                    isRTL ? "text-right" : "text-left",
                  )}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewTicket(false)}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
                >
                  {lang("cancel", isAr)}
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={
                    !newTicketSubject.trim() ||
                    !newTicketMessage.trim() ||
                    isCreating
                  }
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20",
                  )}
                >
                  {isCreating ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>{lang("creating", isAr)}</span>
                    </>
                  ) : (
                    <span>{lang("create", isAr)}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;

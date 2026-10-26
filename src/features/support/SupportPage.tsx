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
  useMarkTicketRead,
  useCloseTicket,
} from "@shared/hooks/useStoreSupport";
import { useStoreOrders } from "@shared/hooks/useStoreOrders";
import { storeApi } from "@/config/store.api";
import type { MessageDto } from "@shared/types";

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
  status: { ar: "الحالة", en: "Status" },
  open: { ar: "مفتوح", en: "Open" },
  closed: { ar: "مغلق", en: "Closed" },
  closeTicket: { ar: "إغلاق التذكرة", en: "Close Ticket" },
  closeConfirm: {
    ar: "هل تريد إغلاق هذه التذكرة؟",
    en: "Close this ticket?",
  },
  send: { ar: "إرسال", en: "Send" },
  sending: { ar: "جاري الإرسال...", en: "Sending..." },
  cancel: { ar: "إلغاء", en: "Cancel" },
  create: { ar: "إنشاء", en: "Create" },
  creating: { ar: "جاري الإنشاء...", en: "Creating..." },
  typeMessage: { ar: "اكتب رسالتك...", en: "Type your message..." },
  online: { ar: "متصل", en: "Online" },
  supportTeam: { ar: "فريق الدعم", en: "Support Team" },
  selectTicket: { ar: "اختر تذكرة", en: "Select a ticket" },
  selectTicketDesc: {
    ar: "اختر تذكرة من القائمة لعرض المحادثة",
    en: "Select a ticket from the list to view the conversation",
  },
  noMessages: { ar: "لا توجد رسائل", en: "No messages yet" },
  startConversation: {
    ar: "ابدأ المحادثة بإرسال رسالة",
    en: "Start the conversation by sending a message",
  },
  attachFile: { ar: "إرفاق ملف", en: "Attach File" },
  maxFileSize: { ar: "الحد الأقصى 5MB", en: "Max 5MB" },
  back: { ar: "رجوع", en: "Back" },
  loadMessages: { ar: "جارٍ تحميل الرسائل...", en: "Loading messages..." },
  created: { ar: "تم الإنشاء", en: "Created" },
  optionalOrder: { ar: "مرتبط بطلب (اختياري)", en: "Related Order (Optional)" },
  noOrder: { ar: "بدون طلب (تذكرة عامة)", en: "No order (General ticket)" },
  fileUploadError: { ar: "فشل إرفاق الملف", en: "Failed to attach file" },
  fileTooLarge: {
    ar: "حجم الملف يجب أن يكون أقل من 5MB",
    en: "File size must be less than 5MB",
  },
  ticketClosed: { ar: "تم إغلاق التذكرة", en: "Ticket closed" },
  closeError: { ar: "فشل إغلاق التذكرة", en: "Failed to close ticket" },
} as const;

const lang = (key: keyof typeof t, isAr: boolean) =>
  isAr ? t[key].ar : t[key].en;

// ============================================================
// Skeleton Loader (unchanged)
// ============================================================

const SkeletonLoader: React.FC<{ isAr: boolean }> = ({ isAr }) => {
  const isRTL = isAr;

  return (
    <div className="h-[calc(100dvh-80px)] flex flex-col bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
        <div className="space-y-2">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-28 sm:w-36 rounded-xl" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex w-80 flex-col border-l border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30 p-4">
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

        <div className="flex-1 flex flex-col bg-white dark:bg-surface-900">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/30">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-40 sm:w-48 rounded-lg" />
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-20 rounded-lg" />
                  <div className="skeleton h-5 w-20 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="skeleton h-4 w-16 rounded-lg" />
          </div>
          <div className="flex-1 px-4 sm:px-6 py-4 space-y-4 bg-surface-50/30 dark:bg-surface-900/30">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex items-end gap-3",
                  i % 2 === 0 ? "flex-row" : "flex-row-reverse",
                )}
              >
                <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                <div className="max-w-[70%] space-y-1.5">
                  <div className="skeleton h-12 w-48 sm:w-56 rounded-2xl" />
                  <div className="skeleton h-3 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 dark:border-surface-800 px-4 py-3 bg-white dark:bg-surface-900">
            <div className="flex items-end gap-2">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="skeleton flex-1 h-12 rounded-xl" />
              <div className="skeleton w-20 sm:w-24 h-10 rounded-xl flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Status Badge — only Open / Closed exist on ChatStatus
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
// Message Bubble — senderType + attachment support
// ============================================================

const MessageBubble: React.FC<{
  message: MessageDto;
  isOwn: boolean;
  isAr: boolean;
}> = ({ message, isOwn, isAr }) => {
  return (
    <div
      className={cn(
        "flex items-end gap-3 animate-fade-in max-w-full w-fit",
        isOwn ? "me-auto flex-row" : "ms-auto flex-row-reverse",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold overflow-hidden",
          isOwn
            ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20"
            : "bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600 text-surface-700 dark:text-surface-300",
        )}
      >
        {message.senderProfilePictureUrl ? (
          <img
            src={message.senderProfilePictureUrl}
            alt={message.senderName ?? ""}
            className="w-full h-full object-cover"
          />
        ) : isOwn ? (
          isAr ? "أ" : "Y"
        ) : isAr ? (
          "د"
        ) : (
          "S"
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[70%] px-4 py-2.5 text-sm leading-relaxed shadow-sm rounded-2xl",
          isOwn
            ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/20 rounded-ss-none"
            : "bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700 rounded-se-none",
        )}
      >
        {message.attachmentUrl && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium underline mb-1",
              isOwn ? "text-white/90" : "text-primary-600 dark:text-primary-400",
            )}
          >
            <svg
              className="w-3.5 h-3.5"
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
            {message.messageType === "Image"
              ? isAr
                ? "صورة"
                : "Image"
              : isAr
                ? "ملف مرفق"
                : "Attachment"}
          </a>
        )}

        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Timestamp + check — justify-end is already RTL-aware */}
        <div className="flex items-center gap-1.5 mt-1.5 justify-end">
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
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useSupportTickets();
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessages(
    selectedTicketId ?? "",
  );
  const sendMessage = useSendMessage();
  const createTicket = useCreateTicket();
  const markRead = useMarkTicketRead();
  const closeTicket = useCloseTicket();
  const { data: recentOrders = [] } = useStoreOrders();

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [messages]);

  // Mark read whenever a ticket is opened
  useEffect(() => {
    if (selectedTicketId) {
      markRead.mutate(selectedTicketId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedTicketId || sendMessage.isPending) return;
    try {
      await sendMessage.mutateAsync({
        ticketId: selectedTicketId,
        content: newMessage.trim(),
      });
      setNewMessage("");
      textareaRef.current?.focus();
    } catch {
      toast.error(isAr ? "فشل إرسال الرسالة" : "Failed to send message");
    }
  }, [newMessage, selectedTicketId, sendMessage, isAr, toast]);

  const handleCreateTicket = useCallback(async () => {
    if (
      !newTicketSubject.trim() ||
      !newTicketMessage.trim() ||
      createTicket.isPending
    )
      return;
    try {
      const conversation = await createTicket.mutateAsync({
        subject: newTicketSubject.trim(),
        message: newTicketMessage.trim(),
        orderId: selectedOrderId || undefined,
      });
      setShowNewTicket(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      setSelectedOrderId("");
      setSelectedTicketId(conversation.id);
      toast.success(
        isAr ? "تم إنشاء التذكرة بنجاح" : "Ticket created successfully",
      );
    } catch (err: any) {
      toast.error(
        err?.message ||
          (isAr ? "فشل إنشاء التذكرة" : "Failed to create ticket"),
      );
    }
  }, [
    newTicketSubject,
    newTicketMessage,
    createTicket,
    selectedOrderId,
    isAr,
    toast,
  ]);

  const handleCloseTicket = useCallback(async () => {
    if (!selectedTicketId || closeTicket.isPending) return;
    try {
      await closeTicket.mutateAsync({ ticketId: selectedTicketId });
      toast.success(lang("ticketClosed", isAr));
    } catch {
      toast.error(lang("closeError", isAr));
    }
  }, [selectedTicketId, closeTicket, isAr, toast]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !selectedTicketId || sendMessage.isPending) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error(lang("fileTooLarge", isAr));
        return;
      }

      try {
        const upload = await storeApi.files.upload(file, "general");
        await sendMessage.mutateAsync({
          ticketId: selectedTicketId,
          content: file.name,
          attachmentUrl: upload.url,
          messageType: file.type.startsWith("image/") ? "Image" : "File",
        });
      } catch {
        toast.error(lang("fileUploadError", isAr));
      }
    },
    [selectedTicketId, sendMessage, isAr, toast],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // Auto-size textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [newMessage]);

  if (ticketsLoading) return <SkeletonLoader isAr={isAr} />;

  return (
    <div
      className={cn(
        "h-[calc(100dvh-80px)] flex flex-col bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800",
        isRTL ? "text-right" : "text-left",
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/80 to-surface-100/50 dark:from-surface-900/80 dark:to-surface-800/50">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-5 sm:w-6 h-5 sm:h-6 text-primary-500"
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
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {lang("subtitle", isAr)}
          </p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary-600 text-white text-xs sm:text-sm font-medium hover:bg-primary-700 active:scale-95 transition-all duration-200 shadow-lg shadow-primary-500/20"
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
          <span className="hidden sm:inline">{lang("newTicket", isAr)}</span>
          <span className="sm:hidden">{isAr ? "جديد" : "New"}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Ticket List */}
        <div
          className={cn(
            "w-full md:w-80 flex-shrink-0 overflow-y-auto bg-surface-50/30 dark:bg-surface-900/30 border-l border-surface-200 dark:border-surface-800",
            selectedTicket ? "hidden md:flex md:flex-col" : "flex flex-col",
            isRTL ? "md:border-l-0 md:border-r" : "md:border-r-0 md:border-l",
          )}
        >
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                {lang("myTickets", isAr)}
              </span>
              <span className="text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-200 dark:bg-surface-800 px-2.5 py-0.5 rounded-full">
                {tickets.length}
              </span>
            </div>

            {tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.map((ticket) => {
                  const isActive = ticket.id === selectedTicketId;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={cn(
                        "w-full text-left p-3 sm:p-4 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary-50 dark:bg-primary-500/10 border-2 border-primary-500/30 dark:border-primary-500/30 shadow-sm"
                          : "hover:bg-surface-100 dark:hover:bg-surface-800 border-2 border-transparent",
                        isRTL && "text-right",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">
                              {ticket.subject ?? (isAr ? "تذكرة دعم" : "Support Ticket")}
                            </p>
                            {ticket.unreadCount > 0 && (
                              <span className="flex-shrink-0 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {ticket.unreadCount}
                              </span>
                            )}
                          </div>
                          {ticket.lastMessagePreview && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-1">
                              {ticket.lastMessagePreview}
                            </p>
                          )}
                          {!ticket.lastMessagePreview && (
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1 italic">
                              {lang("noMessages", isAr)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <StatusBadge status={ticket.status ?? "Open"} isAr={isAr} />
                          <span className="text-[10px] text-surface-400">
                            {formatTime(ticket.lastMessageAt ?? ticket.createdAt)}
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
        <div
          className={cn(
            "flex-1 flex flex-col bg-white dark:bg-surface-900",
            selectedTicket ? "flex" : "hidden md:flex",
          )}
        >
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-200 dark:border-surface-800 bg-gradient-to-r from-surface-50/50 to-surface-100/30 dark:from-surface-900/50 dark:to-surface-800/30">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="md:hidden p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                    aria-label={lang("back", isAr)}
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
                        d={
                          isRTL
                            ? "M8.25 4.5l7.5 7.5-7.5 7.5"
                            : "M15.75 19.5 8.25 12l7.5-7.5"
                        }
                      />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-600/20 flex items-center justify-center shadow-lg shadow-primary-500/10 flex-shrink-0">
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
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                      {selectedTicket.subject ??
                        (isAr ? "تذكرة دعم" : "Support Ticket")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <StatusBadge
                        status={selectedTicket.status ?? "Open"}
                        isAr={isAr}
                      />
                      <span className="text-[10px] text-surface-400 hidden sm:inline">
                        • {lang("created", isAr)}{" "}
                        {formatDate(selectedTicket.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  {selectedTicket.status === "Open" ? (
                    <button
                      onClick={handleCloseTicket}
                      disabled={closeTicket.isPending}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                      {lang("closeTicket", isAr)}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                      {lang("closed", isAr)}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-gradient-to-b from-surface-50/30 to-white dark:from-surface-900/30 dark:to-surface-900">
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
                      <span className="text-sm">{lang("loadMessages", isAr)}</span>
                    </div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderType === "Store"}
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
              <div className="border-t border-surface-200 dark:border-surface-800 px-3 sm:px-4 py-3 bg-white dark:bg-surface-900">
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      selectedTicket.status === "Closed" || sendMessage.isPending
                    }
                    className="p-2.5 rounded-xl text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0 disabled:opacity-50"
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
                    onChange={handleFileSelect}
                  />
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang("typeMessage", isAr)}
                    disabled={selectedTicket.status === "Closed"}
                    className={cn(
                      "flex-1 resize-none rounded-xl px-3 sm:px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all min-h-[44px] max-h-32 disabled:opacity-60",
                      isRTL && "text-right",
                    )}
                    rows={1}
                    style={{ height: "44px" }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      !newMessage.trim() ||
                      sendMessage.isPending ||
                      selectedTicket.status === "Closed"
                    }
                    className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 shadow-lg shadow-primary-500/20"
                  >
                    {sendMessage.isPending ? (
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

      {/* New Ticket Modal — priority removed, order/subject/message kept */}
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
            <div className="px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-gradient-to-r from-surface-50/80 to-surface-100/50 dark:from-surface-900/80 dark:to-surface-800/50">
              <div className={cn(isRTL && "text-right")}>
                <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-white">
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
            <div className="p-4 sm:p-6 space-y-4">
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
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all"
                />
              </div>

              {/* Order Selection */}
              <div className={cn("space-y-1.5", isRTL && "text-right")}>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300">
                  {lang("optionalOrder", isAr)}
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all"
                >
                  <option value="">{lang("noOrder", isAr)}</option>
                  {recentOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.orderNumber} — {order.totalAmount} EGP
                    </option>
                  ))}
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
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 border-2 border-surface-200 dark:border-surface-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-surface-50 dark:focus:bg-surface-800/50 transition-all resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewTicket(false)}
                  disabled={createTicket.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
                >
                  {lang("cancel", isAr)}
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={
                    !newTicketSubject.trim() ||
                    !newTicketMessage.trim() ||
                    createTicket.isPending
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20"
                >
                  {createTicket.isPending ? (
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
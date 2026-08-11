import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import { cn } from "@shared/utils/cn";
import { getRelativeTime } from "@shared/utils/formatters";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@shared/hooks/useStoreNotifications";

// ============================================================
// Translations
// ============================================================

const t = {
  title: { ar: "الإشعارات", en: "Notifications" },
  subtitle: {
    ar: "متابعة جميع إشعارات ونشاطات متجرك",
    en: "Stay updated with your store activity",
  },
  total: { ar: "الإجمالي", en: "Total" },
  unread: { ar: "غير مقروء", en: "Unread" },
  read: { ar: "مقروء", en: "Read" },
  filterAll: { ar: "الكل", en: "All" },
  filterUnread: { ar: "غير مقروء", en: "Unread" },
  markAllRead: { ar: "تحديد الكل كمقروء", en: "Mark All Read" },
  deleteAll: { ar: "حذف الكل", en: "Delete All" },
  delete: { ar: "حذف", en: "Delete" },
  noNotifications: { ar: "لا توجد إشعارات", en: "No Notifications" },
  noNotificationsYet: {
    ar: "ليس لديك أي إشعارات حتى الآن",
    en: "You have no notifications yet",
  },
  noUnread: { ar: "لا توجد إشعارات غير مقروءة", en: "No unread notifications" },
  markAllSuccess: { ar: "تم تحديد الكل كمقروء", en: "All marked as read" },
  markAllError: {
    ar: "فشل تحديث الإشعارات",
    en: "Failed to update notifications",
  },
  deleteSuccess: { ar: "تم حذف الإشعار", en: "Notification deleted" },
  deleteAllSuccess: {
    ar: "تم حذف جميع الإشعارات",
    en: "All notifications deleted",
  },
  deleteAllConfirm: {
    ar: "هل أنت متأكد من حذف جميع الإشعارات؟",
    en: "Delete all notifications?",
  },
  error: { ar: "حدث خطأ", en: "An error occurred" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },
};

// ============================================================
// Notification type icons
// ============================================================

const typeIcons: Record<string, { bg: string; icon: React.ReactNode }> = {
  order: {
    bg: "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </svg>
    ),
  },
  payment: {
    bg: "bg-info-100 dark:bg-info-500/10 text-info-600 dark:text-info-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  system: {
    bg: "bg-warning-100 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
  message: {
    bg: "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      </svg>
    ),
  },
};

const defaultTypeIcon = {
  bg: "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400",
  icon: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  ),
};

// ============================================================
// Main Component
// ============================================================

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: notifications = [], isLoading } = useNotifications(page, 20);
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();

  const unreadCount = unreadData ?? 0;
  const totalCount = notifications.length;

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success(lang(t.markAllSuccess));
    } catch {
      toast.error(lang(t.markAllError));
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification.mutateAsync(id);
      toast.success(lang(t.deleteSuccess));
    } catch {
      toast.error(lang(t.error));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(lang(t.deleteAllConfirm))) return;
    try {
      await deleteAllNotifications.mutateAsync();
      toast.success(lang(t.deleteAllSuccess));
    } catch {
      toast.error(lang(t.error));
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) handleMarkRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-12",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {lang(t.title)}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {lang(t.subtitle)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
              className="btn btn-ghost btn-sm"
            >
              {markAllAsRead.isPending ? (
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
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              )}
              {lang(t.markAllRead)}
            </button>
          )}
          {totalCount > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deleteAllNotifications.isPending}
              className="btn btn-ghost btn-sm text-error-600 hover:text-error-700 dark:text-error-400"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              {lang(t.deleteAll)}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            value: totalCount,
            label: lang(t.total),
            color:
              "bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
          },
          {
            value: unreadCount,
            label: lang(t.unread),
            color:
              "bg-warning-100 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400",
          },
          {
            value: notifications.filter((n) => n.isRead).length,
            label: lang(t.read),
            color:
              "bg-success-100 dark:bg-success-500/10 text-success-600 dark:text-success-400",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm text-center"
          >
            <p className="text-2xl font-bold text-surface-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "all", label: lang(t.filterAll), count: totalCount },
          { key: "unread", label: lang(t.filterUnread), count: unreadCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as "all" | "unread")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              filter === f.key
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700",
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 animate-pulse flex items-start gap-4"
            >
              <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-20 rounded-md" />
                <div className="skeleton h-4 w-3/4 rounded-md" />
                <div className="skeleton h-3 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800">
          <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
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
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-surface-500 dark:text-surface-400 mb-1">
            {lang(t.noNotifications)}
          </p>
          <p className="text-sm text-surface-400 dark:text-surface-500">
            {filter === "unread"
              ? lang(t.noUnread)
              : lang(t.noNotificationsYet)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((n) => {
            const typeCfg = typeIcons[n.type] ?? defaultTypeIcon;
            return (
              <div
                key={n.id}
                className={cn(
                  "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 transition-all duration-200 cursor-pointer group",
                  "hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-md",
                  !n.isRead &&
                    "border-primary-200 dark:border-primary-500/20 bg-primary-50/30 dark:bg-primary-500/5",
                )}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      typeCfg.bg,
                    )}
                  >
                    {typeCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                        {n.type}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-1">
                      {n.title}
                    </h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-2">
                      {getRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    disabled={deletingId === n.id}
                    className="p-2 rounded-xl text-surface-400 hover:text-error-600 hover:bg-error-50 dark:hover:text-error-400 dark:hover:bg-error-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 disabled:opacity-50"
                    title={lang(t.delete)}
                  >
                    {deletingId === n.id ? (
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
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-ghost btn-sm"
          >
            {lang(t.previous)}
          </button>
          <span className="text-sm text-surface-500 dark:text-surface-400">
            {page} / {Math.ceil(totalCount / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= totalCount}
            className="btn btn-ghost btn-sm"
          >
            {lang(t.next)}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

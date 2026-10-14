
import React from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Clock,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const NotificationsModal = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-up Sheet */}
      <div className="bg-white rounded-t-3xl max-h-[80%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Notifications
              </h2>

              <span className="text-[11px] text-slate-400 block -mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread update(s)`
                  : 'All caught up'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-50"
              >
                Mark all read
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[160px] max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6" />
              </div>

              <p className="text-xs font-semibold text-slate-600">
                No notifications yet
              </p>

              <p className="text-[11px] text-slate-400 max-w-[200px]">
                You'll receive live in-app alerts when a skilled technician
                accepts your service requests.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 relative ${
                  !item.isRead
                    ? 'bg-blue-50/60 border-blue-200/90 shadow-2xs hover:bg-blue-50'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !item.isRead
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      🔔 {item.title}
                    </h3>

                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-snug">
                    "{item.message}"
                  </p>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1.5 font-medium">
                    <Clock className="w-3 h-3" />

                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 text-center text-[11px] text-slate-400 bg-slate-50 rounded-b-3xl">
          Tap notification to view live worker dispatch details
        </div>
      </div>
    </div>
  );
};

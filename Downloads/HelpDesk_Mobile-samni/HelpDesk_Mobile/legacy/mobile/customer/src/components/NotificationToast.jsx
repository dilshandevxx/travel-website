
import React from 'react';
import { Bell, ChevronRight, X } from 'lucide-react';

export const NotificationToast = ({
  notification,
  onDismiss,
  onTap,
}) => {
  if (!notification) return null;

  return (
    <div className="absolute top-2 inset-x-3 z-50 animate-in slide-in-from-top-4 duration-300">
      <div
        onClick={() => onTap(notification)}
        className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-900 transition group"
      >
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              HelpDesk Colombo
            </span>

            <span className="text-[10px] text-slate-400">
              • Just now
            </span>
          </div>

          <h4 className="text-xs font-bold text-white truncate mt-0.5">
            {notification.title}
          </h4>

          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
            {notification.message}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-blue-400 group-hover:underline">
            View
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-blue-400" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1 -mr-1 rounded-full text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

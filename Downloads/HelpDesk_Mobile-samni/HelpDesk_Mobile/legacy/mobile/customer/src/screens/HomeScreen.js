
import React from 'react';
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Wind,
  Tv,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
  Bell,
} from 'lucide-react';

export const HomeScreen = ({
  onSelectService,
  onRequestViewRecent,
  activeRequestId,
  unreadCount = 0,
  onOpenNotifications,
}) => {
  const categories = [
    {
      id: 'plumbing',
      name: 'Plumbing',
      icon: Wrench,
      enabled: true,
      tag: 'Popular',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'electrical',
      name: 'Electrical',
      icon: Zap,
      enabled: false,
      tag: 'Coming soon',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      id: 'carpentry',
      name: 'Carpentry',
      icon: Hammer,
      enabled: false,
      tag: 'Coming soon',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'painting',
      name: 'Painting',
      icon: Paintbrush,
      enabled: false,
      tag: 'Coming soon',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      id: 'ac',
      name: 'AC & Refrigeration',
      icon: Wind,
      enabled: false,
      tag: 'Coming soon',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      id: 'appliance',
      name: 'Appliance Repair',
      icon: Tv,
      enabled: false,
      tag: 'Coming soon',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'cleaning',
      name: 'Cleaning',
      icon: Sparkles,
      enabled: false,
      tag: 'Coming soon',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white px-5 pt-7 pb-5 border-b border-slate-100 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              HelpDesk Colombo
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Good morning 👋
            </h1>

            <p className="text-sm text-slate-500 mt-0.5">
              What do you need help with today?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer border border-slate-200/80 active:scale-95"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-xs border border-blue-200">
              NF
            </div>
          </div>
        </div>

        {/* Location chip */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
          <span className="text-blue-600 font-bold">📍</span>
          Colombo 03, Western Province
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Active Job Alert banner if exists */}
        {activeRequestId && (
          <div
            onClick={() =>
              onRequestViewRecent &&
              onRequestViewRecent(activeRequestId)
            }
            className="p-3.5 rounded-xl bg-blue-600 text-white flex items-center justify-between cursor-pointer hover:bg-blue-700 transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>

              <div>
                <div className="text-xs font-medium text-blue-100">
                  Live Request #{activeRequestId}
                </div>

                <div className="text-sm font-semibold">
                  Track plumbing service status
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-white/80" />
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Service Categories
          </h2>

          <span className="text-xs text-slate-500 font-medium">
            Select a category
          </span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {categories.map((cat) => {
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.enabled) {
                    onSelectService(cat.name);
                  }
                }}
                disabled={!cat.enabled}
                className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                  cat.enabled
                    ? 'bg-white border-blue-200 shadow-xs hover:border-blue-500 hover:shadow-md cursor-pointer group active:scale-[0.98]'
                    : 'bg-white/60 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between w-full mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${cat.bgColor} flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {cat.tag && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        cat.enabled
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cat.tag}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-0.5">
                    {cat.enabled
                      ? 'Tap to book instant repair'
                      : 'Next update'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            HelpDesk University Guarantee
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            All tradesmen are background-checked and skill-verified in the
            Western Province network.
          </p>

          <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              4.9 Avg Rating
            </span>

            <span>•</span>

            <span>⚡ 15-min Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};


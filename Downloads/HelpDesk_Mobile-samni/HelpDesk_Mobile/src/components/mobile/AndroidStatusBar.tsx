import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

interface AndroidStatusBarProps {
  theme?: 'light' | 'dark';
  carrier?: string;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ 
  theme = 'dark',
  carrier = 'Mobitel 5G'
}) => {
  const [time, setTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours % 12 || 12}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div 
      className={`w-full px-5 pt-2 pb-1.5 flex items-center justify-between text-xs select-none shrink-0 z-20 ${
        isDark ? 'bg-slate-900 text-slate-200' : 'bg-slate-800 text-slate-100'
      }`}
    >
      {/* Left: Clock & Network */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-[11px] tracking-tight">{time}</span>
        <span className="text-[9px] text-slate-400 font-medium hidden xs:inline">{carrier}</span>
      </div>

      {/* Center: Punch hole camera placeholder */}
      <div className="w-3 h-3 rounded-full bg-black/60 border border-slate-700/50 shadow-inner flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-slate-900/80" />
      </div>

      {/* Right: Cellular, Wi-Fi & Battery */}
      <div className="flex items-center gap-2">
        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 h-2.5">
          <div className="w-0.5 h-1 bg-current rounded-xs" />
          <div className="w-0.5 h-1.5 bg-current rounded-xs" />
          <div className="w-0.5 h-2 bg-current rounded-xs" />
          <div className="w-0.5 h-2.5 bg-current rounded-xs" />
        </div>

        {/* WiFi Icon */}
        <Wifi className="w-3 h-3" />

        {/* Battery with percentage */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold">98%</span>
          <div className="relative flex items-center">
            <Battery className="w-4 h-4" />
            <div className="absolute left-[3px] top-[4px] bottom-[4px] right-[5px] bg-emerald-400 rounded-2xs" />
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { useApp } from '../../context/AppContext';

export const NotificationToast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const bgColors = {
    success: 'bg-[#1f1a1d] text-white border-[#7e4e78]',
    error: 'bg-[#ba1a1a] text-white border-[#93000a]',
    info: 'bg-[#6e5769] text-white border-[#4e444b]',
  };

  const iconName = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  }[toast.type];

  return (
    <div 
      id="notification-toast"
      className="fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${bgColors[toast.type]}`}>
        <span className="material-symbols-outlined text-[20px] text-[#ffd7f5]">
          {iconName}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

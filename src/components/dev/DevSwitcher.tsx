import React from 'react';

type Role = 'admin' | 'supervisor' | 'vendor' | 'warehouse' | 'driver';

interface DevSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

const roles: { id: Role; label: string; icon: string; color: string }[] = [
  { id: 'admin', label: 'الآدمين', icon: '🏛️', color: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'supervisor', label: 'المشرف', icon: '⚖️', color: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'vendor', label: 'المندوب', icon: '🛒', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'warehouse', label: 'أمين المستودع', icon: '📦', color: 'bg-amber-600 hover:bg-amber-700' },
  { id: 'driver', label: 'السائق', icon: '🚚', color: 'bg-rose-600 hover:bg-rose-700' },
];

export const DevSwitcher: React.FC<DevSwitcherProps> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900/95 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-col md:flex-row items-center gap-3 rtl" dir="rtl">
      <div className="flex items-center gap-2 border-b md:border-b-0 md:border-l border-slate-700 pb-2 md:pb-0 md:pl-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-300">ممر المطورين (Dev Mode):</span>
        </div>
      </div>
      
      {/* تم إزالة شريط التمرير الأفقي واستبداله بـ flex-wrap لتصبح الواجهة نظيفة تماماً بدون Scrollbar */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {roles.map((role) => {
          const isActive = currentRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive 
                  ? `${role.color} text-white ring-2 ring-white/30 shadow-lg scale-105` 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{role.icon}</span>
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
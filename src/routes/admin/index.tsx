import React, { useState } from 'react';

// واجهة الإدارة العليا (Admin Dashboard - Central Command)
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet'>('overview');

  // بيانات إحصائية شاملة (KPIs)
  const systemKPIs = {
    totalRevenue: 4580000,
    activeFleet: 12,
    totalFardeauDelivered: 1450,
    totalAvarie: 15,
  };

  // بيانات أداء المناطق
  const regionalPerformance = [
    { id: 'REG-1', name: 'منطقة تلمسان (الوسط)', revenue: 1250000, target: 1000000, status: 'excellent' },
    { id: 'REG-2', name: 'منطقة الحناية', revenue: 890000, target: 950000, status: 'warning' },
    { id: 'REG-3', name: 'منطقة الرمشي', revenue: 2440000, target: 2000000, status: 'excellent' },
  ];

  // حالة الخوادم والمزامنة
  const systemHealth = [
    { service: 'قاعدة البيانات (IndexedDB Sync)', status: 'online', uptime: '99.9%' },
    { service: 'خادم الطباعة السحابي', status: 'online', uptime: '100%' },
    { service: 'نظام تخطي الديون (Credit Guard)', status: 'online', uptime: '99.8%' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24">
      {/* الشريط العلوي - معلومات الإدارة */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-wide text-white">
              DinarFlow SFA <span className="text-xs font-normal text-slate-900 font-bold bg-amber-500 px-2.5 py-1 rounded-md border border-amber-400">مملكة الإدارة (Admin)</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            المدير العام: حساب الإدارة المركزية | مستوى الصلاحيات: مطلق
          </p>
        </div>

        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 w-full md:w-auto text-right md:text-left">
          <span className="text-[10px] text-slate-400 block">إجمالي إيرادات اليوم</span>
          <span className="text-xl font-black text-amber-400">{systemKPIs.totalRevenue.toLocaleString()} د.ج</span>
        </div>
      </header>

      {/* المؤشرات الرئيسية للحالة العامة (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">الأسطول النشط</span>
          <span className="text-lg md:text-xl font-black text-indigo-400">{systemKPIs.activeFleet} مركبات</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">حجم التوزيع (Fardeau)</span>
          <span className="text-lg md:text-xl font-black text-emerald-400">{systemKPIs.totalFardeauDelivered} طرد</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">المرتجعات (التالفة)</span>
          <span className="text-lg md:text-xl font-black text-red-400">{systemKPIs.totalAvarie} وحدات</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">حالة النظام المركزي</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded inline-block mt-1">مستقر (Stable)</span>
        </div>
      </div>

      {/* التبويب */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          التحليلات والمناطق
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'fleet'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          حالة الخوادم التقنية
        </button>
      </div>

      {/* 1. قسم التحليلات وأداء المناطق */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">أداء المناطق البيعية اليوم</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {regionalPerformance.map((region) => (
              <div key={region.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all">
                <h3 className="font-bold text-white">{region.name}</h3>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">المحقق:</span>
                    <span className="font-bold text-white">{region.revenue.toLocaleString()} د.ج</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">الهدف المجدول:</span>
                    <span className="font-bold text-slate-400">{region.target.toLocaleString()} د.ج</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                    <div 
                      className={`h-2 rounded-full ${region.status === 'excellent' ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ width: `${Math.min((region.revenue / region.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className={`text-[10px] font-bold mt-2 text-right ${region.status === 'excellent' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {region.status === 'excellent' ? 'تجاوز الهدف' : 'تحت المراقبة'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. قسم حالة الخوادم */}
      {activeTab === 'fleet' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-4">سلامة النظام (System Health)</h2>
          <div className="space-y-3">
            {systemHealth.map((sys, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-sm font-bold text-slate-200">{sys.service}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">Uptime: {sys.uptime}</span>
                  <span className="px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded-lg text-xs font-bold flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {sys.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
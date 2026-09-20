import React, { useState } from 'react';

// واجهة أمين المستودع (Warehouse Dashboard - Industrial Slate Theme)
export default function WarehouseDashboard() {
  const [activeTab, setActiveTab] = useState<'loading' | 'reconciliation'>('loading');

  // بيانات محاكاة لعمليات شحن الشاحنات الصباحية
  const [loadingTasks, setLoadingTasks] = useState([
    {
      id: 'TRK-001',
      driverName: 'عثمان زروقي',
      plateNumber: '01334-116-13',
      requestedFardeau: 65,
      status: 'pending', // pending | loaded
      time: '06:30 AM',
    },
    {
      id: 'TRK-002',
      driverName: 'سمير بلجيلالي',
      plateNumber: '08876-319-13',
      requestedFardeau: 120,
      status: 'loaded',
      time: '05:45 AM',
    }
  ]);

  // بيانات محاكاة لعمليات المطابقة المسائية (بعد مسح الـ QR الخاص بالسائق)
  const [reconciliations, setReconciliations] = useState([
    {
      id: 'REC-001',
      driverName: 'عثمان زروقي',
      expectedCash: 125000,
      declaredCash: 125000,
      avarieReturns: 2, // تالف
      sainReturns: 0,  // سليم
      status: 'pending_scan', // pending_scan | matched
    }
  ]);

  // اعتماد شحن الشاحنة
  const handleApproveLoading = (id: string) => {
    setLoadingTasks(prev => 
      prev.map(task => task.id === id ? { ...task, status: 'loaded' } : task)
    );
  };

  // محاكاة مسح QR الخاص بالسائق للمطابقة
  const handleScanDriverQR = (id: string) => {
    setReconciliations(prev =>
      prev.map(rec => rec.id === id ? { ...rec, status: 'matched' } : rec)
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24">
      {/* الشريط العلوي - معلومات المستودع */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-wide text-white">
              DinarFlow SFA <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">مملكة المستودع (Warehouse)</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            أمين المستودع: كريم بوعلام | الوردية: الصباحية/المسائية
          </p>
        </div>

        {/* مؤشرات المخزون الحية */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block">المخزون المتوفر (Fardeau)</span>
            <span className="text-lg font-black text-indigo-400">1,450 طرد</span>
          </div>
        </div>
      </header>

      {/* التبويب بين الشحن الصباحي والمطابقة المسائية */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('loading')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'loading'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          شحن الشاحنات (الصباح)
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'reconciliation'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          المطابقة المسائية (QR Scan)
        </button>
      </div>

      {/* 1. قسم الشحن الصباحي */}
      {activeTab === 'loading' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">أوامر التحميل الميدانية</h2>
          {loadingTasks.map((task) => (
            <div key={task.id} className={`bg-slate-900 border p-5 rounded-2xl transition-all ${
              task.status === 'loaded' ? 'border-slate-800 opacity-60' : 'border-indigo-900/50 hover:border-indigo-700'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-base text-white">{task.driverName} - {task.plateNumber}</h3>
                  <p className="text-xs text-slate-400 mt-1">توقيت الخروج المجدول: {task.time}</p>
                  <div className="mt-2 inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-300">الكمية المطلوبة:</span>
                    <span className="text-sm font-black text-indigo-400">{task.requestedFardeau} Fardeau</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {task.status === 'pending' ? (
                    <button
                      onClick={() => handleApproveLoading(task.id)}
                      className="tap-target-industrial w-full md:w-auto min-h-[50px] px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm rounded-xl border border-indigo-400/30 shadow-lg transition-all"
                    >
                      تأكيد التحميل والخروج
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl border border-slate-700">
                      تم الشحن
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. قسم المطابقة المسائية (عودة الشاحنات) */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="bg-indigo-950/30 border border-indigo-900/50 p-4 rounded-xl flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-indigo-300">مسح الرمز الضوئي (QR Code)</h3>
              <p className="text-xs text-slate-400 mt-1">اطلب من السائق إبراز رمز QR من جهازه لمطابقة العهدة تلقائياً.</p>
            </div>
            <button className="tap-target-industrial bg-indigo-600 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg">
              فتح الكاميرا
            </button>
          </div>

          {reconciliations.map((rec) => (
            <div key={rec.id} className={`bg-slate-900 border p-5 rounded-2xl ${
              rec.status === 'matched' ? 'border-emerald-900/50 bg-emerald-950/10' : 'border-slate-800'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{rec.driverName}</h3>
                    {rec.status === 'matched' && (
                      <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                        تمت المطابقة
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الكاش المسلم</span>
                      <span className="text-sm font-black text-emerald-400">{rec.declaredCash.toLocaleString()} د.ج</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">مرتجع التالف (Avarie)</span>
                      <span className="text-sm font-black text-amber-400">{rec.avarieReturns} قطع</span>
                    </div>
                  </div>
                </div>

                {rec.status === 'pending_scan' && (
                  <button
                    onClick={() => handleScanDriverQR(rec.id)}
                    className="tap-target-industrial min-h-[50px] px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700"
                  >
                    محاكاة قراءة QR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
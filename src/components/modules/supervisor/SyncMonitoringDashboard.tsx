import React, { useState } from 'react';

// واجهة مراقبة المزامنة والأجهزة الميدانية (Sync Monitoring Dashboard - Industrial Slate Theme)

export interface DeviceSyncStatus {
  deviceId: string;
  driverName: string;
  vehicle: string;
  lastSyncTime: string;
  pendingInvoicesCount: number;
  pendingPaymentsCount: number;
  batteryLevel: number;
  appVersion: string;
  status: 'online' | 'syncing' | 'offline' | 'conflict';
}

export interface PendingSyncItem {
  id: string;
  driverName: string;
  type: 'invoice' | 'payment' | 'stock_return';
  amount: number;
  timestamp: string;
  errorMsg?: string;
  status: 'pending' | 'retrying' | 'conflict' | 'synced';
}

export default function SyncMonitoringDashboard() {
  const [activeTab, setActiveTab] = useState<'devices' | 'queue' | 'logs'>('devices');

  // بيانات محاكاة لحالة الأجهزة الميدانية لأسطول التوزيع
  const [devices, setDevices] = useState<DeviceSyncStatus[]>([
    {
      deviceId: 'DEV-TRK-01',
      driverName: 'عثمان زروقي',
      vehicle: 'شاحنة هيونداي (تلمسان - وسط)',
      lastSyncTime: 'منذ دقيقتين',
      pendingInvoicesCount: 3,
      pendingPaymentsCount: 1,
      batteryLevel: 85,
      appVersion: 'v2.4.1-offline',
      status: 'online',
    },
    {
      deviceId: 'DEV-TRK-02',
      driverName: 'طارق بن زياد',
      vehicle: 'شاحنة إيسوزو (الرمشي - الحناية)',
      lastSyncTime: 'منذ 45 دقيقة',
      pendingInvoicesCount: 0,
      pendingPaymentsCount: 0,
      batteryLevel: 42,
      appVersion: 'v2.4.1-offline',
      status: 'offline',
    },
    {
      deviceId: 'DEV-TRK-03',
      driverName: 'سفيان الهواري',
      vehicle: 'شاحنة كيا (سبدو - المغنية)',
      lastSyncTime: 'منذ 5 دقائق',
      pendingInvoicesCount: 8,
      pendingPaymentsCount: 2,
      batteryLevel: 68,
      appVersion: 'v2.4.0-offline',
      status: 'conflict',
    },
  ]);

  // بيانات محاكاة لطابور المزامنة المعلق مع سيرفر Laravel
  const [syncQueue, setSyncQueue] = useState<PendingSyncItem[]>([
    {
      id: 'SYNC-INV-9901',
      driverName: 'سفيان الهواري',
      type: 'invoice',
      amount: 145000,
      timestamp: '10:15 صباحاً',
      errorMsg: 'تضارب في كمية المخزون المتبقية (Stock Mismatch)',
      status: 'conflict',
    },
    {
      id: 'SYNC-PAY-4022',
      driverName: 'عثمان زروقي',
      type: 'payment',
      amount: 50000,
      timestamp: '10:38 صباحاً',
      status: 'pending',
    },
    {
      id: 'SYNC-INV-9904',
      driverName: 'عثمان زروقي',
      type: 'invoice',
      amount: 88000,
      timestamp: '10:40 صباحاً',
      status: 'pending',
    },
  ]);

  // سجلات المزامنة الصامتة (Silent Background Sync Logs)
  const syncLogs = [
    { id: 'LOG-101', time: '10:44:12', event: 'POST /api/v1/sync/invoices', status: '200 OK', device: 'DEV-TRK-01', payloadSize: '24 KB' },
    { id: 'LOG-102', time: '10:41:05', event: 'POST /api/v1/sync/payments', status: '200 OK', device: 'DEV-TRK-01', payloadSize: '8 KB' },
    { id: 'LOG-103', time: '10:35:22', event: 'POST /api/v1/sync/invoices', status: '409 Conflict', device: 'DEV-TRK-03', payloadSize: '32 KB' },
    { id: 'LOG-104', time: '10:20:00', event: 'GET /api/v1/sync/master-catalog', status: '304 Not Modified', device: 'DEV-TRK-02', payloadSize: '2 KB' },
  ];

  // معالجة إعادة المزامنة القسرية لعملية معينة
  const handleRetrySync = (id: string) => {
    setSyncQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'retrying' } : item))
    );
    setTimeout(() => {
      setSyncQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'synced', errorMsg: undefined } : item))
      );
    }, 1500);
  };

  // حل التضارب قسرياً (Force Resolve Conflict)
  const handleResolveConflict = (id: string) => {
    setSyncQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'synced', errorMsg: 'تم تطبيق الأولوية لعملية الميدان' } : item
      )
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 font-sans shadow-xl" dir="rtl">
      
      {/* 1. الشريط العلوي لمراقبة حالة الاتصال الكلية */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 className="text-lg font-black text-white">مركز مراقبة المزامنة والأجهزة الميدانية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة المزامنة اللحظية بين محفظة IndexedDB المحلية وسيرفر DinarFlow Laravel
          </p>
        </div>

        {/* كروت المؤشرات السريعة */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block">الأجهزة النشطة</span>
            <span className="text-sm font-black text-emerald-400">
              {devices.filter((d) => d.status === 'online').length} / {devices.length}
            </span>
          </div>

          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block">فواتير بالانتظار</span>
            <span className="text-sm font-black text-amber-400">
              {syncQueue.filter((q) => q.status === 'pending').length}
            </span>
          </div>

          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block">تضاربات المزامنة</span>
            <span className="text-sm font-black text-red-400">
              {syncQueue.filter((q) => q.status === 'conflict').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. أزرار التنقل بين أجزاء المراقبة */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-3 px-4 font-bold text-xs transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'devices'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📱</span> حالة أجهزة الأسطول
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-4 font-bold text-xs transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⏳</span> طابور العمليات المعلقة
          {syncQueue.filter((q) => q.status === 'conflict' || q.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              {syncQueue.filter((q) => q.status === 'conflict' || q.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 font-bold text-xs transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📑</span> سجل الاتصال بالسيرفر (Laravel Logs)
        </button>
      </div>

      {/* 3. التبويب الأول: أجهزة الأسطول الميداني */}
      {activeTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.deviceId}
              className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 relative hover:border-slate-700 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{device.driverName}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{device.vehicle}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    device.status === 'online'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                      : device.status === 'conflict'
                      ? 'bg-red-950/60 text-red-400 border-red-800/50 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {device.status === 'online'
                    ? 'متصل'
                    : device.status === 'conflict'
                    ? 'تضارب بيانات'
                    : 'منقطع'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block">آخر مزامنة:</span>
                  <span className="font-bold text-slate-200">{device.lastSyncTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">بطارية الجهاز:</span>
                  <span className="font-bold text-slate-200">{device.batteryLevel}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="text-slate-400">معلقة بالذاكرة:</span>
                <span className="font-black text-amber-400">
                  {device.pendingInvoicesCount} فواتير | {device.pendingPaymentsCount} تحصيلات
                </span>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-2 flex justify-between">
                <span>معرف: {device.deviceId}</span>
                <span>إصدار التطبيق: {device.appVersion}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. التبويب الثاني: طابور العمليات المعلقة واستكشاف التضاربات */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {syncQueue.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              لا توجد أي عمليات معلقة في طابور المزامنة حالياً.
            </div>
          ) : (
            syncQueue.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                  item.status === 'conflict'
                    ? 'bg-red-950/20 border-red-900/50'
                    : item.status === 'synced'
                    ? 'bg-emerald-950/20 border-emerald-900/40 opacity-70'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-400">{item.id}</span>
                    <span className="text-xs text-slate-300 font-bold">({item.driverName})</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {item.type === 'invoice' ? 'فاتورة بيع' : 'سند تحصيل'}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                  </div>

                  <p className="text-xs text-emerald-400 font-black">
                    القيمة: {item.amount.toLocaleString()} د.ج
                  </p>

                  {item.errorMsg && (
                    <p className="text-[11px] text-red-400 font-medium flex items-center gap-1 mt-1">
                      ⚠️ {item.errorMsg}
                    </p>
                  )}
                </div>

                {/* أزرار الإجراءات وحل التضارب */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => handleRetrySync(item.id)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg border border-purple-400/30 transition-all"
                    >
                      مزامنة الآن ⚡
                    </button>
                  )}

                  {item.status === 'retrying' && (
                    <span className="text-xs text-amber-400 font-bold px-3 py-1.5 bg-amber-950/50 rounded-lg border border-amber-800/40 animate-pulse">
                      جاري المزامنة...
                    </span>
                  )}

                  {item.status === 'conflict' && (
                    <button
                      onClick={() => handleResolveConflict(item.id)}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-lg border border-red-500/40 transition-all"
                    >
                      اعتماد بيانات الميدان وتجاوز التضارب 🛠️
                    </button>
                  )}

                  {item.status === 'synced' && (
                    <span className="text-xs text-emerald-400 font-bold px-3 py-1.5 bg-emerald-950/60 rounded-lg border border-emerald-800/40">
                      ✓ تم التزامن مع سيرفر Laravel
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. التبويب الثالث: سجل الاتصال بالسيرفر (Logs) */}
      {activeTab === 'logs' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto space-y-2">
          <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-2 mb-3 flex justify-between">
            <span>الوقت</span>
            <span>الحدث (API Event)</span>
            <span>استجابة السيرفر</span>
            <span>الجهاز</span>
            <span>حجم البيانات</span>
          </div>

          {syncLogs.map((log) => (
            <div
              key={log.id}
              className="flex justify-between items-center py-1.5 border-b border-slate-900 hover:bg-slate-900/50 px-2 rounded"
            >
              <span className="text-slate-500">{log.time}</span>
              <span className="text-purple-300 font-bold">{log.event}</span>
              <span
                className={`font-bold ${
                  log.status.includes('200')
                    ? 'text-emerald-400'
                    : log.status.includes('409')
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}
              >
                {log.status}
              </span>
              <span className="text-slate-400">{log.device}</span>
              <span className="text-slate-500">{log.payloadSize}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
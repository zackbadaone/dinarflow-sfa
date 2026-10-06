import React, { useState } from 'react';

// واجهة المشرف المتقدمة (Supervisor Dashboard - Industrial Slate Theme)
export default function SupervisorDashboard() {
  // إضافة تبويب 'sync' لمراقبة المزامنة الميدانية
  const [activeTab, setActiveTab] = useState<'tracking' | 'map' | 'approvals' | 'sync'>('tracking');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>('DRV-001');

  // مؤشرات الأداء المالية والحية للمايسترو
  const kpiMetrics = {
    totalSalesToday: 1340000,
    recoveredCreditToday: 420000,
    activeFleetCount: 2,
    pendingApprovalsCount: 1,
    fieldCoveragePercent: 90
  };

  // بيانات محاكاة لتتبع السائقين والمندوبين في الميدان مع خطوط السير والإحداثيات
  const fleetStatus = [
    { 
      id: 'DRV-001', 
      name: 'عثمان زروقي', 
      role: 'سائق توزيع', 
      route: 'وسط المدينة - تلمسان', 
      stopsCount: 12, 
      completedStops: 10, 
      progress: 83, 
      status: 'active', 
      revenue: 450000, 
      recoveredCredit: 180000,
      lastLocation: 'حي الكرز (Cerisiers)',
      lastPing: 'منذ 3 دقائق',
      coordinates: { x: 45, y: 55 }
    },
    { 
      id: 'VND-002', 
      name: 'طارق بن زياد', 
      role: 'مندوب مبيعات', 
      route: 'الحناية - الرمشي', 
      stopsCount: 8, 
      completedStops: 8, 
      progress: 100, 
      status: 'completed', 
      revenue: 890000, 
      recoveredCredit: 240000,
      lastLocation: 'المركز التجاري - الرمشي',
      lastPing: 'منذ 15 دقيقة',
      coordinates: { x: 75, y: 30 }
    },
  ];

  // بيانات محاكاة لطلبات تجاوز سقف الديون (Credit Override Requests)
  const [approvalRequests, setApprovalRequests] = useState([
    {
      id: 'REQ-001',
      vendorName: 'طارق بن زياد',
      customerName: 'تغذية عامة الهناء',
      currentCredit: 195000,
      limit: 150000,
      requestedAmount: 25000,
      status: 'pending',
      timestamp: '10:42 صباحاً'
    }
  ]);

  // بيانات محاكاة لمراقبة حالة مزامنة الأجهزة الميدانية (Field Devices Sync Status)
  const [syncDevices, setSyncDevices] = useState([
    {
      id: 'DEV-001',
      driverName: 'عثمان زروقي',
      vanId: 'شاحنة 01 - وسط تلمسان',
      pendingCount: 3,
      syncStatus: 'pending', // 'synced' | 'pending' | 'conflict'
      lastSync: 'منذ 22 دقيقة',
      battery: '85%',
      appVersion: 'v2.4.1',
      storageUsed: '14 MB'
    },
    {
      id: 'DEV-002',
      driverName: 'طارق بن زياد',
      vanId: 'شاحنة 02 - الرمشي',
      pendingCount: 0,
      syncStatus: 'synced',
      lastSync: 'منذ دقيقة واحدة',
      battery: '92%',
      appVersion: 'v2.4.1',
      storageUsed: '8 MB'
    },
    {
      id: 'DEV-003',
      driverName: 'سفيان العباسي',
      vanId: 'شاحنة 03 - الحناية',
      pendingCount: 1,
      syncStatus: 'conflict',
      lastSync: 'منذ 45 دقيقة',
      battery: '40%',
      appVersion: 'v2.3.9',
      storageUsed: '22 MB'
    }
  ]);

  // طابور العمليات المعلقة والتضارب (Offline Pending Queue & Conflicts)
  const [pendingQueue, setPendingQueue] = useState([
    {
      id: 'QUEUE-101',
      type: 'فاتورة مبيعات أوفلاين',
      reference: 'INV-OFF-8821',
      driverName: 'عثمان زروقي',
      amount: 65000,
      timestamp: '11:15 صباحاً',
      status: 'pending',
      conflictReason: null
    },
    {
      id: 'QUEUE-102',
      type: 'سند تحصيل كاش',
      reference: 'RCV-OFF-4402',
      driverName: 'عثمان زروقي',
      amount: 20000,
      timestamp: '11:30 صباحاً',
      status: 'pending',
      conflictReason: null
    },
    {
      id: 'QUEUE-103',
      type: 'تعديل مخزون الشاحنة',
      reference: 'STK-OFF-009',
      driverName: 'سفيان العباسي',
      amount: 0,
      timestamp: '10:05 صباحاً',
      status: 'conflict',
      conflictReason: 'تضارب كميات المنتج (زيت إيليو 5L) بين قاعدة البيانات والشاحنة'
    }
  ]);

  const handleApprove = (id: string) => {
    setApprovalRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
  };

  const handleReject = (id: string) => {
    setApprovalRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
  };

  // محاكاة إجبار المزامنة لشاحنة معينة
  const handleForceSyncDevice = (deviceId: string) => {
    setSyncDevices(prev => prev.map(d => d.id === deviceId ? { ...d, syncStatus: 'synced', pendingCount: 0, lastSync: 'الآن' } : d));
    setPendingQueue(prev => prev.map(q => q.status === 'pending' ? { ...q, status: 'synced' } : q));
  };

  // محاكاة حل التضارب يدويًا من المشرف
  const handleResolveConflict = (queueId: string) => {
    setPendingQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'synced', conflictReason: null } : q));
    setSyncDevices(prev => prev.map(d => d.id === 'DEV-003' ? { ...d, syncStatus: 'synced', pendingCount: 0, lastSync: 'الآن' } : d));
  };

  const selectedDriver = fleetStatus.find(d => d.id === selectedDriverId) || fleetStatus[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24" dir="rtl">
      
      {/* 1. الشريط العلوي - معلومات غرفة التحكم والمؤشرات الحية */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl mb-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-purple-500 animate-pulse"></span>
            <h1 className="text-xl font-black tracking-wide text-white">
              DinarFlow SFA <span className="text-xs font-normal text-purple-300 bg-purple-950/80 px-3 py-1 rounded-md border border-purple-800/50">مملكة الرقابة والمايسترو</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">المشرف المسؤول: رضا الإدريسي | ولاية تلمسان والناحية الغربية</p>
        </div>

        {/* كروت المؤشرات الحية السريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">مبيعات اليوم الإجمالية</span>
            <span className="text-base font-black text-emerald-400">{kpiMetrics.totalSalesToday.toLocaleString()} د.ج</span>
          </div>

          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">الكريدي المسترجع (كاش)</span>
            <span className="text-base font-black text-cyan-400">{kpiMetrics.recoveredCreditToday.toLocaleString()} د.ج</span>
          </div>

          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block font-medium">التغطية الميدانية</span>
            <span className="text-base font-black text-purple-400">{kpiMetrics.fieldCoveragePercent}%</span>
          </div>
        </div>
      </header>

      {/* 2. شريط التنقل بين أجزاء المراقبة */}
      <div className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('tracking')} 
          className={`pb-3 px-5 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'tracking' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <span>📊</span> متابعة الأسطول والتحصيل
        </button>

        <button 
          onClick={() => setActiveTab('map')} 
          className={`pb-3 px-5 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'map' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <span>🗺️</span> خريطة المسارات الحية
        </button>

        <button 
          onClick={() => setActiveTab('approvals')} 
          className={`pb-3 px-5 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'approvals' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <span>🛡️</span> طلبات تجاوز السقف
          {approvalRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
              {approvalRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>

        {/* التبويب الخاص بـ الخطوة 2.2 */}
        <button 
          onClick={() => setActiveTab('sync')} 
          className={`pb-3 px-5 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'sync' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <span>⚡</span> مراقبة المزامنة والعمليات المعلقة
          {syncDevices.reduce((acc, d) => acc + d.pendingCount, 0) > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {syncDevices.reduce((acc, d) => acc + d.pendingCount, 0)}
            </span>
          )}
        </button>
      </div>

      {/* 3. التبويب الأول: تتبع الأسطول والتحصيل المالي */}
      {activeTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {fleetStatus.map(member => (
            <div key={member.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    {member.name} 
                    <span className="text-[10px] bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded text-slate-300 font-normal">
                      {member.role}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">📍 المسار: <span className="text-slate-200">{member.route}</span></p>
                  <p className="text-[11px] text-purple-400 mt-0.5">⏱️ آخر تواجد: {member.lastLocation} ({member.lastPing})</p>
                </div>

                <div className="text-left bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">المبيعات / تحصيل الكريدي</span>
                  <span className="text-sm font-black text-emerald-400 block">{member.revenue.toLocaleString()} د.ج</span>
                  <span className="text-xs font-bold text-cyan-400 block mt-0.5">+{member.recoveredCredit.toLocaleString()} د.ج (مسترجع)</span>
                </div>
              </div>
              
              {/* شريط تقدم المسار */}
              <div className="space-y-1.5 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">إنجاز المحطات ({member.completedStops} من {member.stopsCount})</span>
                  <span className="font-bold text-purple-400">{member.progress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${member.progress === 100 ? 'bg-emerald-500' : 'bg-linear-to-r from-purple-600 to-indigo-500'}`} 
                    style={{ width: `${member.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/80">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${member.status === 'completed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-purple-950/40 text-purple-300 border-purple-800/40'}`}>
                  {member.status === 'completed' ? '✓ اكتمل خط السير' : '⚡ نشط في الميدان'}
                </span>

                <button 
                  onClick={() => { setSelectedDriverId(member.id); setActiveTab('map'); }}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
                >
                  عرض الموقع على الخريطة ←
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. التبويب الثاني: خريطة المسارات الحية */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* لوحة تفاصيل السائق المحدد */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>تفاصيل التتبع الميداني</span>
              <span className="text-xs text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">{selectedDriver.id}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block">السائق / المندوب</label>
                <span className="text-base font-bold text-white">{selectedDriver.name}</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block">خط السير الحالي</label>
                <span className="text-sm font-semibold text-slate-200">{selectedDriver.route}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">المبيعات</span>
                  <span className="text-xs font-black text-emerald-400">{selectedDriver.revenue.toLocaleString()} د.ج</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">الكريدي المسترجع</span>
                  <span className="text-xs font-black text-cyan-400">{selectedDriver.recoveredCredit.toLocaleString()} د.ج</span>
                </div>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-900/40 rounded-xl">
                <span className="text-xs text-purple-300 block font-bold">📍 آخر إشارة GPS:</span>
                <p className="text-xs text-slate-300 mt-1">{selectedDriver.lastLocation}</p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{selectedDriver.lastPing}</span>
              </div>
            </div>
          </div>

          {/* الخريطة التفاعلية المحاكاة */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl relative min-h-95 flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-center z-10 bg-slate-950/80 backdrop-blur p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                خريطة التتبع الجغرافي الحي (تلمسان وضواحيها)
              </span>
              <span className="text-[10px] text-slate-400">تحديث تلقائي كل 30 ثانية</span>
            </div>

            {/* تمثيل جرافيكي للخريطة والنقاط الميدانية */}
            <div className="relative w-full h-64 my-4 bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-30"></div>
              
              {fleetStatus.map(driver => (
                <div 
                  key={driver.id} 
                  style={{ top: `${driver.coordinates.y}%`, left: `${driver.coordinates.x}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 group ${selectedDriverId === driver.id ? 'z-30 scale-125' : 'z-20 opacity-80'}`}
                  onClick={() => setSelectedDriverId(driver.id)}
                >
                  <div className="relative flex items-center justify-center">
                    <span className={`absolute h-8 w-8 rounded-full ${selectedDriverId === driver.id ? 'bg-purple-500/40 animate-ping' : 'bg-emerald-500/20'}`}></span>
                    <div className={`p-2 rounded-full border-2 shadow-lg ${selectedDriverId === driver.id ? 'bg-purple-600 border-white text-white' : 'bg-slate-800 border-emerald-400 text-emerald-400'}`}>
                      🚚
                    </div>
                  </div>
                  <div className="absolute top-10 right-1/2 translate-x-1/2 whitespace-nowrap bg-slate-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 shadow-2xl">
                    {driver.name} ({driver.progress}%)
                  </div>
                </div>
              ))}

              <div className="absolute bottom-3 right-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400">
                📌 المسارات النشطة: وسط تلمسان | الحناية | الرمشي
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center z-10">
              * انقر على أي شاحنة في الخريطة لعرض بيانات التحصيل والمسار الخاص بها.
            </div>
          </div>
        </div>
      )}

      {/* 5. التبويب الثالث: طلبات تجاوز السقف */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">طلبات التجاوز الاستثنائية للديون (Credit Override Requests)</h2>
            <span className="text-xs text-slate-400">تستوجب موافقة المشرف المباشرة</span>
          </div>

          {approvalRequests.map(req => (
            <div key={req.id} className={`bg-slate-900 border p-5 rounded-2xl transition-all ${req.status !== 'pending' ? 'opacity-60 border-slate-800' : 'border-purple-900/60 shadow-lg shadow-purple-900/10'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">
                      طلب إذن استثنائي من: <span className="text-purple-400">{req.vendorName}</span>
                    </h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{req.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    الزبون المستهدف: <span className="text-slate-200 font-bold">{req.customerName}</span>
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 max-w-md">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">الدين الحالي</span>
                      <span className="text-xs font-black text-red-400">{req.currentCredit.toLocaleString()} د.ج</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">السقف المسموح</span>
                      <span className="text-xs font-black text-slate-300">{req.limit.toLocaleString()} د.ج</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/40 text-center">
                      <span className="text-[10px] text-purple-300 block">قيمة الطلبية</span>
                      <span className="text-xs font-black text-purple-400">+{req.requestedAmount.toLocaleString()} د.ج</span>
                    </div>
                  </div>
                </div>

                {req.status === 'pending' ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleApprove(req.id)} 
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-400/30 shadow-lg transition-all"
                    >
                      إصدار إذن موافقة (Approve)
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)} 
                      className="px-6 py-2.5 bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-red-700/50 transition-all"
                    >
                      رفض الطلب
                    </button>
                  </div>
                ) : (
                  <div className="w-full md:w-auto text-center md:text-right">
                    <span className={`px-4 py-2 text-xs font-bold rounded-xl border inline-block w-full md:w-auto ${
                      req.status === 'approved' 
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' 
                        : 'bg-red-950/50 text-red-400 border-red-900/50'
                    }`}>
                      {req.status === 'approved' ? '✓ تمت الموافقة وإصدار رمز التجاوز' : '✕ تم رفض الطلب'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. التبويب الرابع: مراقبة المزامنة والعمليات المعلقة - الخطوة 2.2 */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* كروت ملخص حالة الشبكة وطابور الأوفلاين */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">إجمالي العمليات المعلقة بالانتظار</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">
                  {syncDevices.reduce((acc, d) => acc + d.pendingCount, 0)} عملية
                </span>
              </div>
              <span className="p-3 bg-amber-950/50 text-amber-400 rounded-xl border border-amber-800/50 text-lg">⏳</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">تضارب البيانات (Data Conflicts)</span>
                <span className="text-xl font-black text-red-400 mt-1 block">
                  {syncDevices.filter(d => d.syncStatus === 'conflict').length} تضارب يتطلب التدخل
                </span>
              </div>
              <span className="p-3 bg-red-950/50 text-red-400 rounded-xl border border-red-800/50 text-lg">⚠️</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">الأجهزة المتصلة بالمستودع</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  {syncDevices.filter(d => d.syncStatus === 'synced').length} / {syncDevices.length} أجهزة
                </span>
              </div>
              <span className="p-3 bg-emerald-950/50 text-emerald-400 rounded-xl border border-emerald-800/50 text-lg">📶</span>
            </div>
          </div>

          {/* جدول أجهزة الميدان ووضع المزامنة */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <span>حالة مزامنة أجهزة الشاحنات الميدانية</span>
              <span className="text-xs text-slate-400 font-normal">IndexedDB ←→ PostgreSQL/Supabase Server</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {syncDevices.map(device => (
                <div key={device.id} className={`p-4 rounded-xl border transition-all bg-slate-950/60 ${
                  device.syncStatus === 'synced' 
                    ? 'border-emerald-900/40' 
                    : device.syncStatus === 'conflict' 
                    ? 'border-red-900/60 bg-red-950/10' 
                    : 'border-amber-900/40'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{device.driverName}</h3>
                      <span className="text-[11px] text-slate-400">{device.vanId}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      device.syncStatus === 'synced'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : device.syncStatus === 'conflict'
                        ? 'bg-red-950 text-red-400 border-red-800 animate-pulse'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}>
                      {device.syncStatus === 'synced' ? '✓ متزامن' : device.syncStatus === 'conflict' ? '✕ تضارب' : '⏳ معلق'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 my-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">آخر مزامنة ناجحة:</span>
                      <span className="font-semibold text-slate-200">{device.lastSync}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">البطارية / النسخة:</span>
                      <span className="text-slate-200">{device.battery} | {device.appVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">حجم الذاكرة المحلية:</span>
                      <span className="text-slate-200">{device.storageUsed}</span>
                    </div>
                  </div>

                  {device.syncStatus !== 'synced' && (
                    <button
                      onClick={() => handleForceSyncDevice(device.id)}
                      className="w-full py-2 bg-slate-800 hover:bg-purple-900/80 text-purple-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 hover:border-purple-700/50 transition-all flex items-center justify-center gap-1"
                    >
                      🔄 إجبار المزامنة الحية (Force Sync)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* طابور الفواتير والعمليات المعلقة التفصيلي */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4">طابور الفواتير والتحصيلات الميدانية المعلقة (Sync Queue Logs)</h2>
            
            <div className="space-y-3">
              {pendingQueue.map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-950/80 ${
                  item.status === 'conflict' ? 'border-red-900/60' : item.status === 'synced' ? 'border-emerald-900/40 opacity-60' : 'border-slate-800'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">{item.type}</span>
                      <span className="text-xs font-mono font-bold text-white">{item.reference}</span>
                      <span className="text-[10px] text-slate-400">| بواسطة: {item.driverName}</span>
                    </div>
                    {item.conflictReason && (
                      <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-900/30 mt-1">
                        ⚠️ سبب التضارب: {item.conflictReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    {item.amount > 0 && (
                      <span className="text-xs font-black text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                        {item.amount.toLocaleString()} د.ج
                      </span>
                    )}

                    {item.status === 'conflict' ? (
                      <button
                        onClick={() => handleResolveConflict(item.id)}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg border border-red-400/30 transition-all shadow-md"
                      >
                        حل التضارب واعتماد بيانات الشاحنة
                      </button>
                    ) : item.status === 'pending' ? (
                      <span className="text-xs text-amber-400 bg-amber-950/50 px-3 py-1 rounded-lg border border-amber-800/50">
                        في انتظار الاتصال...
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-800/50">
                        ✓ تم الحفظ بالخادم
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
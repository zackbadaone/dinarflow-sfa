import React, { useState } from 'react';

// واجهة بيانات السائق والموزع الميداني
interface DriverStatus {
  id: string;
  name: string;
  vanNumber: string;
  zone: string;
  totalSalesToday: number;
  creditRecoveredToday: number;
  visitedStores: number;
  totalStoresPlanned: number;
  currentStatus: 'active_selling' | 'transit' | 'idle' | 'completed';
  lastLocation: string;
  batteryLevel: number;
  gpsSignal: 'strong' | 'weak' | 'lost';
}

export function LiveKpiRouteTracker() {
  const [filterZone, setFilterZone] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<DriverStatus | null>(null);

  // إحصائيات عامة لحظية للنظام
  const liveSummary = {
    totalSalesNow: 1845000,
    creditRecoveredNow: 420000,
    activeVans: 8,
    totalVans: 10,
    coveragePercentage: 74,
  };

  // بيانات الشاحنات والموزعين في الميدان
  const drivers: DriverStatus[] = [
    {
      id: 'DRV-101',
      name: 'كريم بلحاج',
      vanNumber: 'شاحنة 01 - التبريد',
      zone: 'منطقة تلمسان (الوسط)',
      totalSalesToday: 480000,
      creditRecoveredToday: 150000,
      visitedStores: 14,
      totalStoresPlanned: 18,
      currentStatus: 'active_selling',
      lastLocation: 'حي الكرز - وسط المدينة',
      batteryLevel: 85,
      gpsSignal: 'strong',
    },
    {
      id: 'DRV-102',
      name: 'سفيان طاهري',
      vanNumber: 'شاحنة 03 - المجمدات',
      zone: 'منطقة الحناية',
      totalSalesToday: 320000,
      creditRecoveredToday: 90000,
      visitedStores: 10,
      totalStoresPlanned: 15,
      currentStatus: 'transit',
      lastLocation: 'الطريق الوطني رقم 22',
      batteryLevel: 62,
      gpsSignal: 'strong',
    },
    {
      id: 'DRV-103',
      name: 'ياسين بومدين',
      vanNumber: 'شاحنة 05 - الجافة',
      zone: 'منطقة الرمشي',
      totalSalesToday: 650000,
      creditRecoveredToday: 180000,
      visitedStores: 16,
      totalStoresPlanned: 16,
      currentStatus: 'completed',
      lastLocation: 'مستودع الرمشي الرئيسي',
      batteryLevel: 40,
      gpsSignal: 'strong',
    },
    {
      id: 'DRV-104',
      name: 'أمين بن علي',
      vanNumber: 'شاحنة 02 - الخفيفة',
      zone: 'منطقة تلمسان (الوسط)',
      totalSalesToday: 395000,
      creditRecoveredToday: 0,
      visitedStores: 8,
      totalStoresPlanned: 14,
      currentStatus: 'idle',
      lastLocation: 'محطة الوقود - الشتوان',
      batteryLevel: 91,
      gpsSignal: 'weak',
    },
  ];

  const filteredDrivers = filterZone === 'all' 
    ? drivers 
    : drivers.filter(d => d.zone === filterZone);

  const getStatusBadge = (status: DriverStatus['currentStatus']) => {
    switch (status) {
      case 'active_selling':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>يقوم بالبيع الآن</span>;
      case 'transit':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-950/80 text-sky-400 border border-sky-800/60 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>في الطريق</span>;
      case 'idle':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>متوقف مؤقتاً</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span>أكمل المسار</span>;
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right font-sans">
      
      {/* عنوان الشاشة والتحكم بالفلترة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-bold text-white">الرقابة الميدانية ومؤشرات الأداء الحية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة دقيقة للمبيعات اللحظية، تحصيل الديون القديمة، ومواقع الموزعين عبر GPS
          </p>
        </div>

        {/* التصفية حسب المنطقة البيعية */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto">
          <span className="text-xs text-slate-400 px-2 font-medium">المنطقة:</span>
          <select 
            value={filterZone} 
            onChange={(e) => setFilterZone(e.target.value)}
            className="bg-slate-900 text-white text-xs font-bold rounded-lg px-3 py-2 border border-slate-700 outline-none focus:border-amber-500"
          >
            <option value="all">جميع المناطق البيعية</option>
            <option value="منطقة تلمسان (الوسط)">منطقة تلمسان (الوسط)</option>
            <option value="منطقة الحناية">منطقة الحناية</option>
            <option value="منطقة الرمشي">منطقة الرمشي</option>
          </select>
        </div>
      </div>

      {/* بطاقات المؤشرات اللحظية الشاملة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-slate-400 block mb-1">المبيعات الحية اليوم</span>
          <span className="text-2xl font-black text-emerald-400">{liveSummary.totalSalesNow.toLocaleString()} <span className="text-xs font-normal text-slate-300">د.ج</span></span>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>التحديث: لحظي</span>
            <span className="text-emerald-400 font-bold">+12% مقارنة بالأمس</span>
          </div>
        </div>

        <div className="bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
          <span className="text-xs font-bold text-slate-400 block mb-1">الكريدي المسترجع (كاش)</span>
          <span className="text-2xl font-black text-amber-400">{liveSummary.creditRecoveredNow.toLocaleString()} <span className="text-xs font-normal text-slate-300">د.ج</span></span>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>تحصيل ديون سابقة</span>
            <span className="text-amber-400 font-bold">تدفق نقدي ممتازم</span>
          </div>
        </div>

        <div className="bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
          <span className="text-xs font-bold text-slate-400 block mb-1">الأسطول الميداني النشط</span>
          <span className="text-2xl font-black text-indigo-400">{liveSummary.activeVans} / {liveSummary.totalVans} <span className="text-xs font-normal text-slate-300">شاحنات</span></span>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>جاهزية الشاحنات</span>
            <span className="text-indigo-400 font-bold">80% نشاط</span>
          </div>
        </div>

        <div className="bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-sky-500"></div>
          <span className="text-xs font-bold text-slate-400 block mb-1">نسبة إنجاز خطوط السير</span>
          <span className="text-2xl font-black text-sky-400">{liveSummary.coveragePercentage}%</span>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5">
            <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: `${liveSummary.coveragePercentage}%` }}></div>
          </div>
        </div>

      </div>

      {/* قائمة الموزعين والتتبع عبر الخريطة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* قائمة الموزعين والأداء الميداني */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚚</span> حالة الموزعين والمسارات
            </h3>
            <span className="text-xs text-slate-400">العدد: {filteredDrivers.length}</span>
          </div>

          <div className="space-y-3">
            {filteredDrivers.map((driver) => {
              const progressPercent = Math.round((driver.visitedStores / driver.totalStoresPlanned) * 100);
              return (
                <div 
                  key={driver.id} 
                  onClick={() => setSelectedDriver(driver)}
                  className={`bg-slate-900 border transition-all p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 ${
                    selectedDriver?.id === driver.id ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{driver.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">({driver.id})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{driver.vanNumber} • {driver.zone}</p>
                    </div>
                    <div>{getStatusBadge(driver.currentStatus)}</div>
                  </div>

                  {/* تفاصيل المبيعات والكريدي */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">مبيعات اليوم:</span>
                      <span className="font-bold text-emerald-400">{driver.totalSalesToday.toLocaleString()} د.ج</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">الكريدي المحصل:</span>
                      <span className="font-bold text-amber-400">{driver.creditRecoveredToday.toLocaleString()} د.ج</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block mb-0.5">الموقع الحالي:</span>
                      <span className="font-semibold text-slate-200 truncate block">{driver.lastLocation}</span>
                    </div>
                  </div>

                  {/* نسبة إنجاز زيارة المتاجر المخططة */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-medium">
                      <span className="text-slate-400">تقدم الزيارات الميدانية:</span>
                      <span className="text-amber-400 font-bold">{driver.visitedStores} من {driver.totalStoresPlanned} محل ({progressPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          progressPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* الخريطة المحاكاة وتفاصيل الموزع المختار */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
            <span>🗺️</span> الخريطة الميدانية المباشرة
          </h3>

          {/* محاكاة الخريطة الميدانية */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center relative min-h-70 flex flex-col justify-between items-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] bg-size-[16px_16px] opacity-30"></div>
            
            <div className="relative z-10 w-full flex justify-between items-center">
              <span className="text-xs font-bold bg-slate-950/80 text-amber-400 px-3 py-1 rounded-full border border-slate-800">
                تتبع GPS حي (تلمسان)
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                مباشر 🟢
              </span>
            </div>

            <div className="relative z-10 my-8 p-4 bg-slate-950/90 rounded-2xl border border-slate-800 max-w-xs shadow-2xl">
              <div className="w-10 h-10 mx-auto bg-amber-500/20 border-2 border-amber-500 text-amber-400 rounded-full flex items-center justify-center font-bold mb-2 animate-bounce">
                📍
              </div>
              <p className="text-xs font-bold text-white">
                {selectedDriver ? selectedDriver.name : 'اختر موزعاً لعرض موقعه وحالته'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {selectedDriver ? selectedDriver.lastLocation : 'انقر على أي شاحنة في القائمة للتركيز عليها'}
              </p>
            </div>

            <div className="relative z-10 w-full text-[10px] text-slate-500">
              مدمج جاهز للربط مع OpenStreetMap / Leaflet
            </div>
          </div>

          {/* لوحة التشخيص الفني للشاحنة المختارة */}
          {selectedDriver && (
            <div className="bg-slate-900 border border-amber-500/40 p-4 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
                حالة الجهاز والموزع: {selectedDriver.name}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">بطارية الهاتف:</span>
                  <span className="font-bold text-white">{selectedDriver.batteryLevel}% 🔋</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">إشارة GPS:</span>
                  <span className="font-bold text-emerald-400">{selectedDriver.gpsSignal === 'strong' ? 'ممتازة 📶' : 'ضعيفة ⚠️'}</span>
                </div>
              </div>
              <button 
                onClick={() => alert(`جاري الاتصال بالموزع: ${selectedDriver.name}`)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
              >
                الاتصال الفوري بالموزع 📞
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
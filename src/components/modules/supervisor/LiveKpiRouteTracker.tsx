import React from 'react';

interface FleetMember {
  id: string;
  name: string;
  role: string;
  route: string;
  stopsCount: number;
  completedStops: number;
  progress: number;
  status: 'active' | 'completed' | 'pending';
  revenue: number;
  recoveredCredit: number;
  lastLocation: string;
  lastPing: string;
}

interface LiveKpiRouteTrackerProps {
  fleet: FleetMember[];
  onSelectDriver: (driverId: string) => void;
}

export const LiveKpiRouteTracker: React.FC<LiveKpiRouteTrackerProps> = ({
  fleet,
  onSelectDriver,
}) => {
  const totalRevenue = fleet.reduce((acc, item) => acc + item.revenue, 0);
  const totalRecovered = fleet.reduce((acc, item) => acc + item.recoveredCredit, 0);
  const averageProgress = Math.round(
    fleet.reduce((acc, item) => acc + item.progress, 0) / (fleet.length || 1)
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* شبكة مؤشرات الأداء الحية (KPI Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block font-medium">إجمالي مبيعات الأسطول الحي</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">
            {totalRevenue.toLocaleString()} د.ج
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">محدث آلياً من الأجهزة الميدانية</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block font-medium">إجمالي الكريدي المسترجع</span>
          <span className="text-xl font-black text-cyan-400 mt-1 block">
            {totalRecovered.toLocaleString()} د.ج
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">تحصيلات نقدية مسجلة اليوم</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block font-medium">متوسط إنجاز المسارات</span>
          <span className="text-xl font-black text-purple-400 mt-1 block">
            {averageProgress}%
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">نسبة المحطات المكتملة</span>
        </div>
      </div>

      {/* قائمة تفصيلية لمتابعة مسارات كل سائق ومندوب */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
          <span>حالة إنجاز المسارات الميدانية (Route Execution Tracking)</span>
          <span className="text-xs text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded border border-purple-800">
            {fleet.length} أطقم نشطة في الميدان
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fleet.map((member) => (
            <div
              key={member.id}
              className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    {member.name}
                    <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-normal">
                      {member.role}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">الخط: <span className="text-slate-200">{member.route}</span></p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  member.status === 'completed'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-purple-950 text-purple-300 border-purple-800'
                }`}>
                  {member.status === 'completed' ? '✓ مكتمل' : '⚡ نشط'}
                </span>
              </div>

              {/* شريط الإنجاز */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">الزيارات ({member.completedStops} / {member.stopsCount})</span>
                  <span className="font-bold text-purple-400">{member.progress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${member.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-xs">
                <span className="text-slate-400">آخر تواجد: <strong className="text-slate-200">{member.lastLocation}</strong></span>
                <button
                  onClick={() => onSelectDriver(member.id)}
                  className="text-purple-400 hover:text-purple-300 font-bold underline"
                >
                  تتبع جغرافياً →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';

// واجهة المشرف (Supervisor Dashboard - Industrial Slate Theme)
export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'approvals'>('tracking');

  // بيانات محاكاة لتتبع السائقين والمندوبين في الميدان
  const fleetStatus = [
    { id: 'DRV-001', name: 'عثمان زروقي', role: 'سائق توزيع', route: 'وسط المدينة - تلمسان', progress: 80, status: 'active', revenue: 450000 },
    { id: 'VND-002', name: 'طارق بن زياد', role: 'مندوب مبيعات', route: 'الحناية - الرمشي', progress: 100, status: 'completed', revenue: 890000 },
  ];

  // بيانات محاكاة لطلبات تجاوز سقف الديون (Credit Override Requests) القادمة من المندوبين
  const [approvalRequests, setApprovalRequests] = useState([
    {
      id: 'REQ-001',
      vendorName: 'طارق بن زياد',
      customerName: 'تغذية عامة الهناء',
      currentCredit: 195000,
      limit: 150000,
      requestedAmount: 25000,
      status: 'pending' // pending | approved | rejected
    }
  ]);

  // الموافقة على تجاوز السقف (إصدار Token للمندوب)
  const handleApprove = (id: string) => {
    setApprovalRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
  };

  // رفض الطلب
  const handleReject = (id: string) => {
    setApprovalRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24">
      {/* الشريط العلوي - معلومات المشرف والمؤشرات الحية */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-purple-500 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-wide text-white">
              DinarFlow SFA <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">مملكة الرقابة (Supervisor)</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">المشرف: رضا الإدريسي | المنطقة: الغرب (تلمسان)</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
           <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 flex-1 md:flex-none text-right md:text-left">
            <span className="text-[10px] text-slate-400 block">إجمالي التحصيل الميداني (اليوم)</span>
            <span className="text-lg font-black text-purple-400">1,340,000 د.ج</span>
          </div>
        </div>
      </header>

      {/* شريط التبويب */}
      <div className="flex border-b border-slate-800 mb-6">
        <button onClick={() => setActiveTab('tracking')} className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'tracking' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          تتبع المسارات الحية
        </button>
        <button onClick={() => setActiveTab('approvals')} className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'approvals' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          طلبات تجاوز السقف
          {approvalRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              {approvalRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* 1. قسم تتبع الأسطول الميداني */}
      {activeTab === 'tracking' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fleetStatus.map(member => (
            <div key={member.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {member.name} 
                    <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {member.role}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">خط السير: {member.route}</p>
                </div>
                <div className="text-right bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">المبيعات / التحصيل</span>
                  <span className="text-sm font-black text-emerald-400">{member.revenue.toLocaleString()} د.ج</span>
                </div>
              </div>
              
              {/* شريط التقدم */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-1000 ${member.progress === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} 
                  style={{ width: `${member.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-slate-500">نسبة الإنجاز: {member.progress}%</span>
                <span className={`text-[10px] font-bold ${member.status === 'completed' ? 'text-emerald-500' : 'text-purple-400'}`}>
                  {member.status === 'completed' ? 'أنهى المسار' : 'نشط في الميدان'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. قسم طلبات تجاوز السقف (Credit Overrides) */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {approvalRequests.map(req => (
            <div key={req.id} className={`bg-slate-900 border p-5 rounded-2xl transition-all ${req.status !== 'pending' ? 'opacity-60 border-slate-800' : 'border-purple-900/50 shadow-lg shadow-purple-900/10'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">
                    طلب إذن استثنائي من: <span className="text-purple-400">{req.vendorName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    الزبون المستهدف: <span className="text-slate-200 font-bold">{req.customerName}</span>
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 max-w-md">
                     <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                       <span className="text-[10px] text-slate-400 block">الدين الحالي</span>
                       <span className="text-xs font-black text-red-400">{req.currentCredit.toLocaleString()}</span>
                     </div>
                     <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                       <span className="text-[10px] text-slate-400 block">السقف المسموح</span>
                       <span className="text-xs font-black text-slate-300">{req.limit.toLocaleString()}</span>
                     </div>
                     <div className="bg-slate-950 p-2 rounded-lg border border-purple-900/30 text-center">
                       <span className="text-[10px] text-purple-300 block">قيمة الطلبية</span>
                       <span className="text-xs font-black text-purple-400">+{req.requestedAmount.toLocaleString()}</span>
                     </div>
                  </div>
                </div>

                {req.status === 'pending' ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleApprove(req.id)} 
                      className="tap-target-industrial min-h-[50px] px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-400/30 shadow-lg"
                    >
                      إصدار إذن (Approve)
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)} 
                      className="tap-target-industrial min-h-[50px] px-6 py-2 bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-red-700/50"
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
                      {req.status === 'approved' ? 'تمت الموافقة وإرسال الرمز' : 'تم الرفض'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
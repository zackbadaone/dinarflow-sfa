import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Key, 
  LayoutDashboard,
  Smartphone
} from 'lucide-react';
import { PwaInstallPrompt } from './components/modules/pwa/PwaInstallPrompt';
import { EndToEndAuditDashboard } from './components/modules/audit/EndToEndAuditDashboard';
import { OverrideRequestModal } from './components/modules/sync/OverrideRequestModal';
import { EnvironmentService } from './config/environment';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'override_demo'>('audit');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  useEffect(() => {
    // طباعة حالة البيئة والتثبيت في الكونسول للتدقيق
    EnvironmentService.logEnvironmentStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 dir-rtl text-right pb-12">
      
      {/* شريط الملاحة الرئيسي */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl text-slate-950 font-black text-lg shadow-lg">
              DF
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">DinarFlow SFA</h1>
              <p className="text-[10px] text-slate-400">تطبيق أتمتة المبيعات الميدانية أوفلاين</p>
            </div>
          </div>

          {/* أزرار التنقل بين الموديولات */}
          <nav className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>لوحة التدقيق الشامل (E2E)</span>
            </button>

            <button
              onClick={() => setActiveTab('override_demo')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'override_demo' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>تجربة تجاوز سقف الدين</span>
            </button>
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي حسب التبويب */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {activeTab === 'audit' && <EndToEndAuditDashboard />}

        {activeTab === 'override_demo' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4 max-w-xl mx-auto mt-8">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">اختبار نافذة طلب تجاوز سقف الدين</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تتيح هذه النافذة للمندوب طلب موافقة المشرف أونلاين أو إدخال رمز Supervisor PIN عند تجاوز الزبون لسقف الدين المسموح به.
            </p>
            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              فتح نافذة التجاوز الميداني
            </button>
          </div>
        )}
      </main>

      {/* نافذة التجاوز التجريبية */}
      <OverrideRequestModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        customerId="CUST_ALG_99"
        customerName="مؤسسة الأوراس للتوزيع"
        currentDebt={450000}
        creditLimit={300000}
        requestedAmount={120000}
        onTokenGranted={(token) => {
          console.log('✅ تم استلام توكين التجاوز المعتمد:', token);
        }}
      />

      {/* شريط تنبيه تثبيت الـ PWA على هواتف المندوبين */}
      <PwaInstallPrompt />

    </div>
  );
};

export default App;
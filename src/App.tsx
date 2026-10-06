import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Key, 
  LayoutDashboard,
  Smartphone,
  Boxes,
  Database
} from 'lucide-react';
import { PwaInstallPrompt } from './components/modules/pwa/PwaInstallPrompt';
import { EndToEndAuditDashboard } from './components/modules/audit/EndToEndAuditDashboard';
import { OverrideRequestModal } from './components/modules/sync/OverrideRequestModal';
import WarehouseDashboard from './routes/warehouse';
import { EnvironmentService } from './config/environment';
import { db } from './lib/db';

export const App: React.FC = () => {
  // جعل تبويب المخزن والشحن هو التبويب النشط افتراضياً لاختبار الخطوة
  const [activeTab, setActiveTab] = useState<'audit' | 'override_demo' | 'warehouse'>('warehouse');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    // 1. طباعة حالة البيئة والتثبيت في الكونسول للتدقيق
    EnvironmentService.logEnvironmentStatus();

    // 2. اختبار ذاتي لإقلاع قاعدة البيانات المحلية (IndexedDB)
    const initLocalDatabase = async () => {
      try {
        await db.open();
        console.log('✅ [DinarFlow DB] تم إقلاع قاعدة البيانات المحلية بنجاح في المتصفح:', db.name);
        setDbStatus('ready');
      } catch (error) {
        console.error('❌ [DinarFlow DB] فشل إقلاع قاعدة البيانات المحلية:', error);
        setDbStatus('error');
      }
    };

    initLocalDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 dir-rtl text-right pb-12 overflow-x-hidden">
      
      {/* شريط الملاحة الرئيسي المتجاوب مع شاشات الهواتف والتابلت */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* الشعار وحالة قاعدة البيانات */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-slate-950 font-black text-lg shadow-lg">
                DF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base leading-tight">DinarFlow SFA</h1>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    dbStatus === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    dbStatus === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    <Database className="w-3 h-3 shrink-0" />
                    {dbStatus === 'ready' ? 'DB جاهزة' : dbStatus === 'error' ? 'خطأ DB' : 'جاري التحميل...'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">تطبيق أتمتة المبيعات الميدانية أوفلاين</p>
              </div>
            </div>
          </div>

          {/* أزرار التنقل بين الموديولات الميدانية */}
          <nav className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl text-xs w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('warehouse')}
              className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 touch-btn ${
                activeTab === 'warehouse' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Boxes className="w-4 h-4 shrink-0" />
              <span>المخزن وتجهيز الشاحنات</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 touch-btn ${
                activeTab === 'audit' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>لوحة التدقيق الشامل</span>
            </button>

            <button
              onClick={() => setActiveTab('override_demo')}
              className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 touch-btn ${
                activeTab === 'override_demo' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 shrink-0" />
              <span>تجاوز سقف الدين</span>
            </button>
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي حسب التبويب النشط */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {activeTab === 'warehouse' && <WarehouseDashboard />}

        {activeTab === 'audit' && <EndToEndAuditDashboard />}

        {activeTab === 'override_demo' && (
          <div className="sfa-card p-6 md:p-8 text-center space-y-4 max-w-xl mx-auto mt-6">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">اختبار نافذة طلب تجاوز سقف الدين</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تتيح هذه النافذة للمندوب طلب موافقة المشرف أونلاين أو إدخال رمز Supervisor PIN عند تجاوز الزبون لسقف الدين المسموح به.
            </p>
            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md touch-btn w-full sm:w-auto"
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
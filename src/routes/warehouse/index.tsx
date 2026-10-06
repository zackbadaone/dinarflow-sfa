import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { LoadingTask, Reconciliation } from '../../schemas/sfa';

// === إضافة الزميل: قمنا ببناء الخدمة محلياً هنا لحل مشكلة الاستيراد وتشغيل النظام فوراً ===
const warehouseService = {
  seedInitialWarehouseData: async () => {
    // محاكاة إدخال بيانات تجريبية أوفلاين إذا كانت قاعدة البيانات فارغة
    const tasksCount = await db.loadingTasks.count();
    if (tasksCount === 0) {
      await db.loadingTasks.bulkAdd([
        {
          id: 'TASK-001',
          driverName: 'عمر السائق',
          vehiclePlate: '12345-115-13',
          requestedFardeau: 250,
          status: 'pending',
          qrCodeData: 'QR-MANIFEST-001',
          createdAt: new Date().toISOString()
        },
        {
          id: 'TASK-002',
          driverName: 'خالد السائق',
          vehiclePlate: '98765-115-13',
          requestedFardeau: 180,
          status: 'pending',
          qrCodeData: 'QR-MANIFEST-002',
          createdAt: new Date().toISOString()
        }
      ] as any);
    }

    const recCount = await db.reconciliations.count();
    if (recCount === 0) {
      await db.reconciliations.bulkAdd([
        {
          id: 'REC-001',
          driverName: 'عمر السائق',
          declaredCash: 45000,
          avarieReturns: 2,
          status: 'pending_scan'
        }
      ] as any);
    }
  },
  processVanLoading: async (taskId: string) => {
    // تحديث حالة المهمة أوفلاين في Dexie
    await db.loadingTasks.update(taskId, { status: 'loaded' });
  }
};
// =========================================================================

// واجهة أمين المستودع (Warehouse Dashboard - Industrial Slate Theme)
export default function WarehouseDashboard() {
  const [activeTab, setActiveTab] = useState<'loading' | 'reconciliation'>('loading');

  // حالة التحكم بمسح الـ QR Code للشحن الصباحي
  const [scanningTaskId, setScanningTaskId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // حالات البيانات المربوطة بقاعدة البيانات المحلية Dexie
  const [loadingTasks, setLoadingTasks] = useState<LoadingTask[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // تحميل البيانات الحقيقية من IndexedDB وإدراج بيانات أولية أوفلاين إن كانت فارغة
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // تهيئة البيانات الافتراضية أوفلاين للاختبار إن لم تكن موجودة
      await warehouseService.seedInitialWarehouseData();

      // جلب المهام من قاعدة البيانات المحلية Dexie
      const tasks = await db.loadingTasks.toArray();
      const recs = await db.reconciliations.toArray();

      setLoadingTasks(tasks);
      setReconciliations(recs);
    } catch (error) {
      console.error('خطأ في تحميل بيانات المستودع أوفلاين:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // بدء عملية مسح QR الشحن الصباحي لشاحنة محددة
  const handleStartScanLoading = (id: string) => {
    setScanningTaskId(id);
    setIsScanning(true);
    setScanProgress(0);
  };

  // محاكاة قراءة القارئ الضوئي للـ QR وتأكيد الشحن أوفلاين مع المعاملة الذرية
  const handleSimulateQRRead = () => {
    if (!scanningTaskId) return;

    let progress = 0;
    const interval = setInterval(async () => {
      progress += 25;
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        
        try {
          // تنفيذ عملية الشحن وتحديث مخزون الشاحنة أوفلاين في IndexedDB عبر الخدمة
          await warehouseService.processVanLoading(scanningTaskId);
          
          // إعادة جلب البيانات الحقيقية المحفوظة في Dexie
          await loadDashboardData();
        } catch (error) {
          console.error('فشل تأكيد الشحن أوفلاين:', error);
        }

        setTimeout(() => {
          setIsScanning(false);
          setScanningTaskId(null);
          setScanProgress(0);
        }, 500);
      }
    }, 300);
  };

  // محاكاة مسح QR الخاص بالسائق للمطابقة المسائية
  const handleScanDriverQR = async (id: string) => {
    try {
      await db.reconciliations.update(id, { status: 'matched' });
      await loadDashboardData();
    } catch (error) {
      console.error('فشل تحديث المطابقة المسائية أوفلاين:', error);
    }
  };

  const activeTask = loadingTasks.find(t => t.id === scanningTaskId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24" dir="rtl">
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
          شحن الشاحنات الصباحي (QR Loading)
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">أوامر التحميل وتأكيد خروج البضاعة</h2>
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              المرحلة 1: مسح QR وتجهيز الشاحنة الصباحي
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">جاري قراءة بيانات الشحن أوفلاين من Dexie...</div>
          ) : loadingTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">لا توجد أوامر شحن مجدولة حالياً.</div>
          ) : (
            loadingTasks.map((task) => (
              <div key={task.id} className={`bg-slate-900 border p-5 rounded-2xl transition-all ${
                task.status === 'loaded' ? 'border-emerald-900/40 bg-slate-900/40 opacity-70' : 'border-indigo-900/50 hover:border-indigo-700'
              }`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{task.driverName} - {task.vehiclePlate}</h3>
                      {task.status === 'loaded' && (
                        <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                          تم الشحن ومطابقة QR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">توقيت الخروج المجدول: {task.createdAt ? new Date(task.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : 'صباحاً'} | رمز الشحنة: {task.id}</p>
                    <div className="mt-2 inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-xs text-slate-300">الكمية المطلوبة:</span>
                      <span className="text-sm font-black text-indigo-400">{task.requestedFardeau} Fardeau</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {task.status !== 'loaded' ? (
                      <button
                        onClick={() => handleStartScanLoading(task.id)}
                        className="tap-target-industrial w-full md:w-auto min-h-12.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm rounded-xl border border-indigo-400/30 shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <span>📱</span> مسح QR البضاعة وتأكيد الشحن
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-slate-800 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700">
                        ✓ جاهز للانطلاق أوفلاين
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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
                    className="tap-target-industrial min-h-12.5 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700"
                  >
                    محاكاة قراءة QR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة ماسح الـ QR Code التفاعلي لشحن الصباح */}
      {isScanning && activeTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">ماسح الشحنة الصباحية (QR Manifest)</h3>
              <button 
                onClick={() => setIsScanning(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-300">السائق: <strong className="text-white">{activeTask.driverName}</strong></p>
              <p className="text-slate-300">الشاحنة: <strong className="text-indigo-400">{activeTask.vehiclePlate}</strong></p>
              <p className="text-slate-300">الكمية المقررة: <strong className="text-emerald-400">{activeTask.requestedFardeau} طرد (Fardeau)</strong></p>
            </div>

            {/* إطار الكاميرا التفاعلي والمسح الضوئي */}
            <div className="relative aspect-video bg-slate-950 rounded-xl border-2 border-dashed border-indigo-500 flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
              <span className="text-3xl mb-2 z-10">📷</span>
              <p className="text-xs text-slate-300 font-mono z-10 text-center">
                وجه الكاميرا نحو رمز QR الخاص بفرز الشاحنة
              </p>
              <p className="text-[10px] text-indigo-400 font-mono mt-1 z-10">
                [{activeTask.qrCodeData}]
              </p>

              {/* شريط تقدم المسح */}
              {scanProgress > 0 && (
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden z-10">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSimulateQRRead}
                disabled={scanProgress > 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {scanProgress === 0 ? 'محاكاة قراءة الرمز وتحديث Dexie أوفلاين' : 'جاري حفظ المعاملة الذرية أوفلاين...'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
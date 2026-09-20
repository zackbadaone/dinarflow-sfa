import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2 } from 'lucide-react';
import { EnvironmentService } from '../../../config/environment';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. التحقق مما إذا كان التطبيق مثبتاً بالفعل كـ PWA
    if (EnvironmentService.isPwaInstalled()) {
      setInstalled(true);
      return;
    }

    // 2. الكشف عن أجهزة iOS (سفاري)
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 3. التقاط حدث التثبيت لمتصفحات كروم وأندرويد
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. الاستماع لحدث اكتمال التثبيت
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('🎉 تم تثبيت DinarFlow SFA كـ PWA على الهاتف بنجاح!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // تنفيذ عملية التثبيت عند الضغط على الزر
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('✅ وافق المستخدم على تثبيت التطبيق.');
      setShowPrompt(false);
    } else {
      console.log('❌ رفض المستخدم تثبيت التطبيق.');
    }
    setDeferredPrompt(null);
  };

  if (installed || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:right-6 md:left-auto md:w-96 z-50 dir-rtl text-right">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col gap-3">
        
        {/* الهيدر وزر الإغلاق */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">تثبيت DinarFlow SFA</h4>
              <p className="text-[11px] text-slate-400">تطبيق العمل الميداني أوفلاين</p>
            </div>
          </div>

          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* الميزات وتوجيهات التثبيت */}
        <div className="text-xs text-slate-300 space-y-1.5 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>يعمل بدون انترنت (Offline First)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>طباعة وصلات Thermal عبر Bluetooth</span>
          </div>
        </div>

        {/* أزرار التفاعل (Android / Chrome) */}
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <Download className="w-4 h-4" />
            <span>تثبيت التطبيق على الجوال الآن</span>
          </button>
        )}

        {/* تعليمات تثبيت iOS Safari */}
        {isIos && (
          <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 flex items-center gap-2">
            <Share2 className="w-4 h-4 shrink-0" />
            <span>لتثبيت التطبيق على iPhone: اضغط زر <b>مشاركة (Share)</b> ثم اختر <b>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</b>.</span>
          </div>
        )}

      </div>
    </div>
  );
};
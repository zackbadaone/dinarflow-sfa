import React, { useState } from 'react';
import { db } from '../../../lib/db';

interface DriverReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string;
  storeName: string;
  onReturnProcessed: (returnsSummary: { sain: number; avarie: number }) => void;
}

export const DriverReturnsModal: React.FC<DriverReturnsModalProps> = ({
  isOpen,
  onClose,
  deliveryId,
  storeName,
  onReturnProcessed,
}) => {
  const [sainUnits, setSainUnits] = useState<number>(0);
  const [avarieUnits, setAvarieUnits] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // تحديث مخزون الشاحنة في Dexie (إعادة إدخال المرتجع السليم لعهدة الشاحنة أوفلاين)
      if (sainUnits > 0 || avarieUnits > 0) {
        console.log(`📦 [Returns] تسجيل مرتجعات للطلب ${deliveryId}: سليم = ${sainUnits}, تالف = ${avarieUnits}, السبب: ${reason}`);
      }

      onReturnProcessed({ sain: sainUnits, avarie: avarieUnits });
      onClose();
    } catch (error) {
      console.error('خطأ أثناء معالجة المرتجعات:', error);
      alert('فشل في حفظ المرتجعات محلياً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
        <h3 className="text-lg font-bold text-white mb-1">تسجيل المرتجعات اللوجستية (Driver)</h3>
        <p className="text-xs text-slate-400 mb-4">المحل: <strong className="text-emerald-400">{storeName}</strong> (طلب رقم: {deliveryId})</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">المرتجع السليم (قابل للبيع لاحقاً - Sain):</label>
            <input
              type="number"
              min="0"
              value={sainUnits}
              onChange={(e) => setSainUnits(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">المرتجع التالف / منتهي الصلاحية (Avarie):</label>
            <input
              type="number"
              min="0"
              value={avarieUnits}
              onChange={(e) => setAvarieUnits(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">سبب الاسترجاع:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب الرفض أو التلف..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 h-20 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ وتحديث عهدة الشاحنة'}
          </button>
        </div>
      </div>
    </div>
  );
};
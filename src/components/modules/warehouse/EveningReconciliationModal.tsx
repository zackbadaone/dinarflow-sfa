import React, { useState } from 'react';
import { db } from '../../../lib/db';

interface EveningReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconciliationId: string;
  driverName: string;
  declaredCash: number;
  avarieReturns: number;
  onReconciled: () => void;
}

export const EveningReconciliationModal: React.FC<EveningReconciliationModalProps> = ({
  isOpen,
  onClose,
  reconciliationId,
  driverName,
  declaredCash,
  avarieReturns,
  onReconciled,
}) => {
  const [actualCash, setActualCash] = useState<number>(declaredCash);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const cashDifference = actualCash - declaredCash;

  const handleCompleteReconciliation = async () => {
    setIsSubmitting(true);
    try {
      // 1. تحديث حالة المطابقة في قاعدة البيانات المحلية Dexie مع استخدام as any لتجاوز فحص نوع الحقول الإضافية
      await db.reconciliations.update(reconciliationId, {
        actualCash,
        cashDifference,
        notes,
        status: 'matched',
        updatedAt: new Date().toISOString(),
      } as any);

      console.log(`✅ [Reconciliation] تمت تسوية عهدة السائق (${driverName}) بنجاح. الفرق المالي: ${cashDifference} د.ج`);

      onReconciled();
      onClose();
    } catch (error) {
      console.error('❌ خطأ أثناء حفظ التسوية المسائية:', error);
      alert('فشل في حفظ بيانات الجرد والتسوية محلياً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">مطابقة العهدة والجرد المسائي</h3>
          <p className="text-xs text-slate-400">السائق: <strong className="text-indigo-400">{driverName}</strong> | معرف التسوية: {reconciliationId}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">الكاش المصرح به (من السائق)</span>
            <span className="text-base font-black text-emerald-400">{declaredCash.toLocaleString()} د.ج</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">مرتجع التالف (Avarie)</span>
            <span className="text-base font-black text-amber-400">{avarieReturns} قطع</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ الفعلي المستلم (نقداً بالصندوق):</label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500"
            />
          </div>

          {cashDifference !== 0 && (
            <div className={`p-3 rounded-xl border text-xs font-bold ${
              cashDifference > 0 ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-rose-950/30 border-rose-800 text-rose-400'
            }`}>
              {cashDifference > 0 ? `⚠️ فائض في الصندوق بقيمة: +${cashDifference.toLocaleString()} د.ج` : `⚠️ عجز في الصندوق بقيمة: ${cashDifference.toLocaleString()} د.ج`}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظات أمين المستودع / أسباب العجز أو الفائض:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات حول الفروقات المالية أو حالة التالف..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 h-20 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleCompleteReconciliation}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'جاري الاعتماد...' : 'اعتماد الجرد وإغلاق عهدة الشاحنة'}
          </button>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { db } from '../../../lib/db';
import { apiClient } from '../../../services/apiClient';

interface SupervisorCashReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  driverName: string;
  expectedCash: number;
  onReconciled: () => void;
}

export const SupervisorCashReconciliationModal: React.FC<SupervisorCashReconciliationModalProps> = ({
  isOpen,
  onClose,
  driverId,
  driverName,
  expectedCash,
  onReconciled,
}) => {
  const [actualCash, setActualCash] = useState<number>(expectedCash);
  const [isScanningQR, setIsScanningQR] = useState<boolean>(false);
  const [qrScannedSuccess, setQrScannedSuccess] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const cashDifference = actualCash - expectedCash;

  const handleSimulateQRScan = () => {
    setIsScanningQR(true);
    setTimeout(() => {
      setIsScanningQR(false);
      setQrScannedSuccess(true);
    }, 1200);
  };

  const handleFinalizeReconciliation = async () => {
    if (!qrScannedSuccess) {
      alert('الرجاء مسح رمز QR الخاص بصندوق السائق أولاً لإتمام المطابقة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reconciliationRecord = {
        id: `SUP-REC-${Date.now().toString().slice(-6)}`,
        idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }),
        loadingTaskId: `TASK-${driverId}`,
        driverId,
        driverName,
        expectedCash,
        declaredCash: actualCash,
        avarieReturns: 0,
        sainReturns: 0,
        status: 'closed' as const,
        notes,
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
      };

      // 1. حفظ سجل المطابقة في IndexedDB محلياً
      await db.reconciliations.put(reconciliationRecord);

      // 2. محاولة مزامنة تصفية الصندوق مع السيرفر المركزي logiz-backend
      try {
        await apiClient.post('/supervisor/cash-reconciliation', reconciliationRecord);
        console.log('✅ [SupervisorReconciliation] تم إرسال تسوية الصندوق للسيرفر بنجاح.');
      } catch (err) {
        console.warn('⚠️ تعذر الاتصال بالسيرفر، تم حفظ تسوية الصندوق أوفلاين للمزامنة اللاحقة.');
      }

      onReconciled();
      onClose();
    } catch (error) {
      console.error('❌ خطأ في إتمام المطابقة المالية للمشرف:', error);
      alert('فشل حفظ تسوية الصندوق محلياً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">المطابقة المسائية وتصفية الصندوق (QR Cash Liquidation)</h3>
          <p className="text-xs text-slate-400">السائق: <strong className="text-purple-400">{driverName}</strong> | المعرف: {driverId}</p>
        </div>

        {/* خطوة مسح QR Code الصندوق */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-300">رمز استجابة الصندوق (Box QR Code):</span>
            {qrScannedSuccess ? (
              <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded">
                ✓ تم المسح بنجاح
              </span>
            ) : (
              <button
                onClick={handleSimulateQRScan}
                disabled={isScanningQR}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow transition-all disabled:opacity-50"
              >
                {isScanningQR ? 'جاري قراءة الكاميرا...' : '📷 مسح QR الصندوق'}
              </button>
            )}
          </div>
          {isScanningQR && (
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden animate-pulse">
              <div className="bg-purple-500 h-full w-2/3 animate-indeterminate"></div>
            </div>
          )}
        </div>

        {/* المبالغ المالية */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">الكاش المتوقع (حسب الفواتير)</span>
            <span className="text-base font-black text-cyan-400">{expectedCash.toLocaleString()} د.ج</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">الكاش الفعلي في الصندوق</span>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-sm font-bold text-emerald-400 outline-none focus:border-purple-500 mt-0.5"
            />
          </div>
        </div>

        {cashDifference !== 0 && (
          <div className={`p-3 rounded-xl border text-xs font-bold ${
            cashDifference > 0 ? 'bg-emerald-950/35 border-emerald-800 text-emerald-400' : 'bg-rose-950/35 border-rose-800 text-rose-400'
          }`}>
            {cashDifference > 0 ? `⚠️ فائض نقدي في الصندوق: +${cashDifference.toLocaleString()} د.ج` : `⚠️ عجز مالي في الصندوق: ${cashDifference.toLocaleString()} د.ج`}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظات المشرف وتقارير التسوية:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظات العجز أو الفائض أو تسليم الخزنة النهائية..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 h-20 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleFinalizeReconciliation}
            disabled={isSubmitting || !qrScannedSuccess}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'جاري تصفية الصندوق...' : 'اعتماد التصفية وتأكيد استلام السيولة'}
          </button>
        </div>
      </div>
    </div>
  );
};

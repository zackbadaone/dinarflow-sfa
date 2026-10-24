import React, { useState } from 'react';
import { db } from '../../../lib/db';

interface VanLoadingApprovalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  driverName: string;
  vehiclePlate: string;
  requestedFardeau: number;
  onApproved: () => void;
}

export const VanLoadingApproval: React.FC<VanLoadingApprovalProps> = ({
  isOpen,
  onClose,
  taskId,
  driverName,
  vehiclePlate,
  requestedFardeau,
  onApproved,
}) => {
  const [driverPin, setDriverPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmApproval = async () => {
    if (!driverPin) {
      alert('الرجاء إدخال رمز التحقق الرقمي الخاص بالسائق لتأكيد استلام عهدة البضاعة.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. تحديث مخزون الشاحنة في Dexie (Van Inventory) مع استخدام as any لتجاوز فحص النوع الصارم
      await db.vanInventory.put({
        id: `INV-${vehiclePlate}`,
        vehiclePlate,
        driverName,
        totalFardeau: requestedFardeau,
        updatedAt: new Date().toISOString(),
      } as any);

      // 2. تحديث حالة المهمة في المستودع مع استخدام as any لتجاوز نوع الحالة
      await db.loadingTasks.update(taskId, { status: 'loaded' } as any);

      console.log(`✅ [VanLoading] تم اعتماد عهدة الشاحنة (${vehiclePlate}) بـ ${requestedFardeau} طرد وتحديث Dexie أوفلاين.`);
      
      onApproved();
      onClose();
    } catch (error) {
      console.error('❌ خطأ أثناء اعتماد عهدة الشاحنة:', error);
      alert('فشل في توثيق الاستلام الرقمي محلياً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">تأكيد الاستلام الرقمي لعهدة الشاحنة</h3>
          <p className="text-xs text-slate-400">السائق: <strong className="text-indigo-400">{driverName}</strong> | الشاحنة: <strong className="text-white">{vehiclePlate}</strong></p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">رقم المهمة:</span>
            <span className="font-mono text-slate-200">{taskId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">إجمالي الطرود المقررة:</span>
            <span className="font-bold text-emerald-400">{requestedFardeau} Fardeau</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">رمز التحقق الرقمي للسائق (Driver PIN):</label>
          <input
            type="password"
            maxLength={4}
            value={driverPin}
            onChange={(e) => setDriverPin(e.target.value)}
            placeholder="****"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-lg tracking-widest text-white outline-none focus:border-indigo-500 font-mono"
          />
          <p className="text-[10px] text-slate-500 mt-1">يُطلب من السائق إدخال رقمه السري لتأكيد مسؤوليته القانونية عن البضاعة.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirmApproval}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'جاري التوثيق...' : 'تأكيد وحفظ عهدة الشاحنة أوفلاين'}
          </button>
        </div>
      </div>
    </div>
  );
};
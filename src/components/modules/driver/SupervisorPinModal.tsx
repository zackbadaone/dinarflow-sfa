import React, { useState } from 'react';

interface SupervisorPinModalProps {
  isOpen: boolean;
  storeName: string;
  currentCredit: number;
  maxAllowedLimit: number;
  attemptedAmount: number;
  onClose: () => void;
  onSuccess: (supervisorPin: string, reason: string) => void;
}

export const SupervisorPinModal: React.FC<SupervisorPinModalProps> = ({
  isOpen,
  storeName,
  currentCredit,
  maxAllowedLimit,
  attemptedAmount,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // رمز PIN الافتراضي للمشرف أوفلاين (يمكن تغييره أو استبداله بالتحقق المحلي)
  const OFFLINE_SUPERVISOR_PIN = '9999';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin !== OFFLINE_SUPERVISOR_PIN) {
      setError('رمز PIN الخاص بالمشرف غير صحيح!');
      return;
    }

    if (!reason.trim()) {
      setError('يرجى كتابة سبب تجاوز سقف الكريدي.');
      return;
    }

    onSuccess(pin, reason.trim());
    setPin('');
    setReason('');
  };

  const projectedCredit = currentCredit + attemptedAmount;
  const excessAmount = projectedCredit - maxAllowedLimit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 dir-rtl">
      <div className="bg-slate-900 border border-rose-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* رأس النافذة التحذيري */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/80 font-black text-lg">
              ⚠️
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">تجاوز سقف الديون (PIN)</h2>
              <p className="text-xs text-rose-400 font-medium">يتطلب موافقة أوفلاين من المشرف</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-slate-800 transition-all"
          >
            ✕
          </button>
        </div>

        {/* تفاصيل التجاوز المالي */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>الزبون:</span>
            <strong className="text-white font-bold">{storeName}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>السقف المسموح:</span>
            <strong className="text-slate-200">{maxAllowedLimit.toLocaleString()} د.ج</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>الدين المتوقع بعد البيع:</span>
            <strong className="text-rose-400 font-bold">{projectedCredit.toLocaleString()} د.ج</strong>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-2 text-rose-400 font-bold">
            <span>مقدار التجاوز:</span>
            <span>+{excessAmount.toLocaleString()} د.ج</span>
          </div>
        </div>

        {/* نموذج إدخال PIN والسبب */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              رمز PIN للمشرف (أوفلاين):
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-center text-xl font-black tracking-widest text-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              سبب الاستثناء والتجاوز:
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: ترخيص شفهي من مدير المبيعات / تسديد قريب..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl p-3 text-xs text-slate-100 outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl font-medium text-center">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 bg-rose-700 hover:bg-rose-600 border border-rose-500/50 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
            >
              تأكيد الاستثناء والتسليم
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
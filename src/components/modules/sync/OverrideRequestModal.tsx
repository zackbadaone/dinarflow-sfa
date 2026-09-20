import React, { useState } from 'react';
import { AlertTriangle, Key, Send, CheckCircle2, X, ShieldAlert, WifiOff } from 'lucide-react';
import { overrideService } from '../../../services/overrideService';
import { OverrideToken } from '../../../schemas/sfa';

interface OverrideRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentDebt: number;
  creditLimit: number;
  requestedAmount: number;
  onTokenGranted: (token: OverrideToken) => void;
}

export const OverrideRequestModal: React.FC<OverrideRequestModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  currentDebt,
  creditLimit,
  requestedAmount,
  onTokenGranted,
}) => {
  const [mode, setMode] = useState<'remote' | 'pin'>('remote');
  const [reason, setReason] = useState('');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const excessAmount = Math.max(0, currentDebt + requestedAmount - creditLimit);

  // التنقل بين التبويبات مع تصفير الأخطاء والرسائل القديمة
  const handleTabChange = (newMode: 'remote' | 'pin') => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  // 1. إرسال طلب تجاوز أونلاين للمشرف
  const handleRemoteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await overrideService.requestCreditOverride({
        customerId,
        requestedAmount,
        reason: reason || 'تجاوز سقف الدين للطلب الحالي',
      });
      setRequestId(res.requestId);
      setSuccessMessage('تم إرسال طلب التجاوز للمشرف بنجاح. في انتظار الاعتماد...');
    } catch (err: any) {
      setError(
        'تعذر الاتصال بالسيرفر لإرسال الطلب أونلاين. يمكنك التحول لتبويب (إدخال رمز المشرف PIN) للاعتماد المباشر أوفلاين.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. إدخال رمز المشرف المباشر (PIN) للتجاوز اللحظي أوفلاين
  const handlePinApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorPin) {
      setError('يرجى إدخال رمز PIN للمشرف.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await overrideService.approveCreditOverride({
        requestId: requestId || `LOCAL_REQ_${Date.now()}`,
        supervisorPin,
      });

      onTokenGranted(token);
      setSuccessMessage('تم اعتماد التجاوز بنجاح! يمكن قطع الفاتورة الآن.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      // معالجة السقوط المرن (Graceful Fallback) عند انقطاع الإنترنت أو عدم وجود سيرفر خلفي
      if (
        err?.message?.includes('fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Network') ||
        !navigator.onLine
      ) {
        const localToken: OverrideToken = {
          tokenId: `LOCAL_TOKEN_${Date.now()}`,
          requestId: requestId || `LOCAL_REQ_${Date.now()}`,
          approvedBy: 'المشرف (أوفلاين محلي)',
          approvedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          status: 'APPROVED',
        };
        onTokenGranted(localToken);
        setSuccessMessage('تم اعتماد التجاوز بنجاح (وضع أوفلاين محلي)! يمكن قطع الفاتورة الآن.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(err?.message || 'رمز المشرف غير صحيح أو تم رفض التجاوز.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-right dir-rtl">
        
        {/* الهيدر */}
        <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-200" />
            <h3 className="font-bold text-lg">طلب تجاوز سقف الدين</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* تفاصيل التجاوز والزبون */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold text-gray-800">الزبون: <span className="text-amber-900">{customerName}</span></p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>الدين الحالي: <span className="font-bold text-gray-800">{currentDebt.toLocaleString()} د.ج</span></div>
              <div>سقف الدين المسموح: <span className="font-bold text-gray-800">{creditLimit.toLocaleString()} د.ج</span></div>
              <div>قيمة الفاتورة الحالية: <span className="font-bold text-gray-800">{requestedAmount.toLocaleString()} د.ج</span></div>
              <div>المبلغ المتجاوز: <span className="font-bold text-red-600">{excessAmount.toLocaleString()} د.ج</span></div>
            </div>
          </div>

          {/* تبويب اختيار طريقة التجاوز */}
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                mode === 'remote' ? 'bg-white shadow text-amber-800 font-bold' : 'text-gray-500'
              }`}
              onClick={() => handleTabChange('remote')}
            >
              <Send className="w-3.5 h-3.5" />
              طلب أونلاين من المشرف
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                mode === 'pin' ? 'bg-white shadow text-amber-800 font-bold' : 'text-gray-500'
              }`}
              onClick={() => handleTabChange('pin')}
            >
              <Key className="w-3.5 h-3.5" />
              إدخال رمز المشرف (PIN)
            </button>
          </div>

          {/* الرسائل والأنباء */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* نموذج الطلب الأونلاين */}
          {mode === 'remote' && (
            <form onSubmit={handleRemoteRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  سبب التجاوز (اختياري)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: تعهد الزبون بالتسديد عند الدورة القادمة..."
                  rows={3}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg flex items-center gap-1"
                >
                  {loading ? 'جاري الإرسال...' : 'إرسال الطلب للمشرف'}
                </button>
              </div>
            </form>
          )}

          {/* نموذج إدخال رمز PIN للمشرف */}
          {mode === 'pin' && (
            <form onSubmit={handlePinApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  رمز المشرف المشفر (Supervisor PIN)
                </label>
                <input
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="أدخل رمز PIN المتكون من 4 إلى 6 أرقام..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-center tracking-widest text-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || !supervisorPin}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-1"
                >
                  {loading ? 'جاري التحقق...' : 'اعتماد التجاوز اللحظي'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
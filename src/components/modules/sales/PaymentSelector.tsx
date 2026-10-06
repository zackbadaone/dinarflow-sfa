import React, { useState, useEffect } from "react";
import { PaymentMethod } from "../../../schemas/sfa";
import { CreditService, CreditStatusResult } from "../../../services/creditService";
import { CreditCard, Banknote, AlertTriangle, CheckCircle2, Wallet } from "lucide-react";

interface PaymentSelectorProps {
  customerId: string;
  totalAmount: number;
  onPaymentChange: (data: {
    paymentMethod: PaymentMethod;
    cashPaid: number;
    creditAdded: number;
    isValid: boolean;
  }) => void;
}

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  customerId,
  totalAmount,
  onPaymentChange,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashPaid, setCashPaid] = useState<number>(totalAmount);
  const [creditAdded, setCreditAdded] = useState<number>(0);
  const [creditStatus, setCreditStatus] = useState<CreditStatusResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // تحميل وضع السقف الائتماني للزبون أوفلاين
  useEffect(() => {
    const fetchCreditStatus = async () => {
      setLoading(true);
      try {
        const status = await CreditService.getCustomerCreditStatus(customerId);
        setCreditStatus(status);
      } catch (error) {
        console.error("خطأ في جلب بيانات السقف الائتماني:", error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCreditStatus();
    }
  }, [customerId]);

  // تحديث القيم والحسابات عند تغيير طريقة الدفع أو المبالغ
  useEffect(() => {
    let currentCash = cashPaid;
    let currentCredit = creditAdded;

    if (paymentMethod === "cash") {
      currentCash = totalAmount;
      currentCredit = 0;
    } else if (paymentMethod === "credit") {
      currentCash = 0;
      currentCredit = totalAmount;
    }

    setCashPaid(currentCash);
    setCreditAdded(currentCredit);

    // التحقق من صحة العملية مالياً
    const isCreditExceeded =
      creditStatus &&
      currentCredit > 0 &&
      (creditStatus.isBlocked || currentCredit > creditStatus.availableCredit);

    const isValid = !isCreditExceeded && currentCash + currentCredit >= totalAmount;

    onPaymentChange({
      paymentMethod,
      cashPaid: currentCash,
      creditAdded: currentCredit,
      isValid: !!isValid,
    });
  }, [paymentMethod, cashPaid, creditAdded, totalAmount, creditStatus]);

  const handleMixedCashChange = (val: number) => {
    const paid = Math.min(totalAmount, Math.max(0, val));
    setCashPaid(paid);
    setCreditAdded(Math.max(0, totalAmount - paid));
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">جاري تحميل بيانات الحساب المالي...</div>;
  }

  const isExceeded =
    creditStatus &&
    creditAdded > 0 &&
    (creditStatus.isBlocked || creditAdded > creditStatus.availableCredit);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 text-right dir-rtl">
      <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-blue-600" />
        تحديد طريقة الدفع وتسوية المبالغ
      </h3>

      {/* خيارات طريقة الدفع */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setPaymentMethod("cash")}
          className={`p-3 rounded-lg border text-sm font-semibold flex flex-col items-center gap-1 transition-all ${
            paymentMethod === "cash"
              ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Banknote className="w-5 h-5" />
          نقداً (الكاش)
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod("credit")}
          className={`p-3 rounded-lg border text-sm font-semibold flex flex-col items-center gap-1 transition-all ${
            paymentMethod === "credit"
              ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <CreditCard className="w-5 h-5" />
          على الحساب (آجل)
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod("mixed")}
          className={`p-3 rounded-lg border text-sm font-semibold flex flex-col items-center gap-1 transition-all ${
            paymentMethod === "mixed"
              ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Wallet className="w-5 h-5" />
          مختلط (دفعة + آجل)
        </button>
      </div>

      {/* تفاصيل الدفع المختلط */}
      {paymentMethod === "mixed" && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">المبلغ المقبوض نقداً (د.ج):</label>
            <input
              type="number"
              value={cashPaid}
              onChange={(e) => handleMixedCashChange(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded-md text-left font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600 pt-1 border-t">
            <span>المبلغ المتبقي للآجل:</span>
            <span className="font-bold text-amber-600">{creditAdded.toLocaleString()} د.ج</span>
          </div>
        </div>
      )}

      {/* ملخص الوضع الائتماني للزبون */}
      {creditStatus && (
        <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1.5 border border-gray-200">
          <div className="flex justify-between text-gray-600">
            <span>الدين الحالي للزبون:</span>
            <span className="font-semibold">{creditStatus.currentDebt.toLocaleString()} د.ج</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>السقف الائتماني المسموح:</span>
            <span className="font-semibold">{creditStatus.creditLimit.toLocaleString()} د.ج</span>
          </div>
          <div className="flex justify-between text-gray-800 font-bold border-t pt-1">
            <span>الرصيد المتبقي المتاح:</span>
            <span className={creditStatus.availableCredit > 0 ? "text-emerald-600" : "text-red-600"}>
              {creditStatus.availableCredit.toLocaleString()} د.ج
            </span>
          </div>
        </div>
      )}

      {/* تنبيهات الخطأ وتجاوز السقف */}
      {isExceeded && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            {creditStatus?.isBlocked
              ? "تنبيه: حساب الزبون محظور من التعامل الآجل."
              : `تنبيه: تم تجاوز السقف الائتماني المتاح بـ ${(
                  creditAdded - (creditStatus?.availableCredit || 0)
                ).toLocaleString()} د.ج.`}
          </span>
        </div>
      )}

      {!isExceeded && creditAdded > 0 && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>المبلغ الآجل ضمن السقف الائتماني المسموح.</span>
        </div>
      )}
    </div>
  );
};

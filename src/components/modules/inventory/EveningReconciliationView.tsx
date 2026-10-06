import React, { useState, useEffect } from "react";
import { db } from "../../../lib/db";
import { DeliveryReceipt } from "../../../schemas/sfa";
import { InvoiceService } from "../../../services/invoiceService";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  RefreshCw, 
  ArrowLeftRight, 
  DollarSign, 
  Lock 
} from "lucide-react";

// تعريف الأنماط المفقودة محلياً لتجنب الأخطاء
export interface LoadingTruckSheetItem {
  productId: string;
  productName?: string;
  acceptedQty: number;
}

export interface LoadingTruckSheet {
  id: string;
  driverId: string;
  status: "validated" | "pending" | "completed";
  items: LoadingTruckSheetItem[];
}

interface ReconciliationSummary {
  productId: string;
  productName: string;
  loadedQty: number;      // الكمية المشحونة صباحاً (قطع)
  soldQty: number;        // الكمية المباعة (قطع)
  returnedSain: number;   // مرتجع سليم (قطع)
  returnedAvarie: number; // مرتجع تالف (قطع)
  remainingQty: number;  // المتوقع إرجاعه للمستودع (قطع)
}

export const EveningReconciliationView: React.FC<{ driverId: string; onComplete?: () => void }> = ({
  driverId,
  onComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [summaryList, setSummaryList] = useState<ReconciliationSummary[]>([]);
  const [totalCashCollected, setTotalCashCollected] = useState(0);
  const [totalCreditAdded, setTotalCreditAdded] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosedSuccessfully, setIsClosedSuccessfully] = useState(false);

  useEffect(() => {
    loadEveningData();
  }, [driverId]);

  const loadEveningData = async () => {
    setLoading(true);
    try {
      // 1. جلب شحنة الصباح للشاحنة بأسلوب آمن
      const loadingTable = (db as any).loadingTruckSheets;
      const truckSheets: LoadingTruckSheet[] = loadingTable 
        ? await loadingTable.where("driverId").equals(driverId).toArray() 
        : [];
      
      const activeSheet = truckSheets.find((s: LoadingTruckSheet) => s.status === "validated" || s.status === "pending");

      // 2. جلب فواتير اليوم الخاصة بالسائق
      const invoices = await InvoiceService.getDriverInvoicesToday(driverId);

      // 3. حساب مجاميع الكاش والآجل
      let cashSum = 0;
      let creditSum = 0;
      invoices.forEach(inv => {
        cashSum += inv.cashPaid || 0;
        creditSum += inv.creditAdded || 0;
      });
      setTotalCashCollected(cashSum);
      setTotalCreditAdded(creditSum);

      // 4. مطابقة الكميات والمخزون لكل منتج
      const summaryMap: Record<string, ReconciliationSummary> = {};

      if (activeSheet && activeSheet.items) {
        activeSheet.items.forEach((item: LoadingTruckSheetItem) => {
          summaryMap[item.productId] = {
            productId: item.productId,
            productName: item.productName || item.productId,
            loadedQty: item.acceptedQty,
            soldQty: 0,
            returnedSain: 0,
            returnedAvarie: 0,
            remainingQty: item.acceptedQty,
          };
        });
      }

      // تجميع المبيعات والمرتجعات من الفواتير
      invoices.forEach(inv => {
        inv.items.forEach(item => {
          if (!summaryMap[item.productId]) {
            summaryMap[item.productId] = {
              productId: item.productId,
              productName: item.productId,
              loadedQty: 0,
              soldQty: 0,
              returnedSain: 0,
              returnedAvarie: 0,
              remainingQty: 0,
            };
          }

          const unitsPerFardeau = (item as any).unitsPerFardeau || 1;
          const totalSoldUnits = (item.quantityFardeau * unitsPerFardeau) + item.quantityUnit;
          summaryMap[item.productId].soldQty += totalSoldUnits;
          summaryMap[item.productId].returnedSain += item.returnedSainUnit || 0;
          summaryMap[item.productId].returnedAvarie += item.returnedAvarieUnit || 0;
        });
      });

      // حساب المتبقي النهائي لإرجاعه للمستودع
      const finalSummary = Object.values(summaryMap).map(row => {
        const remaining = row.loadedQty - row.soldQty + row.returnedSain;
        return { ...row, remainingQty: Math.max(0, remaining) };
      });

      setSummaryList(finalSummary);
    } catch (error) {
      console.error("خطأ في تحميل بيانات المطابقة المسائية:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDailyClosing = async () => {
    setIsClosing(true);
    try {
      // تحديث حالة الشحنات والفواتير إلى جاهزة للمزامنة النهائية
      const pendingInvoices = await InvoiceService.getPendingInvoices();
      for (const inv of pendingInvoices) {
        await db.deliveryReceipts.update(inv.id, { syncStatus: "pending" });
      }

      setIsClosedSuccessfully(true);
      if (onComplete) onComplete();
    } catch (err) {
      console.error("خطأ أثناء تأكيد إغلاق اليومية:", err);
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 dir-rtl">جاري تجميع بيانات التسوية المسائية...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-right dir-rtl space-y-4">
      {/* الهيدر الرئيسي */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            تفريغ ومطابقة السلعة المسائي (Evening Reconciliation)
          </h2>
          <p className="text-xs text-gray-500">جرد البضاعة المتبقية وتأكيد المبالغ المالية لليومية</p>
        </div>
        <button
          onClick={loadEveningData}
          className="p-2 border rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ملخص المبالغ المالية */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-emerald-700 block">إجمالي المقبوضات النقذية (الكاش)</span>
            <span className="text-lg font-extrabold text-emerald-800">{totalCashCollected.toLocaleString()} د.ج</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-amber-700 block">إجمالي الديون المرحّلة (الآجل)</span>
            <span className="text-lg font-extrabold text-amber-800">{totalCreditAdded.toLocaleString()} د.ج</span>
          </div>
        </div>
      </div>

      {/* جدول مطابقة الحركة والمخزون */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-gray-100 border-b border-gray-200 font-bold text-xs text-gray-700 flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          جدول جرد ومطابقة السلع الشامل
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="p-2.5">المنتج</th>
                <th className="p-2.5 text-center">مشحون صباحاً</th>
                <th className="p-2.5 text-center">مباع</th>
                <th className="p-2.5 text-center">مرتجع سليم</th>
                <th className="p-2.5 text-center">مرتجع تالف</th>
                <th className="p-2.5 text-center bg-blue-50 text-blue-800">المتبقي للشاحنة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaryList.map((row) => (
                <tr key={row.productId} className="hover:bg-gray-50">
                  <td className="p-2.5 font-bold text-gray-800">{row.productName}</td>
                  <td className="p-2.5 text-center font-semibold text-gray-700">{row.loadedQty}</td>
                  <td className="p-2.5 text-center text-emerald-600 font-semibold">{row.soldQty}</td>
                  <td className="p-2.5 text-center text-blue-600 font-semibold">{row.returnedSain}</td>
                  <td className="p-2.5 text-center text-red-600 font-semibold">{row.returnedAvarie}</td>
                  <td className="p-2.5 text-center bg-blue-50 font-extrabold text-blue-900">{row.remainingQty}</td>
                </tr>
              ))}
              {summaryList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">لا توجد حركات بيع أو شحن مسجلة اليوم</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* زر التأكيد وإغلاق اليومية */}
      {isClosedSuccessfully ? (
        <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 flex items-center justify-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5" />
          تم تأكيد وتفريغ اليومية بنجاح، النظام جاهز للمزامنة مع السيرفر الرئيسي!
        </div>
      ) : (
        <button
          onClick={handleConfirmDailyClosing}
          disabled={isClosing}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
        >
          <Lock className="w-5 h-5" />
          {isClosing ? "جاري إغلاق اليومية..." : "تأكيد جرد المستودع وإغلاق اليومية"}
        </button>
      )}
    </div>
  );
};
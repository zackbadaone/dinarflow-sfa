import React, { useState } from 'react';
import { printerService } from '../../services/printerService';
import { syncEngine } from '../../services/syncEngine';
import { db } from '../../lib/db'; // الخزنة المحلية

// واجهة السائق للتوزيع الشاق (Driver Dashboard - Industrial Slate Theme)
export default function DriverDashboard() {
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null); // قفل أمان الحالة لمنع التكرار
  const [selectedTab, setSelectedTab] = useState<'stops' | 'summary'>('stops');

  // بيانات ميدانية محاكاة لخط سير التوزيع اليومي
  const [deliveries, setDeliveries] = useState([
    {
      id: 'DEL-8091',
      storeName: 'سوبرماركت البركة',
      owner: 'محمد بلحاج',
      address: 'وسط المدينة - تلمسان',
      phone: '0550123456',
      totalAmount: 45000,
      cashPaid: 45000,
      fardeauCount: 25,
      avarieCount: 0,
      sainCount: 0,
      status: 'pending', // pending | completed | failed
    },
    {
      id: 'DEL-8092',
      storeName: 'تغذية عامة الهناء',
      owner: 'عمر العربي',
      address: 'حي الزيتون - الحناية',
      phone: '0771987654',
      totalAmount: 78000,
      cashPaid: 50000,
      fardeauCount: 40,
      avarieCount: 2, // تالف
      sainCount: 1,  // سليم مرتجع
      status: 'pending',
    },
  ]);

  // الاتصال بالطابعة الحرارية الميدانية
  const handleConnectPrinter = async () => {
    const success = await printerService.connectPrinter();
    setPrinterConnected(success);
  };

  // المزامنة الصامتة للبونات المعلقة
  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEngine.syncData();
    setIsSyncing(false);
  };

  // إنهاء التسليم وتوليد البون والحفظ أوفلاين ثم الطباعة الميدانية
  const handleCompleteDelivery = async (deliveryId: string) => {
    if (processingId) return; // منع أي استدعاء مكرر أثناء المعالجة

    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    setProcessingId(deliveryId); // تفعيل قفل الأمان للبون الحالي

    // تجهيز كائن الفاتورة النهائي
    const receiptData = {
      id: delivery.id,
      orderId: `ORD-${delivery.id}`,
      customerId: `CUST-${delivery.id}`,
      driverId: 'DRV-001',
      items: [
        {
          productId: 'PROD-01',
          quantityFardeau: delivery.fardeauCount,
          quantityUnit: 0,
          unitPrice: 1800,
          returnedSainUnit: delivery.sainCount,
          returnedAvarieUnit: delivery.avarieCount,
        },
      ],
      totalAmount: delivery.totalAmount,
      cashPaid: delivery.cashPaid,
      creditAdded: delivery.totalAmount - delivery.cashPaid,
      syncStatus: 'pending' as const, // تعيين الحالة كمعلقة ليقوم محرك المزامنة برفعها لاحقاً
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. الحفظ في الخزنة المحلية (IndexedDB) أولاً كضمان قبل أي شيء
      await db.deliveryReceipts.put(receiptData);
      console.log('تم حفظ الفاتورة محلياً بنجاح!');

      // 2. طباعة البون بعد ضمان حفظ الحقوق
      await printerService.printDeliveryReceipt(
        receiptData,
        {
          id: `CUST-${delivery.id}`,
          storeName: delivery.storeName,
          ownerName: delivery.owner,
          phone: delivery.phone,
          wilaya: 'تلمسان',
          currentCredit: 0,
          maxAllowedLimit: 100000,
          isBlocked: false,
        }
      );

      // 3. تحديث الحالة محلياً في واجهة المستخدم
      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === deliveryId ? { ...item, status: 'completed' } : item
        )
      );
    } catch (error) {
      console.error('حدث خطأ أثناء حفظ أو طباعة الفاتورة:', error);
      alert('فشل في حفظ الفاتورة، الرجاء المحاولة مرة أخرى.');
    } finally {
      setProcessingId(null); // فك قفل الأمان دائماً
    }
  };

  // إعادة طباعة البون فقط دون إعادة الحفظ أو مضاعفة العمليات
  const handleReprint = async (deliveryId: string) => {
    if (processingId) return; // منع التكرار

    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    setProcessingId(deliveryId); // تفعيل قفل الأمان

    const receiptData = {
      id: delivery.id,
      orderId: `ORD-${delivery.id}`,
      customerId: `CUST-${delivery.id}`,
      driverId: 'DRV-001',
      items: [
        {
          productId: 'PROD-01',
          quantityFardeau: delivery.fardeauCount,
          quantityUnit: 0,
          unitPrice: 1800,
          returnedSainUnit: delivery.sainCount,
          returnedAvarieUnit: delivery.avarieCount,
        },
      ],
      totalAmount: delivery.totalAmount,
      cashPaid: delivery.cashPaid,
      creditAdded: delivery.totalAmount - delivery.cashPaid,
      syncStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await printerService.printDeliveryReceipt(
        receiptData,
        {
          id: `CUST-${delivery.id}`,
          storeName: delivery.storeName,
          ownerName: delivery.owner,
          phone: delivery.phone,
          wilaya: 'تلمسان',
          currentCredit: 0,
          maxAllowedLimit: 100000,
          isBlocked: false,
        }
      );
    } catch (error) {
      console.error('حدث خطأ أثناء إعادة الطباعة:', error);
      alert('فشل في إعادة الطباعة، يرجى التأكد من اتصال الطابعة.');
    } finally {
      setProcessingId(null); // فك قفل الأمان
    }
  };

  // إحصائيات الحاوية والسيولة اليومية
  const totalCashCollected = deliveries
    .filter((d) => d.status === 'completed')
    .reduce((acc, curr) => acc + curr.cashPaid, 0);

  const totalCompleted = deliveries.filter((d) => d.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24">
      {/* الشريط العلوي - معلومات السائق والربط الميداني */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-wide text-white">
              DinarFlow SFA <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">مملكة التوزيع (Driver)</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            السائق: عثمان زروقي | الشاحنة: ISUZU 3.5T (01334-116-13)
          </p>
        </div>

        {/* أزرار التحكم السريعة للطابعة والمزامنة */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleConnectPrinter}
            className={`tap-target-industrial min-h-12.5 px-4 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border transition-all ${
              printerConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-400 hover:bg-amber-900/50'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${printerConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            {printerConnected ? 'الطابعة متصلة (ESC/POS)' : 'ربط الطابعة الحرارية'}
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="tap-target-industrial min-h-12.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium text-xs text-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSyncing ? 'جاري المزامنة...' : 'مزامنة السيرفر'}
          </button>
        </div>
      </header>

      {/* لوحة المؤشرات المالية والميدانية السريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">السيولة المجمعة (الكاش)</span>
          <span className="text-lg md:text-xl font-black text-emerald-400">{totalCashCollected.toLocaleString()} د.ج</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">البونات المكتملة</span>
          <span className="text-lg md:text-xl font-black text-slate-100">{totalCompleted} / {deliveries.length}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">إجمالي الربطات (Fardeau)</span>
          <span className="text-lg md:text-xl font-black text-indigo-400">65 طرد</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">حالة الشبكة</span>
          <span className="text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded inline-block mt-1">أوفلاين (IndexedDB)</span>
        </div>
      </div>

      {/* التبويب بين جدول التوصيل وملخص الورديات */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setSelectedTab('stops')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            selectedTab === 'stops'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          خط المسار الميداني ({deliveries.length})
        </button>
        <button
          onClick={() => setSelectedTab('summary')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            selectedTab === 'summary'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          حساب العودة والمطابقة المسائية
        </button>
      </div>

      {/* قائمة محطات التوصيل (Stops List) */}
      {selectedTab === 'stops' && (
        <div className="space-y-4">
          {deliveries.map((item, index) => (
            <div
              key={item.id}
              className={`bg-slate-900 border p-5 rounded-2xl transition-all ${
                item.status === 'completed'
                  ? 'border-emerald-900/50 bg-slate-900/40 opacity-80'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* معلومات الزبون والمحطة */}
                <div className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 font-black text-slate-300 text-sm border border-slate-700">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{item.storeName}</h3>
                      {item.status === 'completed' && (
                        <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                          تم التسليم والطباعة
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      صاحب المحل: {item.owner} | {item.address} | {item.phone}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-slate-300 font-medium">الربطات: <strong className="text-indigo-400">{item.fardeauCount} Fardeau</strong></span>
                      {(item.avarieCount > 0 || item.sainCount > 0) && (
                        <span className="text-amber-400 font-medium">
                          مرتجعات: ({item.avarieCount} تالف / {item.sainCount} سليم)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* الحسابات المالية وأزرار الشغل الشاق */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="text-right sm:text-left bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">إجمالي البون / المدفوع</span>
                    <span className="text-sm font-black text-white">{item.totalAmount.toLocaleString()} د.ج</span>
                    <span className="text-xs text-emerald-400 block font-bold">كاش: {item.cashPaid.toLocaleString()} د.ج</span>
                  </div>

                  {item.status !== 'completed' ? (
                    <button
                      onClick={() => handleCompleteDelivery(item.id)}
                      disabled={processingId === item.id}
                      className="tap-target-industrial min-h-15 min-w-35 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl border border-emerald-400/30 flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === item.id ? 'جاري الحفظ والطباعة...' : 'تسليم + طباعة'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReprint(item.id)}
                      disabled={processingId === item.id}
                      className="tap-target-industrial min-h-12.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === item.id ? 'جاري إعادة الطباعة...' : 'إعادة طباعة البون'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ملخص العودة والورديات للمطابقة المسائية */}
      {selectedTab === 'summary' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            تقرير تفريغ الشاحنة والمطابقة المسائية (Warehouse Return QR)
          </h2>
          <p className="text-xs text-slate-400">
            عند العودة إلى المستودع الرئيسي، اعرض الرمز التالي على أمين المستودع لمطابقة السيولة المجمعة والبضاعة التالفة/السليمة.
          </p>
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-xl my-4">
            <div className="w-48 h-48 bg-white p-3 rounded-xl flex items-center justify-center border-4 border-emerald-500 shadow-xl">
              <span className="text-slate-900 font-black text-center text-xs">
                [QR CODE GENERATED]<br />
                DINARFLOW-DRIVER-EOD<br />
                CASH: {totalCashCollected} DZD<br />
                AVARIE: 2 UNITS
              </span>
            </div>
            <span className="text-xs text-emerald-400 font-bold mt-3">جاهز للمسح من أمين المستودع</span>
          </div>
        </div>
      )}
    </div>
  );
}
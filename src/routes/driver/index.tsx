import React, { useState } from 'react';
import { printerService } from '../../services/printerService';
import { syncEngine } from '../../services/syncEngine';
import { overrideService } from '../../services/overrideService';
import { db } from '../../lib/db'; // الخزنة المحلية
import ProductCatalogModal, { CartItem } from '../../components/modules/vendeur/ProductCatalogModal';

// واجهة السائق للتوزيع الشاق (Driver Dashboard - Industrial Slate Theme)
export default function DriverDashboard() {
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null); // قفل أمان الحالة لمنع التكرار
  const [selectedTab, setSelectedTab] = useState<'stops' | 'summary'>('stops');
  const [searchQuery, setSearchQuery] = useState(''); // فلتر البحث عن الزبائن في خط المسار

  // حالة الكتالوج الميداني والسلة
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);
  const [baskets, setBaskets] = useState<{ [deliveryId: string]: CartItem[] }>({});

  // بيانات ميدانية محاكاة لخط سير التوزيع اليومي مع دعم حدود السقف والكريدي
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
      currentCredit: 20000,
      maxAllowedLimit: 100000,
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
      currentCredit: 60000,
      maxAllowedLimit: 100000,
      status: 'pending',
    },
    {
      id: 'DEL-8093',
      storeName: 'محلات الأمل (متجاوز الكريدي)',
      owner: 'عبد القادر شريف',
      address: 'حي السلام - تلمسان',
      phone: '0661112233',
      totalAmount: 110000,
      cashPaid: 10000, // متبقي 100,000 د.ج آجل
      fardeauCount: 60,
      avarieCount: 0,
      sainCount: 0,
      currentCredit: 180000, // الدين الحالي يتجاوز السقف أصلاً!
      maxAllowedLimit: 150000, // السقف المسموح
      status: 'pending',
    },
  ]);

  // الاتصال بالطابعة الحرارية الميدانية عبر Bluetooth
  const handleConnectPrinter = async () => {
    try {
      const success = await printerService.connectPrinter();
      setPrinterConnected(success);
      if (success) {
        alert('تم الاقتران بالطابعة الحرارية الميدانية بنجاح (80mm ESC/POS).');
      } else {
        alert('تعذر الاقتران بالطابعة. يرجى التأكد من تشغيل Bluetooth بالطابعة.');
      }
    } catch (error) {
      console.error('خطأ أثناء ربط الطابعة:', error);
      alert('حدث خطأ غير متوقع أثناء ربط الطابعة الحرارية.');
    }
  };

  // المزامنة الصامتة للبونات المعلقة
  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEngine.syncData();
    setIsSyncing(false);
  };

  // فتح كتالوج المنتجات لزبون معين
  const handleOpenCatalogForDelivery = (deliveryId: string) => {
    setActiveDeliveryId(deliveryId);
    setIsCatalogOpen(true);
  };

  // إضافة منتج لسلة الزبون وتحديث مجاميع البون
  const handleAddToCart = (item: CartItem) => {
    if (!activeDeliveryId) return;

    setBaskets((prev) => {
      const currentCart = prev[activeDeliveryId] || [];
      const updatedCart = [...currentCart, item];
      
      const newTotal = updatedCart.reduce((sum, c) => sum + c.totalPrice, 0);
      const newFardeau = updatedCart.reduce((sum, c) => sum + c.quantityFardeau, 0);

      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((d) =>
          d.id === activeDeliveryId
            ? { ...d, totalAmount: newTotal, fardeauCount: newFardeau, cashPaid: newTotal }
            : d
        )
      );

      return { ...prev, [activeDeliveryId]: updatedCart };
    });
  };

  // تعديل المبلغ المدفوع كاش وتحديث محرك الفحص المالي فوراً
  const handleCashPaidChange = (deliveryId: string, amount: number) => {
    const validAmount = Math.max(0, amount);
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          const clampedCash = Math.min(d.totalAmount, validAmount);
          return { ...d, cashPaid: clampedCash };
        }
        return d;
      })
    );
  };

  // إنهاء التسليم وتوليد البون والحفظ أوفلاين ثم الطباعة الميدانية
  const handleCompleteDelivery = async (deliveryId: string) => {
    if (processingId) return;

    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    setProcessingId(deliveryId);

    const creditAdded = delivery.totalAmount - delivery.cashPaid;
    const projectedCredit = delivery.currentCredit + creditAdded;
    const isExceeded = projectedCredit > delivery.maxAllowedLimit;

    let verifiedPin: string | null = null;
    let overrideToken: string | null = null;

    if (isExceeded) {
      const pinCode = window.prompt(
        `تنبيه: تجاوز سقف الديون!\nالدين الحالي: ${delivery.currentCredit.toLocaleString()} د.ج\nالآجل الجديد: ${creditAdded.toLocaleString()} د.ج\nالمجموع المتوقع: ${projectedCredit.toLocaleString()} د.ج (السقف: ${delivery.maxAllowedLimit.toLocaleString()} د.ج)\n\nالرجاء إدخال رمز المشرف (PIN) للسماح بالعملية أوفلاين:`
      );
      
      if (!pinCode) {
        alert('تم إلغاء العملية. لم يتم حفظ البون.');
        setProcessingId(null);
        return;
      }

      const validation = await overrideService.validatePin(pinCode);
      if (!validation.isValid) {
        alert(validation.message || 'رمز المشرف خاطئ أو غير مصرح به.');
        setProcessingId(null);
        return;
      }

      verifiedPin = pinCode;
      overrideToken = validation.token || overrideService.generateOverrideToken(pinCode, delivery.id);
    }

    const cartItems = baskets[deliveryId] || [];
    const formattedItems = cartItems.length > 0 
      ? cartItems.map((c) => ({
          productId: c.product.id,
          productName: c.product.name,
          quantityFardeau: c.quantityFardeau,
          quantityUnit: c.quantityUnit,
          unitPrice: c.product.priceUnit,
          totalPrice: c.totalPrice,
          returnedSainUnit: 0,
          returnedAvarieUnit: 0,
        }))
      : [
          {
            productId: 'PROD-01',
            productName: 'منتج افتراضي',
            quantityFardeau: delivery.fardeauCount,
            quantityUnit: 0,
            unitPrice: 1800,
            totalPrice: delivery.fardeauCount * 1800,
            returnedSainUnit: delivery.sainCount,
            returnedAvarieUnit: delivery.avarieCount,
          },
        ];

    const receiptData = {
      id: delivery.id,
      idempotencyKey: crypto.randomUUID(),
      orderId: `ORD-${delivery.id}`,
      customerId: `CUST-${delivery.id}`,
      driverId: 'DRV-001',
      items: formattedItems,
      totalAmount: delivery.totalAmount,
      
      subTotal: delivery.totalAmount,
      taxRate: 0,
      taxAmount: 0,
      paymentMethod: (creditAdded > 0 ? 'credit' : 'cash') as 'cash' | 'credit' | 'mixed',
      status: 'validated' as const, // تم تعديلها إلى validated المطابقة للواجهة
      
      cashPaid: delivery.cashPaid,
      creditAdded: creditAdded,
      syncStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
      
      isOverridden: isExceeded,
      supervisorPin: verifiedPin,
      overrideToken: overrideToken,
      overrideDate: isExceeded ? new Date().toISOString() : null,
    };

    try {
      // 1. الحفظ في الخزنة المحلية (IndexedDB)
      await db.deliveryReceipts.put(receiptData);
      console.log('تم حفظ الفاتورة محلياً بنجاح!', receiptData);

      // 2. إرسال أمر الطباعة المباشر لطباعة البون عبر Bluetooth
      const printSuccess = await printerService.printDeliveryReceipt(
        receiptData,
        {
          id: `CUST-${delivery.id}`,
          name: delivery.storeName,
          owner_name: delivery.owner,
          phone: delivery.phone,
          address: delivery.address,
          debt: delivery.currentCredit,
          debt_age_days: 0,
          credit_limit: delivery.maxAllowedLimit,
          status: isExceeded ? 'blocked' : 'active',
        }
      );

      if (!printSuccess) {
        alert('تم حفظ الفاتورة بنجاح في الهاتف، ولكن تعذرت الطباعة المباشرة. يرجى إعادة الطباعة بعد التأكد من الطابعة.');
      }

      // 3. تحديث حالة المحطة إلى مكتملة
      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === deliveryId ? { ...item, status: 'completed' } : item
        )
      );
    } catch (error) {
      console.error('حدث خطأ أثناء حفظ أو طباعة الفاتورة:', error);
      alert('فشل في حفظ الفاتورة، الرجاء المحاولة مرة أخرى.');
    } finally {
      setProcessingId(null);
    }
  };

  // إعادة طباعة البون المباشر دون تكرار الحفظ
  const handleReprint = async (deliveryId: string) => {
    if (processingId) return;

    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    setProcessingId(deliveryId);

    const creditAdded = delivery.totalAmount - delivery.cashPaid;

    const receiptData = {
      id: delivery.id,
      idempotencyKey: crypto.randomUUID(),
      orderId: `ORD-${delivery.id}`,
      customerId: `CUST-${delivery.id}`,
      driverId: 'DRV-001',
      items: [
        {
          productId: 'PROD-01',
          productName: 'منتج افتراضي',
          quantityFardeau: delivery.fardeauCount,
          quantityUnit: 0,
          unitPrice: 1800,
          totalPrice: delivery.fardeauCount * 1800,
          returnedSainUnit: delivery.sainCount,
          returnedAvarieUnit: delivery.avarieCount,
        },
      ],
      totalAmount: delivery.totalAmount,
      
      subTotal: delivery.totalAmount,
      taxRate: 0,
      taxAmount: 0,
      paymentMethod: (creditAdded > 0 ? 'credit' : 'cash') as 'cash' | 'credit' | 'mixed',
      status: 'validated' as const, // تم تعديلها إلى validated المطابقة للواجهة
      
      cashPaid: delivery.cashPaid,
      creditAdded: creditAdded,
      syncStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await printerService.printDeliveryReceipt(
        receiptData,
        {
          id: `CUST-${delivery.id}`,
          name: delivery.storeName,
          owner_name: delivery.owner,
          phone: delivery.phone,
          address: delivery.address,
          debt: delivery.currentCredit,
          debt_age_days: 0,
          credit_limit: delivery.maxAllowedLimit,
          status: (delivery.currentCredit + creditAdded) > delivery.maxAllowedLimit ? 'blocked' : 'active',
        }
      );
    } catch (error) {
      console.error('حدث خطأ أثناء إعادة الطباعة:', error);
      alert('فشل في إعادة الطباعة، يرجى التأكد من اتصال الطابعة.');
    } finally {
      setProcessingId(null);
    }
  };

  const totalCashCollected = deliveries
    .filter((d) => d.status === 'completed')
    .reduce((acc, curr) => acc + curr.cashPaid, 0);

  const totalCompleted = deliveries.filter((d) => d.status === 'completed').length;

  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24">
      {/* الشريط العلوي */}
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

      {/* لوحة المؤشرات المالية */}
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
          <span className="text-lg md:text-xl font-black text-indigo-400">125 طرد</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">حالة الشبكة</span>
          <span className="text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded inline-block mt-1">أوفلاين (IndexedDB)</span>
        </div>
      </div>

      {/* التبويب */}
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

      {/* قائمة المحطات */}
      {selectedTab === 'stops' && (
        <div className="space-y-4">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 ابحث باسم المحل، التاجر، أو رقم الهاتف..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none transition-all"
            />
          </div>

          {filteredDeliveries.map((item, index) => {
            const creditAdded = item.totalAmount - item.cashPaid;
            const projectedCredit = item.currentCredit + creditAdded;
            const isExceeded = projectedCredit > item.maxAllowedLimit;
            const availableCreditBuffer = Math.max(0, item.maxAllowedLimit - item.currentCredit);
            const usagePercentage = Math.min(100, Math.round((item.currentCredit / item.maxAllowedLimit) * 100));
            const cartItems = baskets[item.id] || [];

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border p-5 rounded-2xl transition-all ${
                  isExceeded && item.status !== 'completed'
                    ? 'border-rose-800/80 bg-rose-950/10'
                    : item.status === 'completed'
                    ? 'border-emerald-900/50 bg-slate-900/40 opacity-80'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4 w-full md:w-auto">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 font-black text-slate-300 text-sm border border-slate-700 shrink-0">
                      {index + 1}
                    </span>
                    <div className="w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-white">{item.storeName}</h3>
                        
                        {isExceeded && item.status !== 'completed' && (
                          <span className="text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                            ⚠️ تجاوز سقف الكريدي
                          </span>
                        )}

                        {item.status === 'completed' && (
                          <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                            تم التسليم والطباعة
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">
                        صاحب المحل: {item.owner} | {item.address} | {item.phone}
                      </p>

                      <div className="w-full max-w-md bg-slate-950 h-2 rounded-full overflow-hidden mt-2 border border-slate-800">
                        <div
                          className={`h-full transition-all ${
                            usagePercentage >= 100
                              ? 'bg-rose-500'
                              : usagePercentage > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usagePercentage}%` }}
                        ></div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                        <span className="text-slate-300 font-medium">
                          الربطات: <strong className="text-indigo-400">{item.fardeauCount} Fardeau</strong>
                        </span>
                        <span className="text-slate-400 border-r border-slate-700 pr-3">
                          الدين الحالي: <strong className="text-amber-400">{item.currentCredit.toLocaleString()} د.ج</strong> ({usagePercentage}%)
                        </span>
                        <span className="text-slate-400 border-r border-slate-700 pr-3">
                          السقف: <strong className="text-slate-200">{item.maxAllowedLimit.toLocaleString()} د.ج</strong>
                        </span>
                        <span className="text-slate-400 border-r border-slate-700 pr-3">
                          المتبقي المتاح: <strong className={availableCreditBuffer === 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{availableCreditBuffer.toLocaleString()} د.ج</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {item.status !== 'completed' && (
                      <button
                        onClick={() => handleOpenCatalogForDelivery(item.id)}
                        className="px-4 py-2.5 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700 text-indigo-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        🛍️ الكتالوج ({cartItems.length})
                      </button>
                    )}

                    <div className="text-right sm:text-left bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">الإجمالي:</span>
                        <span className="text-xs font-black text-white">{item.totalAmount.toLocaleString()} د.ج</span>
                      </div>

                      {item.status !== 'completed' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-400 font-bold">المدفوع:</span>
                            <input
                              type="number"
                              min="0"
                              max={item.totalAmount}
                              value={item.cashPaid}
                              onChange={(e) => handleCashPaidChange(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24 bg-slate-900 border border-slate-700 text-emerald-400 text-xs font-bold rounded px-1.5 py-0.5 outline-none focus:border-emerald-500 text-right"
                            />
                          </div>

                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleCashPaidChange(item.id, item.totalAmount)}
                              className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded hover:bg-emerald-900"
                            >
                              كاش كامل
                            </button>
                            <button
                              onClick={() => handleCashPaidChange(item.id, 0)}
                              className="text-[9px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded hover:bg-rose-900"
                            >
                              آجل كامل
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 block font-bold">كاش: {item.cashPaid.toLocaleString()} د.ج</span>
                      )}

                      {creditAdded > 0 && (
                        <span className="text-[10px] text-rose-400 block font-semibold border-t border-slate-800/80 pt-1">
                          آجل جديد: +{creditAdded.toLocaleString()} د.ج
                        </span>
                      )}
                    </div>

                    {item.status !== 'completed' ? (
                      <button
                        onClick={() => handleCompleteDelivery(item.id)}
                        disabled={processingId === item.id}
                        className={`tap-target-industrial min-h-15 min-w-35 px-6 py-3 font-bold text-sm rounded-xl border flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isExceeded
                            ? 'bg-rose-700 hover:bg-rose-600 border-rose-500/50 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30 text-white'
                        }`}
                      >
                        {processingId === item.id ? 'جاري المعالجة...' : isExceeded ? 'تسليم (يتطلب PIN)' : 'تسليم + طباعة'}
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
            );
          })}
        </div>
      )}

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

      {/* نافذة الكتالوج الميداني لتبويب المنتجات وسلة المبيعات */}
      <ProductCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
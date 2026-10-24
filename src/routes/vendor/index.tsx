import React, { useState } from 'react';

// واجهة المندوب التجاري (Vendor Dashboard - Industrial Slate Theme - Decoupled)
export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<'customers' | 'catalog' | 'cart'>('customers');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // بيانات محاكاة للزبائن (نظام Credit Guard)
  const customers = [
    {
      id: 'CUST-001',
      storeName: 'سوبرماركت البركة',
      ownerName: 'محمد بلحاج',
      currentCredit: 45000,
      maxAllowedLimit: 100000,
      isBlocked: false,
    },
    {
      id: 'CUST-002',
      storeName: 'تغذية عامة الهناء',
      ownerName: 'عمر العربي',
      currentCredit: 195000,
      maxAllowedLimit: 150000,
      isBlocked: true, // محظور بسبب تجاوز السقف
    }
  ];

  // بيانات محاكاة لكتالوج المنتجات التجاري
  const products = [
    { id: 'PROD-01', name: 'عصير برتقال حمود 1ل', price: 1800, fardeauSize: 6 },
    { id: 'PROD-02', name: 'مياه معدنية لالة خديجة 1.5ل', price: 900, fardeauSize: 6 },
  ];

  // سلة المشتريات التجارية للمندوب
  const [cart, setCart] = useState<{product: any, qtyFardeau: number}[]>([]);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setActiveTab('catalog');
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qtyFardeau: item.qtyFardeau + 1 } : item);
      }
      return [...prev, { product, qtyFardeau: 1 }];
    });
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.product.price * item.qtyFardeau), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-24" dir="rtl">
      {/* الشريط العلوي - معلومات المندوب */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-wide text-white">
              DinarFlow SFA <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">مملكة المبيعات والكاتالوج (Vendor)</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            المندوب التجاري: طارق بن زياد | مسار اليوم: وسط المدينة - تلمسان (بيع سريع)
          </p>
        </div>

        {/* مؤشر الزبون الحالي */}
        {selectedCustomer && (
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 flex flex-col items-end">
            <span className="text-[10px] text-slate-400 block">الزبون الحالي النشط</span>
            <span className="text-sm font-black text-blue-400">{selectedCustomer.storeName}</span>
          </div>
        )}
      </header>

      {/* شريط التبويب */}
      <div className="flex border-b border-slate-800 mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab('customers')} className={`whitespace-nowrap pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'customers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}>
          1. اختيار الزبون (Credit Guard)
        </button>
        <button onClick={() => setActiveTab('catalog')} disabled={!selectedCustomer} className={`whitespace-nowrap pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'catalog' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'} ${!selectedCustomer && 'opacity-50 cursor-not-allowed'}`}>
          2. كتالوج المنتجات السريع
        </button>
        <button onClick={() => setActiveTab('cart')} disabled={!selectedCustomer} className={`whitespace-nowrap pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'cart' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'} ${!selectedCustomer && 'opacity-50 cursor-not-allowed'}`}>
          3. السلة وملخص الطلبية ({cart.length})
        </button>
      </div>

      {/* 1. قائمة الزبائن (Credit Guard) */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">زبائن المسار التجاري اليومي</h2>
          {customers.map((cust) => (
            <div key={cust.id} className={`bg-slate-900 border p-5 rounded-2xl transition-all ${cust.isBlocked ? 'border-red-900/50 opacity-80' : 'border-slate-800 hover:border-slate-700'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{cust.storeName}</h3>
                    {cust.isBlocked && <span className="text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded">محظور (تجاوز السقف)</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">مسؤول المحل: {cust.ownerName}</p>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-400">الديون الحالية: <strong className={cust.isBlocked ? 'text-red-400' : 'text-slate-200'}>{cust.currentCredit.toLocaleString()} د.ج</strong></span>
                    <span className="text-slate-500 mx-2">/</span>
                    <span className="text-slate-400">السقف المسموح: {cust.maxAllowedLimit.toLocaleString()} د.ج</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectCustomer(cust)}
                  disabled={cust.isBlocked}
                  className={`tap-target-industrial min-h-12.5 px-6 py-2.5 font-bold text-sm rounded-xl border shadow-lg transition-all ${
                    cust.isBlocked 
                      ? 'bg-slate-800/50 text-slate-500 border-slate-700/50 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border-blue-400/30'
                  }`}
                >
                  {cust.isBlocked ? 'مفعل حظر السقف' : 'بدء الطلبية التجارية'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. كتالوج المنتجات */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white">{product.name}</h3>
                <p className="text-xs text-slate-400 mt-1">السعر: {product.price.toLocaleString()} د.ج / للربطة (Fardeau)</p>
                <p className="text-[10px] text-indigo-400 mt-1">تحتوي الربطة على {product.fardeauSize} قطع</p>
              </div>
              <button
                onClick={() => addToCart(product)}
                className="tap-target-industrial mt-4 min-h-12.5 w-full bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-sm rounded-xl border border-slate-700 transition-all"
              >
                + إضافة سريعة للسلة
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. السلة والتأكيد */}
      {activeTab === 'cart' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4">ملخص الطلبية التجارية للزبون: {selectedCustomer?.storeName}</h2>
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">السلة التجريبية فارغة</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="font-bold text-sm text-white">{item.product.name}</h4>
                    <span className="text-xs text-slate-400">{item.qtyFardeau} ربطة × {item.product.price.toLocaleString()} د.ج</span>
                  </div>
                  <span className="font-black text-blue-400">{(item.qtyFardeau * item.product.price).toLocaleString()} د.ج</span>
                </div>
              ))}
              
              <div className="border-t border-slate-800 pt-4 mt-4 flex justify-between items-center">
                <span className="text-slate-300 font-bold">الإجمالي المالي المطلوب:</span>
                <span className="text-xl font-black text-white">{totalAmount.toLocaleString()} د.ج</span>
              </div>
              
              <button 
                onClick={() => {
                  alert('تم تأكيد الطلبية التجارية وتوليد مفتاح الفرادة وحفظها أوفلاين بنجاح!');
                  setCart([]);
                  setActiveTab('customers');
                  setSelectedCustomer(null);
                }}
                className="tap-target-industrial w-full mt-4 min-h-15 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-lg rounded-xl border border-emerald-400/30 shadow-lg transition-all"
              >
                تأكيد الطلبية وإرسالها لطابور المزامنة
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
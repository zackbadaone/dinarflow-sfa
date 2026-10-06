import React, { useState } from 'react';

// واجهة تعريف المنتج
interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitsPerFardeau: number; // عدد الوحدات في الطرد
  costPrice: number; // سعر التكلفة
  wholesalePrice: number; // سعر الجملة
  retailPrice: number; // سعر التجزئة
  stockQuantity: number; // المخزون المركزي
  isActive: boolean;
}

// واجهة قاعدة التخفيض الحجمي
interface VolumeDiscount {
  id: string;
  productSku: string;
  productName: string;
  minFardeauQuantity: number; // الحد الأدنى للطرود للحصول على الخصم
  discountPercentage: number; // نسبة الخصم %
  fixedDiscountAmount: number; // أو قيمة خصم ثابته بالديار
  status: 'active' | 'paused';
}

export function ProductPriceDiscountManager() {
  const [activeTab, setActiveTab] = useState<'products' | 'discounts' | 'promotions'>('products');
  const [searchQuery, setSearchQuery] = useState('');

  // قائمة المنتجات الافتراضية
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'PRD-001',
      sku: 'WAT-1.5L',
      name: 'ماء معدني 1.5 لتر (قارورة)',
      category: 'مياه معدنية',
      unitsPerFardeau: 6,
      costPrice: 28,
      wholesalePrice: 35,
      retailPrice: 40,
      stockQuantity: 1250,
      isActive: true,
    },
    {
      id: 'PRD-002',
      sku: 'WAT-0.5L',
      name: 'ماء معدني 0.5 لتر (قارورة)',
      category: 'مياه معدنية',
      unitsPerFardeau: 12,
      costPrice: 15,
      wholesalePrice: 20,
      retailPrice: 25,
      stockQuantity: 3400,
      isActive: true,
    },
    {
      id: 'PRD-003',
      sku: 'JUC-1L-OR',
      name: 'عصير برتقال طبيعي 1 لتر',
      category: 'عصائر',
      unitsPerFardeau: 8,
      costPrice: 110,
      wholesalePrice: 135,
      retailPrice: 150,
      stockQuantity: 450,
      isActive: true,
    },
  ]);

  // قوائم التخفيض الحجمي
  const [discounts, setDiscounts] = useState<VolumeDiscount[]>([
    {
      id: 'DSC-101',
      productSku: 'WAT-1.5L',
      productName: 'ماء معدني 1.5 لتر (قارورة)',
      minFardeauQuantity: 50,
      discountPercentage: 5,
      fixedDiscountAmount: 0,
      status: 'active',
    },
    {
      id: 'DSC-102',
      productSku: 'WAT-1.5L',
      productName: 'ماء معدني 1.5 لتر (قارورة)',
      minFardeauQuantity: 100,
      discountPercentage: 8,
      fixedDiscountAmount: 0,
      status: 'active',
    },
  ]);

  // نمط تصفية المنتجات
  const filteredProducts = products.filter(
    (p) => p.name.includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right dir-rtl">
      {/* العنونة والتنقل الفرعي */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📦</span> إدارة المنتجات، الأسعار والتخفيضات المركزية
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            التحكم في قوائم الأسعار المتعددة، حجم الطرد (Fardeau)، وسياسات الخصم الحجمي للمندوبين
          </p>
        </div>

        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'products'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المنتجات والأسعار ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'discounts'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            شرائح التخفيض الحجمي ({discounts.length})
          </button>
        </div>
      </div>

      {/* 1. تبويب المنتجات والأسعار */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* شريط البحث والعمليات */}
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <input
              type="text"
              placeholder="ابحث باسم المنتج أو الـ SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 w-full md:w-80 focus:outline-none focus:border-amber-500"
            />

            <button
              onClick={() => alert('ميزة إضافة منتج جديد ستتاح في التحديث القادم')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              + إضافة منتج جديد للكتالوج
            </button>
          </div>

          {/* جدول المنتجات */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">الرمز (SKU)</th>
                  <th className="p-3">اسم المنتج</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">حجم الطرد (Fardeau)</th>
                  <th className="p-3">سعر التكلفة</th>
                  <th className="p-3">سعر الجملة</th>
                  <th className="p-3">سعر التجزئة</th>
                  <th className="p-3">المخزون المركزي</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-mono text-amber-400 font-bold">{product.sku}</td>
                    <td className="p-3 font-bold text-white">{product.name}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-indigo-300">
                      {product.unitsPerFardeau} قطعة / Fardeau
                    </td>
                    <td className="p-3 text-slate-400">{product.costPrice} د.ج</td>
                    <td className="p-3 font-bold text-emerald-400">{product.wholesalePrice} د.ج</td>
                    <td className="p-3 font-bold text-cyan-400">{product.retailPrice} د.ج</td>
                    <td className="p-3 font-bold text-white">{product.stockQuantity} طرد</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          product.isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {product.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. تبويب شرائح التخفيض الحجمي */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">قواعد الخصم الحجمي المبرمجة</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تطبق هذه الخصومات تلقائياً في شاشة البيع للمندوب عند تجاوز طلبية الزبون للحد الأدنى من الطرود
              </p>
            </div>
            <button
              onClick={() => alert('ميزة إضافة شريحة خصم جديدة ستتاح قريبآ')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
            >
              + إضافة شريحة خصم
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800">
                    {discount.productSku}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1">{discount.productName}</h4>
                  <p className="text-xs text-slate-400 mt-2">
                    الحد الأدنى للشراء: <span className="text-amber-400 font-bold">{discount.minFardeauQuantity} طرد</span>
                  </p>
                </div>

                <div className="text-left bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block">نسبة الخصم</span>
                  <span className="text-xl font-black text-emerald-400">
                    {discount.discountPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

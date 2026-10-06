import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/db';
import { Product } from '../../../schemas/sfa';

export interface CartItem {
  product: Product;
  quantityFardeau: number;
  quantityUnit: number;
  totalPrice: number;
}

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductCatalogModal({
  isOpen,
  onClose,
  onAddToCart,
}: ProductCatalogModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // حالة الكميات المحددة لكل منتج
  const [quantities, setQuantities] = useState<{
    [key: string]: { fardeau: number; unit: number };
  }>({});

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await db.products.toArray();
      setProducts(allProducts);
    } catch (error) {
      console.error('فشل في تحميل المنتجات من IndexedDB:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // استخراج الفئات الفريدة للمنتجات
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  // تصفية المنتجات حسب البحث والفئة
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuantityChange = (
    productId: string,
    type: 'fardeau' | 'unit',
    value: number
  ) => {
    const val = Math.max(0, value);
    setQuantities((prev) => ({
      ...prev,
      [productId]: {
        fardeau: type === 'fardeau' ? val : prev[productId]?.fardeau || 0,
        unit: type === 'unit' ? val : prev[productId]?.unit || 0,
      },
    }));
  };

  const handleAdd = (product: Product) => {
    const q = quantities[product.id] || { fardeau: 0, unit: 0 };
    if (q.fardeau === 0 && q.unit === 0) {
      alert('الرجاء تحديد كمية (طرد أو وحدة) على الأقل قبل الإضافة للسلة.');
      return;
    }

    const unitPrice = product.priceUnit;
    const fardeauPrice = product.priceUnit * product.itemsPerFardeau;
    const totalPrice = q.fardeau * fardeauPrice + q.unit * unitPrice;

    onAddToCart({
      product,
      quantityFardeau: q.fardeau,
      quantityUnit: q.unit,
      totalPrice,
    });

    // إعادة ضبط الكمية المحلية بعد الإضافة
    setQuantities((prev) => ({
      ...prev,
      [product.id]: { fardeau: 0, unit: 0 },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* الشريط العلوي للمكون */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
              كتالوج المنتجات السريع (Offline Catalog)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              اختر المنتجات والكميات المطلوبة لإضافتها المباشرة لفاتورة البيع الميداني
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-bold"
          >
            ✕
          </button>
        </div>

        {/* أدوات البحث والفلترة */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ابحث عن منتج بالاسم أو الـ SKU..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3 outline-none transition-all"
          />

          {/* فئات المنتجات */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat === 'all' ? 'جميع الفئات' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة المنتجات */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              جاري تحميل المنتجات من الخزنة المحلية...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              لم يتم العثور على أي منتج يطابق خيارات البحث.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const q = quantities[product.id] || { fardeau: 0, unit: 0 };
              const fardeauPrice = product.priceUnit * product.itemsPerFardeau;
              const currentTotal = q.fardeau * fardeauPrice + q.unit * product.priceUnit;

              return (
                <div
                  key={product.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  {/* معلومات المنتج */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{product.name}</h3>
                      <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                        {product.sku}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>الفئة: <strong className="text-slate-200">{product.category}</strong></span>
                      <span>سعر الوحدة: <strong className="text-emerald-400">{product.priceUnit.toLocaleString()} د.ج</strong></span>
                      <span>القطع/طرد: <strong className="text-slate-200">{product.itemsPerFardeau}</strong></span>
                      <span>المخزون المتاح: <strong className="text-indigo-400">{product.stockFardeau} طرد</strong></span>
                    </div>
                  </div>

                  {/* أداة التحكم بالكميات وزر الإضافة */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    {/* كمية Fardeau */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 mb-1">طرد (Fardeau)</span>
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(product.id, 'fardeau', q.fardeau - 1)}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={q.fardeau}
                          onChange={(e) =>
                            handleQuantityChange(product.id, 'fardeau', parseInt(e.target.value) || 0)
                          }
                          className="w-12 bg-transparent text-center text-xs text-white font-bold outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(product.id, 'fardeau', q.fardeau + 1)}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* كمية Unité */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 mb-1">وحدة (Unité)</span>
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(product.id, 'unit', q.unit - 1)}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={q.unit}
                          onChange={(e) =>
                            handleQuantityChange(product.id, 'unit', parseInt(e.target.value) || 0)
                          }
                          className="w-12 bg-transparent text-center text-xs text-white font-bold outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(product.id, 'unit', q.unit + 1)}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* الإجمالي والزر */}
                    <div className="flex flex-col items-end min-w-28">
                      <span className="text-[10px] text-slate-400">الإجمالي الجزئي</span>
                      <span className="text-xs font-black text-emerald-400 mb-1">
                        {currentTotal.toLocaleString()} د.ج
                      </span>
                      <button
                        onClick={() => handleAdd(product)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow"
                      >
                        + إضافة
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* الأسفل */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
          >
            إغلاق الكتالوج
          </button>
        </div>
      </div>
    </div>
  );
}

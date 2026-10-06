import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  CreditCard, 
  UserCheck, 
  RefreshCw, 
  Search, 
  Lock, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Users
} from 'lucide-react';
import { db } from '../../../lib/db';

interface CustomerCredit {
  id: string;
  name: string;
  code: string;
  currentDebt: number;
  creditLimit: number;
  isBlocked: boolean;
}

export const CreditAndPinManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'limits' | 'pins'>('limits');
  
  // حالة إدارة أسقف الديون
  const [customers, setCustomers] = useState<CustomerCredit[]>([
    { id: 'CUST_001', name: 'مؤسسة الأوراس للتوزيع', code: 'CUST_ALG_01', currentDebt: 450000, creditLimit: 300000, isBlocked: true },
    { id: 'CUST_002', name: 'سوپيرات الهضاب', code: 'CUST_ALG_02', currentDebt: 120000, creditLimit: 200000, isBlocked: false },
    { id: 'CUST_003', name: 'محل البركة للجملة', code: 'CUST_ALG_03', currentDebt: 500000, creditLimit: 500000, isBlocked: true },
    { id: 'CUST_004', name: 'تجزئة الوفاء', code: 'CUST_ALG_04', currentDebt: 45000, creditLimit: 150000, isBlocked: false },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newLimitInput, setNewLimitInput] = useState<number>(0);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // حالة توليد رموز الـ PIN والتوكنات
  const [supervisorPin, setSupervisorPin] = useState('8899');
  const [generatedToken, setGeneratedToken] = useState('');
  const [tokenValidityHours, setTokenValidityHours] = useState(24);
  const [copiedToken, setCopiedToken] = useState(false);

  // تصفية الزبائن
  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || c.code.includes(searchQuery)
  );

  // اختيار زبون لتعديل سقفه
  const handleSelectCustomer = (customer: CustomerCredit) => {
    setSelectedCustomerId(customer.id);
    setNewLimitInput(customer.creditLimit);
    setSaveSuccessMessage('');
  };

  // حفظ سقف الدين الجديد
  const handleSaveCreditLimit = () => {
    if (!selectedCustomerId) return;

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        const updatedLimit = newLimitInput;
        const isBlocked = c.currentDebt > updatedLimit;
        return { ...c, creditLimit: updatedLimit, isBlocked };
      }
      return c;
    }));

    setSaveSuccessMessage('✅ تم تحديث سقف الدين بنجاح وتحديث حالة التجميد تلقائياً!');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  // توليد رمز PIN جديد للمشرف
  const handleGenerateNewPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setSupervisorPin(randomPin);
  };

  // توليد توكن تجاوز أوفلاين للطوارئ
  const handleGenerateOfflineToken = () => {
    const prefix = 'OVR';
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const token = `${prefix}-${timestamp}-${randomHex}`;
    setGeneratedToken(token);
    setCopiedToken(false);
  };

  // نسخ التوكن
  const handleCopyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* رأس الموديل والتبويبات الفرعية */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span>لوحة الإدارة المالية والصلاحيات</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">إدارة بلافون الكريدي ورموز الحماية (PINs)</h2>
          <p className="text-xs text-slate-500 mt-1">ضبط السقف المالي لكل زبون وتوليد التوكنات الأمنية لتجاوز الديون ميدانياً</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('limits')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'limits' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>أسقف الديون (Plafond)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pins')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'pins' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>رموز الـ PIN والتوكنات</span>
          </button>
        </div>
      </div>

      {/* التبويب الأول: أسقف الديون للزبائن */}
      {activeSubTab === 'limits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* قائمة الزبائن والبحث */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>قائمة الزبائن والوضع المالي الحالي</span>
              </h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث عن زبون أو كود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* جدول الزبائن */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3">الزبون</th>
                    <th className="p-3">الدين الحالي</th>
                    <th className="p-3">سقف الدين (Plafond)</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        selectedCustomerId === customer.id ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-slate-800">
                        <div>{customer.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{customer.code}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {customer.currentDebt.toLocaleString()} د.ج
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        {customer.creditLimit.toLocaleString()} د.ج
                      </td>
                      <td className="p-3 text-center">
                        {customer.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> متجاوز (مجمد)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> سليم
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleSelectCustomer(customer)}
                          className="px-3 py-1 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg text-[11px] transition-colors"
                        >
                          تعديل السقف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* لوحة تعديل السقف للزبون المحدد */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>تعديل سقف الدين المالي</span>
            </h3>

            {selectedCustomerId ? (
              <div className="space-y-4">
                {(() => {
                  const curr = customers.find(c => c.id === selectedCustomerId);
                  if (!curr) return null;
                  return (
                    <>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <div className="text-xs font-bold text-slate-800">{curr.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">الكود: {curr.code}</div>
                        <div className="text-xs text-slate-600 pt-1">
                          الدين الحالي: <span className="font-mono font-bold text-slate-900">{curr.currentDebt.toLocaleString()} د.ج</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">سقف الدين الجديد (د.ج):</label>
                        <input
                          type="number"
                          step="10000"
                          value={newLimitInput}
                          onChange={(e) => setNewLimitInput(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {saveSuccessMessage && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                          {saveSuccessMessage}
                        </div>
                      )}

                      <button
                        onClick={handleSaveCreditLimit}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                      >
                        حفظ السقف وتطبيق القواعد
                      </button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <CreditCard className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">اختر زبوناً من القائمة على اليمين لتعديل سقف الدين المسموح به</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* التبويب الثاني: إدارة الـ PIN والتوكنات أوفلاين */}
      {activeSubTab === 'pins' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* كارت رمز المشرف Supervisor PIN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">رمز تجاوز المشرف (Supervisor PIN)</h3>
                <p className="text-xs text-slate-500">يستخدمه المشرف ميدانياً لإدخاله على هاتف المندوب عند التجاوز</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl text-center space-y-2">
              <span className="text-[10px] text-slate-400 block tracking-widest">CURRENT PIN</span>
              <div className="font-mono text-3xl font-black tracking-widest text-amber-400">{supervisorPin}</div>
            </div>

            <button
              onClick={handleGenerateNewPin}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>توليد رمز PIN جديد عشوائي</span>
            </button>
          </div>

          {/* كارت مولد توكنات التجاوز أوفلاين Emergency Tokens */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">مولد توكنات التجاوز الأوفلاين</h3>
                <p className="text-xs text-slate-500">إصدار رمز مؤقت يرسل للمندوب عبر SMS/WhatsApp في المناطق بدون تغطية</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">مدة الصلاحية:</label>
                <select
                  value={tokenValidityHours}
                  onChange={(e) => setTokenValidityHours(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value={12}>12 ساعة</option>
                  <option value={24}>24 ساعة (يوم كامل)</option>
                  <option value={48}>48 ساعة</option>
                </select>
              </div>

              <button
                onClick={handleGenerateOfflineToken}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                توليد توكن تجاوز أوفلاين جديد
              </button>

              {generatedToken && (
                <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700">TOKEN READY</span>
                    <span className="text-[10px] text-indigo-500 font-mono">صالح لـ {tokenValidityHours} ساعة</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-indigo-100 font-mono text-xs font-black text-indigo-950">
                    <span>{generatedToken}</span>
                    <button
                      onClick={handleCopyToken}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="نسخ التوكن"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedToken && <span className="text-[10px] font-bold text-emerald-600 block text-left">✓ تم النسخ إلى الحافظة</span>}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default CreditAndPinManager;
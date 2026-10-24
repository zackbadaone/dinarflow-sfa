import { db } from './db';

export async function seedInitialData() {
  const productsCount = await db.products.count();
  
  if (productsCount > 0) {
    console.log('⚡ [SeedData] البيانات الأولية موجودة بالفعل في Dexie IndexedDB.');
    return;
  }

  console.log('🌱 [SeedData] بدء حقن البيانات الميدانية الأولية في قاعدة بيانات Dexie...');

  await db.transaction('rw', [db.products, db.customers, db.vanInventory, db.settings], async () => {
    // 1. حقن كتالوج المنتجات
    await db.products.bulkAdd([
      {
        id: 'prod-001',
        name: 'مشروب غازي حمود بوعلام 1.5ل',
        sku: 'HB-15L',
        priceUnit: 85,
        itemsPerFardeau: 6,
        stockFardeau: 150,
        category: 'مشروبات',
      },
      {
        id: 'prod-002',
        name: 'ماء معدني لالة خديجة 1.5ل',
        sku: 'LK-15L',
        priceUnit: 35,
        itemsPerFardeau: 6,
        stockFardeau: 300,
        category: 'مياه',
      },
      {
        id: 'prod-003',
        name: 'بسكويت بيمو الشوكولاتة 120غ',
        sku: 'BIMO-120G',
        priceUnit: 60,
        itemsPerFardeau: 24,
        stockFardeau: 80,
        category: 'مكولات خفيفة',
      },
      {
        id: 'prod-004',
        name: 'زيت المائدة إيليو 5ل',
        sku: 'ELIO-5L',
        priceUnit: 620,
        itemsPerFardeau: 4,
        stockFardeau: 50,
        category: 'مواد غذائية',
      },
      {
        id: 'prod-005',
        name: 'مسحوق الغسيل إيزيس 1كغ',
        sku: 'ISIS-1KG',
        priceUnit: 210,
        itemsPerFardeau: 12,
        stockFardeau: 100,
        category: 'منظفات',
      },
    ]);

    // 2. حقن الزبائن والحوانيت
    await db.customers.bulkAdd([
      {
        id: 'cust-001',
        name: 'سوبرماركت البركة',
        owner_name: 'الحاج بومدين',
        phone: '0550123456',
        address: 'حي الزيتون - تلمسان',
        debt: 45000,
        debt_age_days: 12,
        credit_limit: 100000,
        status: 'active',
      },
      {
        id: 'cust-002',
        name: 'تغذية عامة السلام',
        owner_name: 'عبد القادر',
        phone: '0661987654',
        address: 'شارع الاستقلال - الرمشي',
        debt: 85000,
        debt_age_days: 35,
        credit_limit: 80000,
        status: 'active',
      },
      {
        id: 'cust-003',
        name: 'متجر الهناء للتجزئة',
        owner_name: 'محمد السعيد',
        phone: '0770456789',
        address: 'وسط المدينة - مغنية',
        debt: 0,
        debt_age_days: 0,
        credit_limit: 50000,
        status: 'active',
      },
    ]);

    // 3. حقن عهدة الشاحنة الميدانية (Van Inventory)
    await db.vanInventory.bulkAdd([
      {
        id: 'van-inv-001',
        loadingTaskId: 'task-001',
        driverId: 'driver-001',
        items: [
          { productId: 'prod-001', quantityLoaded: 40, quantityRemaining: 40, quantitySold: 0, quantityReturnedSain: 0, quantityReturnedAvarie: 0 },
          { productId: 'prod-002', quantityLoaded: 80, quantityRemaining: 80, quantitySold: 0, quantityReturnedSain: 0, quantityReturnedAvarie: 0 },
          { productId: 'prod-003', quantityLoaded: 20, quantityRemaining: 20, quantitySold: 0, quantityReturnedSain: 0, quantityReturnedAvarie: 0 },
          { productId: 'prod-004', quantityLoaded: 15, quantityRemaining: 15, quantitySold: 0, quantityReturnedSain: 0, quantityReturnedAvarie: 0 },
          { productId: 'prod-005', quantityLoaded: 25, quantityRemaining: 25, quantitySold: 0, quantityReturnedSain: 0, quantityReturnedAvarie: 0 },
        ],
        status: 'active',
        updatedAt: new Date().toISOString(),
      },
    ]);

    // 4. إعدادات النظام الأولية
    await db.settings.put({
      key: 'system_initialized',
      value: 'true',
    });
  });

  console.log('✅ [SeedData] تم حقن البيانات الأولية بنجاح.');
}

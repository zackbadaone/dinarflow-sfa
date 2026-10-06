import Dexie, { Table } from 'dexie';
import { 
  Product, 
  Customer, 
  OverrideToken, 
  DeliveryReceipt, 
  LoadingTask, 
  VanInventory, 
  Reconciliation 
} from '../schemas/sfa';

export interface SystemSetting {
  key: string;
  value: any;
}

/**
 * بناء قاعدة البيانات المحلية المعزولة (IndexedDB via Dexie)
 * تضمن هذه الطبقة التخزين الفوري والمؤمن لجميع عمليات المندوب الميداني أوفلاين.
 */
export class DinarFlowDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  overrideTokens!: Table<OverrideToken>;
  deliveryReceipts!: Table<DeliveryReceipt>;
  loadingTasks!: Table<LoadingTask>;
  vanInventory!: Table<VanInventory>;
  reconciliations!: Table<Reconciliation>;
  settings!: Table<SystemSetting>;

  constructor() {
    super('DinarFlowSFADB');

    // تعريف المخطط الهيكلي والجداول المحلية (Version 3 لدعم الشحن والمخزون الميداني أوفلاين)
    this.version(3).stores({
      products: 'id, name, sku, category',
      customers: 'id, name, phone, debt, status',
      overrideTokens: 'tokenId, customerId, expiresAt',
      // الحقل syncStatus ضروري جداً لاختبارات المحاكاة لمعرفة هل الفاتورة رُفعت للسيرفر أم ما زالت أوفلاين
      deliveryReceipts: 'id, orderId, customerId, driverId, syncStatus, createdAt',
      // جداول أمين المستودع والشحن وتجهيز الشاحنات
      loadingTasks: 'id, driverId, status, syncStatus, createdAt',
      vanInventory: 'id, loadingTaskId, driverId, status, updatedAt',
      reconciliations: 'id, loadingTaskId, driverId, status, createdAt',
      // جدول الإعدادات وتخزين توكين التوثيق والمستخدم الحاضر أوفلاين
      settings: 'key',
    });
  }

  // --- أدوات مساعدة خاصة باختبار المحاكاة الشامل وتتبع التزامن ---

  /**
   * جلب كافة الفواتير المعلقة التي تنتظر المزامنة (Pending Invoices)
   */
  async getPendingReceipts(): Promise<DeliveryReceipt[]> {
    return await this.deliveryReceipts
      .where('syncStatus')
      .equals('pending')
      .toArray();
  }

  /**
   * جلب كافة الفواتير التي تمت مزامنتها بنجاح مع السيرفر (Synced Invoices)
   */
  async getSyncedReceipts(): Promise<DeliveryReceipt[]> {
    return await this.deliveryReceipts
      .where('syncStatus')
      .equals('synced')
      .toArray();
  }

  /**
   * ملخص إحصائي سريع لحالة الفواتير أوفلاين/أونلاين لدعم شاشات التدقيق والمحاكاة
   */
  async getSyncMetricsSummary(): Promise<{ pending: number; synced: number; failed: number }> {
    const pending = await this.deliveryReceipts.where('syncStatus').equals('pending').count();
    const synced = await this.deliveryReceipts.where('syncStatus').equals('synced').count();
    const failed = await this.deliveryReceipts.where('syncStatus').equals('failed').count();

    return { pending, synced, failed };
  }

  /**
   * تفريغ وإعادة تهيئة قاعدة البيانات المحلية (تستخدم عند تسجيل الخروج أو اختبار البدء من صفر)
   */
  async clearAllTables(): Promise<void> {
    await Promise.all([
      this.products.clear(),
      this.customers.clear(),
      this.overrideTokens.clear(),
      this.deliveryReceipts.clear(),
      this.loadingTasks.clear(),
      this.vanInventory.clear(),
      this.reconciliations.clear(),
      this.settings.clear()
    ]);
  }
}

// تصدير كائن قاعدة البيانات الموحد للمشروع ليتم استدعاؤه في أي واجهة أو خدمة
export const db = new DinarFlowDatabase();
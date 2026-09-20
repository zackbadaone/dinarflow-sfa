import Dexie, { Table } from 'dexie';
import { Product, Customer, OverrideToken, DeliveryReceipt } from '../schemas/sfa';

export interface SystemSetting {
  key: string;
  value: any;
}

// بناء قاعدة البيانات المحلية المعزولة (IndexedDB via Dexie)
export class DinarFlowDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  overrideTokens!: Table<OverrideToken>;
  deliveryReceipts!: Table<DeliveryReceipt>;
  settings!: Table<SystemSetting>;

  constructor() {
    super('DinarFlowSFADB');

    // تعريف المخطط الهيكلي والجداول المحلية (Version 2 لدعم توكين التوثيق وإعدادات النظام)
    this.version(2).stores({
      products: 'id, name, sku, category',
      customers: 'id, name, phone, debt, status',
      overrideTokens: 'tokenId, customerId, expiresAt',
      // الحقل syncStatus ضروري جداً لاختبارات المحاكاة لمعرفة هل الفاتورة رُفعت للسيرفر أم ما زالت أوفلاين
      deliveryReceipts: 'id, orderId, customerId, driverId, syncStatus, createdAt',
      // جدول الإعدادات وتخزين توكين التوثيق والمستخدم الحاضر أوفلاين
      settings: 'key',
    });
  }
}

// تصدير كائن قاعدة البيانات الموحد للمشروع ليتم استدعاؤه في أي واجهة
export const db = new DinarFlowDatabase();
import { db } from '../lib/db';
import { DeliveryReceipt, OverrideToken, Product, Customer } from '../schemas/sfa';
import { apiClient } from './apiClient';
import { overrideService } from './overrideService'; // استدعاء خدمة التجاوز لجلب التوكين

// حجم الحزمة الميدانية (كم فاتورة نرسل في الطلب الواحد)
const BATCH_SIZE = 10; 
// زمن المزامنة الدورية في الخلفية بالملي ثانية (كل 15 دقيقة تلقائياً)
const DEFAULT_SYNC_INTERVAL_MS = 15 * 60 * 1000; 

export class SyncEngine {
  private isSyncing = false;
  private syncIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    // إضافة مستمع ذكي يراقب حالة الإنترنت تلقائياً بمجرد تشغيل التطبيق
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('⚡ عادت شبكة الإنترنت! محرك المزامنة يبدأ العمل تلقائياً (رفع الفواتير وجلب التحديثات)...');
        this.syncData();
      });

      // تفعيل المزامنة التلقائية الخفية في الخلفية
      this.startBackgroundSync();
    }
  }

  // 1. تفعيل محرك المزامنة التلقائية في الخلفية لتحديث الكتالوج والأسعار وسقوف الديون
  public startBackgroundSync(intervalMs: number = DEFAULT_SYNC_INTERVAL_MS) {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    console.log(`🔄 تم تفعيل محرك المزامنة الخفية في الخلفية كل ${intervalMs / 60000} دقيقة.`);

    this.syncIntervalId = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        console.log('⏰ بدء المزامنة الخفية التلقائية في الخلفية لتحديث الكتالوج وسقوف الديون...');
        this.pullUpdates();
      }
    }, intervalMs);
  }

  // إيقاف المزامنة الخفية عند الحاجة
  public stopBackgroundSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('🛑 تم إيقاف محرك المزامنة الخفية في الخلفية.');
    }
  }

  // أداة مساعدة: لتقسيم مصفوفة الفواتير إلى حزم (Batches)
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (const [i] of array.entries()) {
      if (i % size === 0) {
        chunks.push(array.slice(i, i + size));
      }
    }
    return chunks;
  }

  // 2. محرك الرفع السريع (Push Engine): رفع الفواتير والبونات المعلقة
  async syncData(): Promise<{ syncedCount: number; failedCount: number }> {
    if (this.isSyncing) {
      console.log('المزامنة جارية بالفعل...');
      return { syncedCount: 0, failedCount: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // جلب كل الفواتير المحفوظة أوفلاين وحالتها معلقة
      const pendingReceipts = await db.deliveryReceipts
        .where('syncStatus')
        .equals('pending')
        .toArray();

      if (pendingReceipts.length === 0) {
        console.log('لا توجد فواتير معلقة للمزامنة.');
      } else {
        console.log(`جاري تجميع ${pendingReceipts.length} بون معلق لرفعها حزمياً (Batches)...`);

        const batches = this.chunkArray(pendingReceipts, BATCH_SIZE);

        for (const [index, batch] of batches.entries()) {
          console.log(`إرسال الحزمة رقم ${index + 1} من أصل ${batches.length} (تحتوي ${batch.length} فاتورة)...`);
          
          const success = await this.uploadBatchToServer(batch);
          const batchIds = batch.map(receipt => receipt.id);

          if (success) {
            await db.deliveryReceipts
              .where('id')
              .anyOf(batchIds)
              .modify({ syncStatus: 'synced' });
              
            syncedCount += batch.length;
          } else {
            await db.deliveryReceipts
              .where('id')
              .anyOf(batchIds)
              .modify({ syncStatus: 'failed' });
              
            failedCount += batch.length;
          }
        }
      }

      // بعد انتهاء الرفع، نقوم بتشغيل محرك الجلب والتحديث الذكي (Pull Engine)
      await this.pullUpdates();

    } catch (error) {
      console.error('حدث خطأ أثناء عملية المزامنة الشاملة:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, failedCount };
  }

  // 3. محرك التحديث الذكي (Pull Engine - Cloud to Offline)
  async pullUpdates(): Promise<boolean> {
    try {
      const lastSyncSetting = await db.settings.get('last_sync_timestamp');
      const lastSync = lastSyncSetting?.value || '1970-01-01T00:00:00.000Z';

      console.log(`📥 [Pull Engine] جلب التحديثات من السيرفر (أسعار، كتالوج، ديون، مخزون) منذ: ${lastSync}`);

      const response = await apiClient.get<{
        products: Product[];
        customers: Customer[];
        timestamp: string;
      }>(`/sync/pull?since=${encodeURIComponent(lastSync)}`);

      if (response) {
        const { products, customers, timestamp } = response;

        if (products && products.length > 0) {
          await db.products.bulkPut(products);
          console.log(`✅ [خلفية النظام] تم تحديث أسعار ومخزون وكتالوج ${products.length} منتج محلياً في Dexie.`);
        }

        if (customers && customers.length > 0) {
          await db.customers.bulkPut(customers);
          console.log(`✅ [خلفية النظام] تم تحديث سقوف الديون وبيانات ${customers.length} زبون محلياً في Dexie.`);
        }

        await db.settings.put({
          key: 'last_sync_timestamp',
          value: timestamp || new Date().toISOString()
        });

        if (typeof window !== 'undefined' && ((products && products.length > 0) || (customers && customers.length > 0))) {
          window.dispatchEvent(new CustomEvent('sfa_catalog_updated', {
            detail: {
              updatedProductsCount: products?.length || 0,
              updatedCustomersCount: customers?.length || 0,
              timestamp: timestamp
            }
          }));
        }

        console.log('✅ اكتملت عملية جلب وتحديث الكتالوج والمخزون وسقوف الديون أوتوماتيكياً في الخلفية.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ فشل جلب التحديثات من السيرفر (Pull Engine):', error);
      return false;
    }
  }

  // 4. رفع حزمة كاملة للسيرفر المركزي عبر المسار الموحد /orders/sync مع التقاط بيانات التجاوز
  private async uploadBatchToServer(batch: DeliveryReceipt[]): Promise<boolean> {
    try {
      // نجهز الفواتير ونلتقط الاستثناءات الميدانية (isOverridden و supervisorPin)
      const enrichedBatch = await Promise.all(batch.map(async (receipt) => {
        // توسيع نوع الفاتورة محلياً لتشمل حقول التجاوز الميدانية بدون مشاكل TypeScript
        const r = receipt as DeliveryReceipt & {
          isOverridden?: boolean;
          supervisorPin?: string;
          overrideDate?: string;
        };

        const activeToken = await overrideService.getActiveTokenForCustomer(receipt.customerId);
        
        // طباعة تنبيه في الـ console عند اكتشاف بون تجاوز ميداني
        if (r.isOverridden) {
          console.log(`⚠️ [تنبيه المزامنة] البون (${receipt.id}) ينطوي على تجاوز ديون استثنائي عبر الـ PIN (${r.supervisorPin}).`);
        }

        return {
          ...receipt,
          isOverridden: r.isOverridden ?? false,
          supervisorPin: r.supervisorPin ?? null,
          overrideDate: r.overrideDate ?? null,
          overrideToken: activeToken ? activeToken : undefined
        };
      }));

      // إرسال الحزمة إلى المسار المعاير /orders/sync
      await apiClient.post('/orders/sync', { 
        receipts: enrichedBatch,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ تم رفع الحزمة (${enrichedBatch.length} فواتير) للسيرفر المركزي بنجاح عبر /orders/sync.`);
      return true;
    } catch (err) {
      console.error('❌ فشل رفع الحزمة إلى /orders/sync:', err);
      return false;
    }
  }

  // 5. فك وتأكيد صلاحية توكين التجاوز الاستثنائي لـ 24 ساعة (Override Token)
  validateOverrideToken(token: OverrideToken): { valid: boolean; reason?: string } {
    const now = new Date();
    const expirationDate = new Date(token.expiresAt);

    if (now > expirationDate) {
      return { valid: false, reason: 'انتهت صلاحية التوكين (تجاوزت 24 ساعة).' };
    }

    if (!token.tokenId || !token.approvedByAdminId) {
      return { valid: false, reason: 'توكين التجاوز غير مكتمل البيانات.' };
    }

    return { valid: true };
  }

  getSyncStatus(): boolean {
    return this.isSyncing;
  }
}

export const syncEngine = new SyncEngine();
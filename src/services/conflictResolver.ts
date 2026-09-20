import { db } from '../lib/db';
import { DeliveryReceipt, Product, Customer } from '../schemas/sfa';

export interface SyncConflictPayload {
  receiptId: string;
  conflictType: 'INSUFFICIENT_STOCK' | 'CREDIT_LIMIT_EXCEEDED' | 'DUPLICATE_RECEIPT' | 'SERVER_PRICE_MISMATCH';
  serverProductData?: Partial<Product>[];
  serverCustomerData?: Partial<Customer>;
  serverMessage: string;
}

export class ConflictResolver {
  /**
   * معالجة التعارض وفق مبدأ "السيرفر القاضي":
   * يتم تحديث البيانات المحلية (المخزون، رصيد الدين، أو الأسعار) لتتطابق مع رأي السيرفر القاطع،
   * وتعديل حالة الفاتورة المحلية المعنية.
   */
  async resolveReceiptConflict(payload: SyncConflictPayload): Promise<void> {
    console.warn(`⚠️ [ConflictResolver] جاري معالجة تعارض الفاتورة (${payload.receiptId}): ${payload.serverMessage}`);

    const receipt = await db.deliveryReceipts.get(payload.receiptId);
    if (!receipt) {
      console.error(`❌ الفاتورة المراد فض نزاعها غير موجودة محلياً: ${payload.receiptId}`);
      return;
    }

    switch (payload.conflictType) {
      case 'INSUFFICIENT_STOCK':
        await this.handleStockConflict(receipt, payload);
        break;

      case 'CREDIT_LIMIT_EXCEEDED':
        await this.handleCreditLimitConflict(receipt, payload);
        break;

      case 'SERVER_PRICE_MISMATCH':
        await this.handlePriceMismatchConflict(receipt, payload);
        break;

      case 'DUPLICATE_RECEIPT':
        // الفاتورة مكررة وموجودة سابقاً في السيرفر، نعلمها كمزمنة فوراً
        await db.deliveryReceipts.update(payload.receiptId, { syncStatus: 'synced' });
        console.log(`✅ تم تعليم الفاتورة المكررة ${payload.receiptId} كـ Synced.`);
        break;

      default:
        await db.deliveryReceipts.update(payload.receiptId, { syncStatus: 'failed' });
        break;
    }
  }

  // 1. معالجة تعارض عدم توفر المخزون في السيرفر
  private async handleStockConflict(receipt: DeliveryReceipt, payload: SyncConflictPayload) {
    await db.deliveryReceipts.update(receipt.id, { syncStatus: 'failed' });

    if (payload.serverProductData && payload.serverProductData.length > 0) {
      for (const prodUpdate of payload.serverProductData) {
        if (prodUpdate.id) {
          await db.products.update(prodUpdate.id, prodUpdate);
        }
      }
      console.log(`🔄 تم تحديث كميات المخزون محلياً بناءً على قرار السيرفر القاضي.`);
    }
  }

  // 2. معالجة تعارض تجاوز سقف الدين
  private async handleCreditLimitConflict(receipt: DeliveryReceipt, payload: SyncConflictPayload) {
    await db.deliveryReceipts.update(receipt.id, { syncStatus: 'failed' });

    if (payload.serverCustomerData && payload.serverCustomerData.id) {
      await db.customers.update(payload.serverCustomerData.id, payload.serverCustomerData);
      console.log(`🔄 تم تصحيح سقف دين ورصيد الزبون (${payload.serverCustomerData.id}) وفق قرار السيرفر.`);
    }
  }

  // 3. معالجة تعارض اختلاف أسعار المنتجات
  private async handlePriceMismatchConflict(receipt: DeliveryReceipt, payload: SyncConflictPayload) {
    await db.deliveryReceipts.update(receipt.id, { syncStatus: 'failed' });

    if (payload.serverProductData && payload.serverProductData.length > 0) {
      for (const prodUpdate of payload.serverProductData) {
        if (prodUpdate.id) {
          await db.products.update(prodUpdate.id, prodUpdate);
        }
      }
      console.log(`🔄 تم تحديث أسعار المنتجات محلياً للأسعار الرسمية المعتمدة في السيرفر.`);
    }
  }
}

export const conflictResolver = new ConflictResolver();

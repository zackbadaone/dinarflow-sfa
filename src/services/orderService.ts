import { db } from '../lib/db';
import { CartItem } from '../components/modules/vendeur/ProductCatalogModal';

export interface OrderCreationPayload {
  customerId: string;
  vendorId: string;
  driverId: string;
  items: CartItem[];
  paymentMethod: 'cash' | 'credit' | 'mixed';
  cashPaid: number;
  discountAmount?: number;
}

export class OrderService {
  /**
   * حساب مجاميع الطلبية، الخصومات، وتوليد مفتاح الفرادة للمزامنة الآمنة
   */
  static async createOfflineOrder(payload: OrderCreationPayload) {
    const subTotal = payload.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = payload.discountAmount || 0;
    const totalAmount = Math.max(0, subTotal - discount);
    
    const creditAdded = payload.paymentMethod === 'cash' ? 0 : Math.max(0, totalAmount - payload.cashPaid);
    
    // توليد مفتاح فرادة تشفيري لمنع تكرار القيود المالية في خادم Laravel (Idempotency Key)
    const idempotencyKey = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    const orderRecord = {
      id: orderId,
      idempotencyKey,
      orderId,
      customerId: payload.customerId,
      driverId: payload.driverId || '00000000-0000-0000-0000-000000000000',
      items: payload.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantityFardeau: item.quantityFardeau,
        quantityUnit: item.quantityUnit,
        unitPrice: item.product.priceUnit,
        totalPrice: item.totalPrice,
        returnedSainUnit: 0,
        returnedAvarieUnit: 0,
      })),
      subTotal,
      taxRate: 0,
      taxAmount: 0,
      totalAmount,
      cashPaid: payload.cashPaid,
      creditAdded,
      paymentMethod: payload.paymentMethod,
      status: 'validated' as const,
      syncStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // حفظ الطلب في جدول deliveryReceipts محلياً في Dexie
    await db.deliveryReceipts.put(orderRecord);
    console.log(`📦 [OrderService] تم حفظ الطلب أوفلاين بنجاح مع مفتاح فرادة: ${idempotencyKey}`);

    return orderRecord;
  }
}

export const orderService = new OrderService();

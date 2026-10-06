import { db } from "../lib/db";
import { 
  DeliveryReceipt, 
  OrderItem, 
  PaymentMethod, 
  InvoiceStatus 
} from "../schemas/sfa";

export interface InvoiceCalculationResult {
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  totalItemsCount: number;
  returnedSainCount: number;
  returnedAvarieCount: number;
}

export interface CreateInvoiceInput {
  orderId: string;
  customerId: string;
  driverId: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  cashPaid: number;
  creditAdded: number;
  taxRate?: number;
  overrideTokenUsed?: string;
}

/**
 * خدمة المحرك المالي للفواتير وتسوية المرتجعات أوفلاين
 */
export class InvoiceService {
  /**
   * حساب مجاميع الفاتورة والضرائب والمرتجعات محلياً
   */
  static calculateTotals(
    items: OrderItem[], 
    taxRate: number = 0
  ): InvoiceCalculationResult {
    let subTotal = 0;
    let totalItemsCount = 0;
    let returnedSainCount = 0;
    let returnedAvarieCount = 0;

    items.forEach((item) => {
      // حساب الإجمالي لكل بند بناءً على الربطات والقطع
      const itemSubtotal = (item.quantityFardeau * item.unitPrice) + (item.quantityUnit * item.unitPrice);
      subTotal += itemSubtotal;
      totalItemsCount += item.quantityFardeau + item.quantityUnit;
      
      returnedSainCount += item.returnedSainUnit || 0;
      returnedAvarieCount += item.returnedAvarieUnit || 0;
    });

    const taxAmount = (subTotal * taxRate) / 100;
    const totalAmount = subTotal + taxAmount;

    return {
      subTotal: Math.round(subTotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItemsCount,
      returnedSainCount,
      returnedAvarieCount,
    };
  }

  /**
   * إغلاق الفاتورة وتخزينها في Dexie كـ Pending Sync
   */
  static async createInvoice(input: CreateInvoiceInput): Promise<DeliveryReceipt> {
    const totals = this.calculateTotals(input.items, input.taxRate || 0);

    // إنشاء كائن الفاتورة المكتمل المالي
    const invoice: DeliveryReceipt = {
      id: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(), // منع تكرار التسجيل في السيرفر
      orderId: input.orderId,
      customerId: input.customerId,
      driverId: input.driverId,
      items: input.items.map(item => ({
        ...item,
        totalPrice: (item.quantityFardeau * item.unitPrice) + (item.quantityUnit * item.unitPrice)
      })),
      subTotal: totals.subTotal,
      taxRate: input.taxRate || 0,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paymentMethod: input.paymentMethod,
      cashPaid: input.cashPaid,
      creditAdded: input.creditAdded,
      status: "validated" as InvoiceStatus,
      overrideTokenUsed: input.overrideTokenUsed,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. حفظ الفاتورة في Dexie أوفلاين
    await db.deliveryReceipts.put(invoice);

    // 2. تحديث مديونية الزبون أوفلاين إذا وجد دفع آجل (Credit)
    if (input.creditAdded > 0) {
      const customer = await db.customers.get(input.customerId);
      if (customer) {
        const updatedDebt = (customer.debt || 0) + input.creditAdded;
        await db.customers.update(input.customerId, { debt: updatedDebt });
      }
    }

    return invoice;
  }

  /**
   * جلب كافة الفواتير المنتظرة للمزامنة أوفلاين
   */
  static async getPendingInvoices(): Promise<DeliveryReceipt[]> {
    return await db.deliveryReceipts
      .where("syncStatus")
      .equals("pending")
      .toArray();
  }

  /**
   * جلب فواتير اليوم للزبون أو السائق
   */
  static async getDriverInvoicesToday(driverId: string): Promise<DeliveryReceipt[]> {
    const today = new Date().toISOString().split("T")[0];
    const invoices = await db.deliveryReceipts
      .where("driverId")
      .equals(driverId)
      .toArray();

    return invoices.filter(inv => inv.createdAt.startsWith(today));
  }
}
import { DeliveryReceipt, Customer } from '../schemas/sfa';

export class PrinterService {
  private isConnected = false;
  private printerName: string | null = null;

  // 1. الاتصال بمطبعة البلوتوث الميدانية (Bluetooth ESC/POS)
  async connectPrinter(): Promise<boolean> {
    try {
      console.log('جاري البحث عن مطبعة البلوتوث الحرارية الميدانية...');
      // محاكاة الاتصال بالجهاز عبر Bluetooth API
      this.isConnected = true;
      this.printerName = 'ESC/POS Thermal Printer (80mm)';
      console.log('تم الاتصال بالطابعة الحرارية بنجاح.');
      return true;
    } catch (error) {
      console.error('فشل الاتصال بالطابعة الحرارية:', error);
      this.isConnected = false;
      return false;
    }
  }

  // 2. طباعة بون التسليم النهائي (Bon de Livraison) مع الرمز المشفر QR
  async printDeliveryReceipt(receipt: DeliveryReceipt, customer: Customer): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connectPrinter();
      if (!connected) {
        console.error('تعذر إتمام الطباعة: الطابعة غير متصلة.');
        return false;
      }
    }

    console.log(`========================================`);
    console.log(`         DINARFLOW SFA - BON DE LIVRAISON`);
    console.log(`========================================`);
    console.log(`رقم البون: ${receipt.id}`);
    console.log(`المحل: ${customer.storeName} (${customer.ownerName})`);
    console.log(`الهاتف: ${customer.phone}`);
    console.log(`التاريخ: ${new Date(receipt.createdAt).toLocaleString('ar-DZ')}`);
    console.log(`----------------------------------------`);
    
    receipt.items.forEach((item, index) => {
      console.log(`${index + 1}. بند: ${item.productId} | ربطات: ${item.quantityFardeau} | قطع: ${item.quantityUnit} | السعر: ${item.unitPrice} د.ج`);
      if (item.returnedAvarieUnit > 0) {
        console.log(`   [مرتجع تالف - Avarie]: ${item.returnedAvarieUnit} قطعة`);
      }
      if (item.returnedSainUnit > 0) {
        console.log(`   [مرتجع سليم - Sain]: ${item.returnedSainUnit} قطعة`);
      }
    });

    console.log(`----------------------------------------`);
    console.log(`الإجمالي الكلي: ${receipt.totalAmount} د.ج`);
    console.log(`المبلغ المدفوع كاش: ${receipt.cashPaid} د.ج`);
    console.log(`الدين المضاف للزبون: ${receipt.creditAdded} د.ج`);
    if (receipt.overrideTokenUsed) {
      console.log(`* تم اعتماد توكين تجاوز استثنائي: ${receipt.overrideTokenUsed}`);
    }
    console.log(`----------------------------------------`);
    console.log(`[QR VERIFICATION CODE]: dinarflow://verify?receiptId=${receipt.id}&amount=${receipt.totalAmount}`);
    console.log(`========================================\n`);

    return true;
  }

  // 3. طباعة عدة بونات دفعة واحدة (Bulk Print)
  async printMultiple(receipts: { receipt: DeliveryReceipt; customer: Customer }[]): Promise<void> {
    for (const item of receipts) {
      await this.printDeliveryReceipt(item.receipt, item.customer);
    }
  }

  getPrinterStatus(): { isConnected: boolean; printerName: string | null } {
    return { isConnected: this.isConnected, printerName: this.printerName };
  }
}

export const printerService = new PrinterService();
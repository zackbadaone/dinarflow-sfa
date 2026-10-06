import { DeliveryReceipt, Customer } from '../schemas/sfa';

export class PrinterService {
  private isConnected = false;
  private printerName: string | null = null;
  private paperWidthColumns = 48; // العرض الافتراضي لطابعات 80mm Thermal Printers

  // 1. الاتصال بمطبعة البلوتوث الميدانية (Bluetooth ESC/POS)
  async connectPrinter(): Promise<boolean> {
    try {
      console.log('جاري البحث عن طابعة البلوتوث الحرارية الميدانية (ESC/POS)...');
      // محاكاة الاتصال بالجهاز عبر Web Bluetooth API
      this.isConnected = true;
      this.printerName = 'Rongta/Zebra ESC/POS Thermal 80mm';
      console.log('تم الاتصال بالطابعة الحرارية بنجاح.');
      return true;
    } catch (error) {
      console.error('فشل الاتصال بالطابعة الحرارية:', error);
      this.isConnected = false;
      return false;
    }
  }

  // 2. محرك بناء قالب الطباعة الحراري العربي الميداني (ESC/POS Thermal Template)
  private buildReceiptBuffer(receipt: DeliveryReceipt, customer: Customer): string {
    const divider = '='.repeat(this.paperWidthColumns);
    const subDivider = '-'.repeat(this.paperWidthColumns);
    const dateStr = new Date(receipt.createdAt).toLocaleString('ar-DZ', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    let lines: string[] = [];

    // الترويسة الرئيسية (Header)
    lines.push(divider);
    lines.push('             DINARFLOW SFA - الجزائر             ');
    lines.push('             وصل تسليم - BON DE LIVRAISON        ');
    lines.push(divider);
    lines.push(`رقم البون: ${receipt.id}`);
    lines.push(`التاريخ: ${dateStr}`);
    lines.push(`السائق: عثمان زروقي (ISUZU 3.5T)`);
    lines.push(subDivider);

    // بيانات التاجر والمحل (Customer Specs)
    lines.push(`المحل: ${customer.name}`);
    lines.push(`المالك: ${customer.owner_name || 'غير محدد'}`);
    lines.push(`الهاتف: ${customer.phone || 'غير محدد'}`);
    lines.push(`المنطقة: ${customer.zone || 'غير محدد'}`);
    lines.push(subDivider);

    // جدول المنتجات والسلع (Product Basket)
    lines.push('المنتج              | الطرد | القطع | السعر الصافي');
    lines.push(subDivider);

    receipt.items.forEach((item, index) => {
      const prodName = (item.productName || `منتج (${item.productId})`).padEnd(18, ' ');
      const fardeauStr = `${item.quantityFardeau}`.padStart(5, ' ');
      const unitStr = `${item.quantityUnit}`.padStart(5, ' ');
      const priceStr = `${(item.totalPrice).toLocaleString()} د.ج`.padStart(12, ' ');
      
      lines.push(`${index + 1}. ${prodName}|${fardeauStr}|${unitStr}|${priceStr}`);

      if (item.returnedAvarieUnit && item.returnedAvarieUnit > 0) {
        lines.push(`   ⚠️ مرتجع تالف (Avarie): ${item.returnedAvarieUnit} قطعة`);
      }
      if (item.returnedSainUnit && item.returnedSainUnit > 0) {
        lines.push(`   ↩️ مرتجع سليم (Sain): ${item.returnedSainUnit} قطعة`);
      }
    });

    lines.push(subDivider);

    // الحساب المالي الإجمالي والديون (Financials & Credit Status)
    lines.push(`المجموع الكلي:          ${receipt.totalAmount.toLocaleString()} د.ج`);
    lines.push(`المبلغ المدفوع (كاش):   ${receipt.cashPaid.toLocaleString()} د.ج`);
    
    if (receipt.creditAdded > 0) {
      lines.push(`الدين الجديد المضاف:   +${receipt.creditAdded.toLocaleString()} د.ج`);
    } else {
      lines.push(`حالة الدفع:             مسدد بالكامل (كاش)`);
    }

    lines.push(`الدين السابـق للزبون:   ${customer.debt.toLocaleString()} د.ج`);
    const totalFinalCredit = customer.debt + receipt.creditAdded;
    lines.push(`إجمالي الدين الإجمالي:  ${totalFinalCredit.toLocaleString()} د.ج`);
    lines.push(`سقف الدين المسموح:      ${customer.credit_limit.toLocaleString()} د.ج`);

    // حالة التجاوز والاستثناء المالي (Supervisor Override Badge)
    if (receipt.overrideTokenUsed) {
      lines.push(subDivider);
      lines.push('⚠️ تجاوز مالي معتمد أوفلاين (OVERRIDE APPROVED)');
      lines.push(`توكن الاستثناء:          ${receipt.overrideTokenUsed}`);
    }

    // الرمز المشفر ورسالة التذييل (QR Verification & Footer)
    lines.push(divider);
    lines.push(`[QR CODE]: dinarflow://verify?receipt=${receipt.id}&amt=${receipt.totalAmount}`);
    lines.push('       شكراً لتقتكم - بضاعة مسلمة بحالة سليمة      ');
    lines.push('   تطبيق DinarFlow SFA - نظام إدارة التوزيع الميداني   ');
    lines.push(divider);
    lines.push('\n\n'); // مسافة للقطع الحراري

    return lines.join('\n');
  }

  // 3. طباعة بون التسليم النهائي المباشر
  async printDeliveryReceipt(receipt: DeliveryReceipt, customer: Customer): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connectPrinter();
      if (!connected) {
        console.error('تعذر إتمام الطباعة: الطابعة غير متصلة.');
        return false;
      }
    }

    const receiptTemplate = this.buildReceiptBuffer(receipt, customer);
    
    console.log('================ [ESC/POS PRINTER OUTPUT] ================');
    console.log(receiptTemplate);
    console.log('==========================================================');

    return true;
  }

  // 4. طباعة عدة بونات دفعة واحدة (Bulk Print)
  async printMultiple(receipts: { receipt: DeliveryReceipt; customer: Customer }[]): Promise<void> {
    for (const item of receipts) {
      await this.printDeliveryReceipt(item.receipt, item.customer);
    }
  }

  // جلب حالة الطابعة الحالية
  getPrinterStatus(): { isConnected: boolean; printerName: string | null } {
    return { isConnected: this.isConnected, printerName: this.printerName };
  }
}

export const printerService = new PrinterService();
import { db } from "../lib/db";
import { Customer } from "../schemas/sfa";

export interface CreditStatusResult {
  customerId: string;
  currentDebt: number;
  creditLimit: number;
  availableCredit: number;
  isBlocked: boolean;
  canApproveAmount: boolean;
  exceededAmount: number;
}

/**
 * خدمة إدارة الديون والسقف الائتماني للزبائن أوفلاين
 */
export class CreditService {
  /**
   * جلب تفاصيل الرصيد المالي والسقف الائتماني للزبون
   */
  static async getCustomerCreditStatus(
    customerId: string, 
    requestedCreditAmount: number = 0
  ): Promise<CreditStatusResult> {
    const customer = await db.customers.get(customerId);

    if (!customer) {
      return {
        customerId,
        currentDebt: 0,
        creditLimit: 0,
        availableCredit: 0,
        isBlocked: true,
        canApproveAmount: false,
        exceededAmount: requestedCreditAmount,
      };
    }

    const currentDebt = customer.debt || 0;
    const creditLimit = customer.credit_limit || 0;
    const availableCredit = Math.max(0, creditLimit - currentDebt);
    const projectedDebt = currentDebt + requestedCreditAmount;
    const isExceeded = projectedDebt > creditLimit;
    const exceededAmount = isExceeded ? projectedDebt - creditLimit : 0;
    const isBlocked = customer.status === "blocked";

    return {
      customerId,
      currentDebt,
      creditLimit,
      availableCredit,
      isBlocked,
      canApproveAmount: !isBlocked && !isExceeded,
      exceededAmount,
    };
  }

  /**
   * فحص سريع هل المباشرة بالدفع الآجل مسموحة
   */
  static async validateCreditLimit(
    customerId: string, 
    creditAmount: number
  ): Promise<{ allowed: boolean; message?: string; exceededAmount?: number }> {
    const status = await this.getCustomerCreditStatus(customerId, creditAmount);

    if (status.isBlocked) {
      return { 
        allowed: false, 
        message: "حساب الزبون محظور من التعامل الآجل." 
      };
    }

    if (!status.canApproveAmount) {
      return { 
        allowed: false, 
        message: `تم تجاوز السقف الائتماني بمقدار ${status.exceededAmount} د.ج.`,
        exceededAmount: status.exceededAmount 
      };
    }

    return { allowed: true };
  }

  /**
   * تحديث مديونية الزبون محلياً في Dexie عند البيع أو المرتجع
   */
  static async adjustCustomerDebt(
    customerId: string, 
    amount: number, 
    operation: "add" | "subtract"
  ): Promise<Customer> {
    const customer = await db.customers.get(customerId);
    if (!customer) {
      throw new Error(`الزبون غير موجود: ${customerId}`);
    }

    let newDebt = customer.debt || 0;
    if (operation === "add") {
      newDebt += amount;
    } else {
      newDebt = Math.max(0, newDebt - amount);
    }

    await db.customers.update(customerId, { debt: newDebt });

    return {
      ...customer,
      debt: newDebt,
    };
  }
}
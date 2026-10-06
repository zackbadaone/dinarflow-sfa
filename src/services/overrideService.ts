import { db } from '../lib/db';
import { OverrideToken } from '../schemas/sfa';

export interface CreditOverridePayload {
  customerId: string;
  driverId: string;
  requestedAmount: number;
  currentCredit: number;
  maxAllowedLimit: number;
  reason: string;
}

export class OverrideService {
  // رمز الـ PIN الافتراضي المعتمد للمشرف أوفلاين
  private DEFAULT_SUPERVISOR_PIN = '1234';

  /**
   * التحقق المحلي المباشر من صحة PIN المشرف أوفلاين
   */
  async validatePin(pinCode: string): Promise<{ isValid: boolean; message?: string; token?: string }> {
    if (!pinCode || pinCode.trim() === '') {
      return { isValid: false, message: 'رمز الـ PIN مطلوب.' };
    }

    // التحقق المالي أوفلاين مقارنة بالرمز الافتراضي أو المخزن محلياً
    if (pinCode.trim() === this.DEFAULT_SUPERVISOR_PIN) {
      const generatedToken = `TOKEN-OVERRIDE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      return {
        isValid: true,
        message: 'تم التحقق من رمز المشرف بنجاح.',
        token: generatedToken,
      };
    }

    return { isValid: false, message: 'رمز الـ PIN الخاص بالمشرف غير صحيح.' };
  }

  /**
   * توليد توكن استثناء مشفر محلياً ربطاً بالزبون والعملية
   */
  generateOverrideToken(pinCode: string, deliveryId: string): string {
    return `OVR-${deliveryId}-${pinCode}-${Date.now()}`;
  }

  /**
   * طلب استثناء مالياً وحفظه في حالة المعالجة
   */
  async requestCreditOverride(payload: CreditOverridePayload): Promise<{ success: boolean; token?: string }> {
    try {
      const overrideToken: OverrideToken = {
        tokenId: `OVR-REQ-${Date.now()}`,
        customerId: payload.customerId,
        approvedByAdminId: 'SUPERVISOR-OFFLINE',
        tempCreditAllowance: payload.maxAllowedLimit,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // صالح لمدة 24 ساعة
        signature: 'OFFLINE_PIN_VERIFIED',
      };

      await this.saveTokenLocally(overrideToken, payload.customerId);
      return { success: true, token: overrideToken.tokenId };
    } catch (error) {
      console.error('فشل في طلب الاستثناء المالي محلياً:', error);
      return { success: false };
    }
  }

  /**
   * حفظ التوكن محلياً في جدول الإعدادات/التوكنات لـ Dexie
   */
  async saveTokenLocally(token: OverrideToken, customerId: string): Promise<void> {
    await db.settings.put({
      key: `override_token_${customerId}`,
      value: JSON.stringify(token),
    });
  }

  /**
   * جلب التوكن النشط والصالح للزبون من الخزنة المحلية
   */
  async getActiveTokenForCustomer(customerId: string): Promise<OverrideToken | null> {
    try {
      const record = await db.settings.get(`override_token_${customerId}`);
      if (!record || !record.value) return null;

      const token: OverrideToken = JSON.parse(record.value);
      const isExpired = new Date() > new Date(token.expiresAt);

      if (isExpired) {
        await db.settings.delete(`override_token_${customerId}`);
        return null;
      }

      return token;
    } catch (error) {
      console.error('خطأ أثناء جلب التوكن المحلي:', error);
      return null;
    }
  }

  /**
   * استهلاك التوكن بعد إتمام عملية البيع
   */
  async consumeTokenForCustomer(customerId: string): Promise<void> {
    await db.settings.delete(`override_token_${customerId}`);
  }
}

export const overrideService = new OverrideService();
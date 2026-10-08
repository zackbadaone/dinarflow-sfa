import { db } from '../lib/db';
import { apiClient } from './apiClient';

export interface User {
  id: number;
  name: string;
  email: string;
  // حقل الصلاحية للتمييز بين المندوب والمشرف والمدير
  role?: 'admin' | 'supervisor' | 'driver' | string; 
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export const authService = {
  /**
   * تسجيل دخول البائع مع السيرفر وتخزين التوكين وبيانات الجلسة محلياً
   */
  async loginUser(email: string, password: string): Promise<LoginResponse> {
    try {
      // استخدام apiClient الموحد لضمان الترويسات الصحيحة وعناوين البيئة
      const data = await apiClient.post<LoginResponse>('/login', { email, password });

      if (data.success && data.token && data.user) {
        // تخزين التوكين والمستخدم في قاعدة البيانات المحلية IndexedDB
        await db.settings.put({
          key: 'auth_token',
          value: data.token,
        });
        await db.settings.put({
          key: 'auth_user',
          value: data.user,
        });
      }

      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'تعذر الاتصال بالسيرفر. يرجى التحقق من توفر الشبكة.',
      };
    }
  },

  /**
   * جلب التوكين وبيانات الجلسة المخزنة أوفلاين
   */
  async getStoredAuth(): Promise<{ token: string | null; user: User | null }> {
    try {
      const tokenRecord = await db.settings.get('auth_token');
      const userRecord = await db.settings.get('auth_user');

      return {
        token: tokenRecord ? (tokenRecord.value as string) : null,
        user: userRecord ? (userRecord.value as User) : null,
      };
    } catch (error) {
      console.error('Error fetching stored auth:', error);
      return { token: null, user: null };
    }
  },

  /**
   * جلب صلاحية المستخدم الحالي بسرعة
   */
  async getCurrentUserRole(): Promise<string | null> {
    const { user } = await this.getStoredAuth();
    return user?.role || null;
  },

  /**
   * التحقق مما إذا كان المستخدم يملك صلاحية الموافقة على تجاوز سقف الدين
   */
  async canApproveOverride(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'admin' || role === 'supervisor';
  },

  /**
   * تسجيل الخروج ومسح الجلسة أوفلاين وأونلاين
   */
  async logout(): Promise<void> {
    try {
      const auth = await this.getStoredAuth();
      if (auth.token) {
        await apiClient.post('/logout');
      }
    } catch (error) {
      console.warn('Network logout failed, clearing local session anyway');
    } finally {
      await db.settings.delete('auth_token');
      await db.settings.delete('auth_user');
    }
  }
};
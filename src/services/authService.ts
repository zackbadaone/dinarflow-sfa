import { db } from '../lib/db';

export interface User {
  id: number;
  name: string;
  email: string;
  // أضفنا حقل الصلاحية هنا للتمييز بين المندوب والمشرف والمدير
  role?: 'admin' | 'supervisor' | 'driver' | string; 
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

// قمنا بحل مشكلة TypeScript عبر تحويل import.meta إلى any مؤقتاً لإسكات الخطأ بأمان
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const authService = {
  async loginUser(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.token && data.user) {
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
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'تعذر الاتصال بالسيرفر. يرجى التحقق من توفر الشبكة.',
      };
    }
  },

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

  // -------- الإضافات الجديدة الخاصة بالصلاحيات (Roles) --------

  // دالة لجلب صلاحية المستخدم الحالي بسرعة
  async getCurrentUserRole(): Promise<string | null> {
    const { user } = await this.getStoredAuth();
    return user?.role || null;
  },

  // دالة للتحقق هل المستخدم الحالي يمتلك صلاحية الموافقة على تجاوز الدين؟
  async canApproveOverride(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    // المشرف والمدير فقط هما من يحق لهما الموافقة
    return role === 'admin' || role === 'supervisor';
  },

  // -------------------------------------------------------------

  async logout(): Promise<void> {
    try {
      const auth = await this.getStoredAuth();
      if (auth.token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Accept': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('Network logout failed, clearing local session anyway');
    } finally {
      await db.settings.delete('auth_token');
      await db.settings.delete('auth_user');
    }
  }
};
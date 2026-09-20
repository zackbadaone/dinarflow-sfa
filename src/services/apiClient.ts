import { db } from '../lib/db';

// تحديد المسار الأساسي لشبكة API من متغيرات البيئة أو المسار الافتراضي
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * جلب توكين الأمان الخاص بـ Sanctum أوفلاين من قاعدة بيانات Dexie
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const tokenSetting = await db.settings.get('auth_token');
    return tokenSetting?.value || null;
  } catch (error) {
    console.error('فشل جلب توكين الأمان من IndexedDB:', error);
    return null;
  }
}

/**
 * محرك الاتصال الموحد (API Gateway Client)
 * يضمن إرفاق التوكين والترويسات الأساسية لجميع طلبات Laravel Sanctum
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getAuthToken();

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);

    // التعامل مع الجلسات المنتهية
    if (response.status === 401) {
      console.warn('الجلسة منتهية أو غير مصرح بها (401). مسح التوكين المحترق محلياً...');
      await db.settings.delete('auth_token');
      await db.settings.delete('auth_user');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `خطأ سيرفر: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    console.error(`[API Client Error] [${options.method || 'GET'}] ${url}:`, error.message);
    throw error;
  }
}

// الدوال المساعدة للاتصال السريع
apiClient.get = <T = any>(endpoint: string, options?: RequestOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
  apiClient<T>(endpoint, { 
    ...options, 
    method: 'POST', 
    body: data ? JSON.stringify(data) : undefined 
  });

apiClient.put = <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
  apiClient<T>(endpoint, { 
    ...options, 
    method: 'PUT', 
    body: data ? JSON.stringify(data) : undefined 
  });

apiClient.delete = <T = any>(endpoint: string, options?: RequestOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
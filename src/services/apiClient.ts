/// <reference types="vite/client" />
import { db } from '../lib/db';
import { envConfig, EnvironmentService } from '../config/environment';

// جلب المسار الأساسي لشبكة API من خدمة البيئة الموحدة
const getBaseUrl = (): string => EnvironmentService.getApiUrl();

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  timeout?: number; // المهلة الزمنية بالملي ثانية (افتراضياً 15 ثانية)
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
 * يضمن إرفاق التوكين والترويسات الأساسية لجميع طلبات Laravel Sanctum مع حماية الشبكة الميدانية
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getAuthToken();
  const { timeout = 15000, ...fetchOptions } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
  };

  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (envConfig.enableDebugLogs) {
    console.log(`📡 [API Client] [${options.method || 'GET'}] ${url}`);
  }

  // إعداد مؤقت لإلغاء الطلب في حالة ضعف شبكة المندوب الميدانية
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(id);

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
    clearTimeout(id);
    if (error.name === 'AbortError') {
      console.error(`[API Client Timeout] انقطعت المهلة الزمنية للاتصال (${timeout}ms): ${url}`);
      throw new Error('تعذر الاتصال بالسيرفر بسبب ضعف الشبكة الميدانية، حاول مجدداً.');
    }
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
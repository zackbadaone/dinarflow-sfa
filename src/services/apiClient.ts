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
 * ---------------------------------------------------------------------------
 * محولات التسمية التلقائية بين الفرونت أند (camelCase) والباك أند (snake_case)
 * لمنع أخطاء قواعد البيانات والتنافر بين JavaScript و Laravel PostgreSQL
 * ---------------------------------------------------------------------------
 */
const toSnakeCase = (str: string): string => 
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const toCamelCase = (str: string): string => 
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

function transformKeys(obj: any, transformFn: (key: string) => string): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, transformFn));
  return Object.keys(obj).reduce((acc, key) => {
    const transformedKey = transformFn(key);
    acc[transformedKey] = transformKeys(obj[key], transformFn);
    return acc;
  }, {} as Record<string, any>);
}

const objectToSnakeCase = (obj: any) => transformKeys(obj, toSnakeCase);
const objectToCamelCase = (obj: any) => transformKeys(obj, toCamelCase);

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

    const rawData = await response.json();
    // تحويل الاستجابة القادمة من الباك أند (snake_case) إلى (camelCase) للفرونت أند
    return objectToCamelCase(rawData) as T;
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

// الدوال المساعدة للاتصال السريع مع تحويل البيانات المرسلة إلى snake_case تلقائياً
apiClient.get = <T = any>(endpoint: string, options?: RequestOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = any>(endpoint: string, data?: any, options?: RequestOptions) => {
  const transformedData = data ? objectToSnakeCase(data) : undefined;
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'POST', 
    body: transformedData ? JSON.stringify(transformedData) : undefined 
  });
};

apiClient.put = <T = any>(endpoint: string, data?: any, options?: RequestOptions) => {
  const transformedData = data ? objectToSnakeCase(data) : undefined;
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'PUT', 
    body: transformedData ? JSON.stringify(transformedData) : undefined 
  });
};

apiClient.delete = <T = any>(endpoint: string, options?: RequestOptions) => 
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
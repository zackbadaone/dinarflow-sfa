/**
 * DinarFlow SFA - Production Environment & PWA Config
 * إدارة إعدادات البيئة والتثبيت الميداني للتطبيق (PWA Rollout)
 */

export interface EnvironmentConfig {
  env: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  appVersion: string;
  pwaAutoInstall: boolean;
  syncIntervalMs: number;
  maxOfflineDays: number;
  enableDebugLogs: boolean;
}

const getEnvVar = (key: string, fallback: string): string => {
  // تم استخدام (as any) لإخبار TypeScript بتجاهل التدقيق على هذه الميزة الخاصة بـ Vite
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    return (meta.env[key] as string) || fallback;
  }
  return fallback;
};

export const envConfig: EnvironmentConfig = {
  env: (getEnvVar('VITE_APP_ENV', 'development') as EnvironmentConfig['env']),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/api'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0-sfa'),
  pwaAutoInstall: getEnvVar('VITE_PWA_AUTO_INSTALL', 'true') === 'true',
  syncIntervalMs: parseInt(getEnvVar('VITE_SYNC_INTERVAL_MS', '300000'), 10), // 5 دقائق
  maxOfflineDays: parseInt(getEnvVar('VITE_MAX_OFFLINE_DAYS', '7'), 10),
  enableDebugLogs: getEnvVar('VITE_DEBUG_LOGS', 'true') === 'true',
};

export class EnvironmentService {
  /**
   * التحقق مما إذا كان التطبيق يعمل في بيئة الإنتاج الفعلي
   */
  static isProduction(): boolean {
    return envConfig.env === 'production';
  }

  /**
   * التحقق مما إذا كان التطبيق مثبت كـ PWA على هاتف المندوب
   */
  static isPwaInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isNavStandalone = (window.navigator as any).standalone === true;

    return isStandalone || isNavStandalone;
  }

  /**
   * جلب العنوان الرئيسي للسيرفر السحابي
   */
  static getApiUrl(): string {
    return envConfig.apiBaseUrl;
  }

  /**
   * طباعة تقرير بيئة التشغيل للتدقيق
   */
  static logEnvironmentStatus(): void {
    console.log(`🚀 [DinarFlow SFA] البيئة الحالية: ${envConfig.env.toUpperCase()}`);
    console.log(`📱 [DinarFlow SFA] PWA مثبّت: ${this.isPwaInstalled() ? 'نعم ✅' : 'لا ❌'}`);
    console.log(`🌐 [DinarFlow SFA] رابط السيرفر: ${envConfig.apiBaseUrl}`);
    console.log(`📦 [DinarFlow SFA] الإصدار: ${envConfig.appVersion}`);
  }
}

export default envConfig;
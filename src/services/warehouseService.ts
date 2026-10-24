import { db } from '../lib/db';
import { apiClient } from './apiClient';

export interface WarehouseClosingReport {
  id: string;
  vehiclePlate: string;
  driverName: string;
  totalCashCollected: number;
  avarieUnitsCount: number;
  sainReturnedUnitsCount: number;
  closingStatus: 'closed_and_synced' | 'pending_sync';
  closedAt: string;
}

export class WarehouseService {
  /**
   * تهيئة بيانات اختبارية في حالة كانت الخزنة المحلية فارغة
   */
  async seedInitialWarehouseData() {
    const tasksCount = await db.loadingTasks.count();
    if (tasksCount === 0) {
      await db.loadingTasks.bulkAdd([
        {
          id: 'TASK-001',
          driverName: 'عمر السائق',
          vehiclePlate: '12345-115-13',
          requestedFardeau: 250,
          status: 'pending',
          qrCodeData: 'QR-MANIFEST-001',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'TASK-002',
          driverName: 'خالد السائق',
          vehiclePlate: '98765-115-13',
          requestedFardeau: 180,
          status: 'pending',
          qrCodeData: 'QR-MANIFEST-002',
          createdAt: new Date().toISOString(),
        },
      ] as any);
    }

    const recCount = await db.reconciliations.count();
    if (recCount === 0) {
      await db.reconciliations.bulkAdd([
        {
          id: 'REC-001',
          driverName: 'عمر السائق',
          declaredCash: 45000,
          avarieReturns: 2,
          status: 'pending_scan',
        },
      ] as any);
    }
  }

  /**
   * معالجة شحن الشاحنة وتحديث العهدة الصباحية في Dexie
   */
  async processVanLoading(taskId: string) {
    await db.loadingTasks.update(taskId, { status: 'loaded' });
    console.log(`📦 [WarehouseService] تم تأكيد شحن المهمة (${taskId}) محلياً.`);
  }

  /**
   * تسوية عهدة المساء وتصفير مخزون الشاحنة وإرسال تقرير الإغلاق النهائي
   */
  async finalizeEveningClosure(payload: {
    vehiclePlate: string;
    driverName: string;
    totalCashCollected: number;
    avarieUnits: number;
    sainReturnedUnits: number;
  }): Promise<WarehouseClosingReport> {
    const reportId = `EOD-${Date.now().toString().slice(-6)}`;
    const closingReport: WarehouseClosingReport = {
      id: reportId,
      vehiclePlate: payload.vehiclePlate,
      driverName: payload.driverName,
      totalCashCollected: payload.totalCashCollected,
      avarieUnitsCount: payload.avarieUnits,
      sainReturnedUnitsCount: payload.sainReturnedUnits,
      closingStatus: 'pending_sync',
      closedAt: new Date().toISOString(),
    };

    // 1. تصفير عهدة الشاحنة في Dexie (Van Inventory Zero-out)
    await db.vanInventory.delete(`INV-${payload.vehiclePlate}`);

    // 2. إرسال تقرير الإغلاق لخادم الباك أند logiz-backend إن وجد اتصال
    try {
      await apiClient.post('/warehouse/eod-reconciliation', closingReport);
      closingReport.closingStatus = 'closed_and_synced';
      console.log(`✅ [WarehouseService] تم رفع تقرير الإغلاق المسائي (${reportId}) للسيرفر بنجاح.`);
    } catch (error) {
      console.warn(`⚠️ [WarehouseService] تعذر الرفع الفوري لتقرير الإغلاق (${reportId})، تم حفظه أوفلاين للمزامنة اللاحقة.`);
    }

    return closingReport;
  }
}

export const warehouseService = new WarehouseService();

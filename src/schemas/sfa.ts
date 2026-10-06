import { z } from "zod";

// 1. مخطط سجلات الحسابات والأدوار للممالك الخمس (SfaRecord)
export const SfaRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  role: z.enum(["admin", "supervisor", "vendor", "warehouse", "driver"]),
  status: z.enum(["active", "inactive"]).default("active"),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

// 2. مخطط المنتج ووحدات التعبئة الميدانية (Carton / Fardeau / Unit)
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "اسم المنتج مطلوب"),
  sku: z.string(),
  priceUnit: z.number().positive("السعر يجب أن يكون موجباً"),
  itemsPerFardeau: z.number().int().positive("عدد القطع في الربطة يجب أن يكون عدداً صحيحاً"),
  stockFardeau: z.number().min(0, "مخزون الربطات لا يمكن أن يكون سالباً"),
  category: z.string(),
});

// 3. مخطط الزبون وضبط المديونية المطابق لقاعدة بيانات LOGIZ-BACKEND (Store / Credit Guard)
export const CustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "اسم المحل مطلوب"),
  ar_name: z.string().optional().nullable(),
  owner_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  zone: z.string().optional().nullable(),
  debt: z.number().min(0).default(0),
  debt_age_days: z.number().int().min(0).default(0),
  credit_limit: z.number().min(0).default(50000),
  status: z.enum(["active", "blocked"]).default("active"),
});

// 4. مخطط توكين التجاوز الاستثنائي لـ 24 ساعة (Override Token)
export const OverrideTokenSchema = z.object({
  tokenId: z.string(),
  customerId: z.string().uuid(),
  approvedByAdminId: z.string(),
  tempCreditAllowance: z.number().positive(),
  expiresAt: z.string().datetime(),
  signature: z.string(),
});

// 5. مخطط طرق الدفع الرسمية للمحرك المالي (Payment Methods)
export const PaymentMethodSchema = z.enum(["cash", "credit", "mixed"]);

// 6. مخطط حالة الفاتورة (Invoice Status)
export const InvoiceStatusSchema = z.enum(["draft", "validated", "cancelled"]);

// 7. مخطط خط طلب المبيعات وتفكيك المرتجعات الميدانية (Avarie vs Sain)
export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().optional(),
  quantityFardeau: z.number().int().min(0),
  quantityUnit: z.number().int().min(0),
  unitPrice: z.number().positive(),
  totalPrice: z.number().min(0).default(0),
  returnedSainUnit: z.number().int().min(0).default(0),  // مرتجع سليم (يعود للمخزن)
  returnedAvarieUnit: z.number().int().min(0).default(0), // مرتجع تالف (يعزل عن المخزن)
});

// 8. مخطط بند الفاتورة المباشر (Invoice Item)
export const InvoiceItemSchema = OrderItemSchema;

// 9. مخطط بون التسليم النهائي والسيولة أوفلاين (Bon de Livraison / Delivery Receipt)
export const DeliveryReceiptSchema = z.object({
  id: z.string().uuid(),
  idempotencyKey: z.string().uuid().describe("مفتاح فريد لمنع تكرار تسجيل الفاتورة والخصم المالي في السيرفر عند إعادة الإرسال"),
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  driverId: z.string().uuid(),
  items: z.array(OrderItemSchema),
  subTotal: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  paymentMethod: PaymentMethodSchema.default("cash"),
  cashPaid: z.number().min(0).default(0),
  creditAdded: z.number().min(0).default(0),
  status: InvoiceStatusSchema.default("validated"),
  overrideTokenUsed: z.string().optional(),
  syncStatus: z.enum(["pending", "synced", "failed"]).default("pending"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional().or(z.string().optional()),
});

// 10. مخطط الفاتورة المالي الصريح (Invoice Schema - Alias for DeliveryReceipt)
export const InvoiceSchema = DeliveryReceiptSchema;

// 11. مخطط أمر شحن الشاحنة الصباحي (LoadingTask)
export const LoadingTaskSchema = z.object({
  id: z.string(),
  idempotencyKey: z.string().uuid().optional(),
  driverId: z.string(),
  driverName: z.string(),
  vehiclePlate: z.string(),
  requestedFardeau: z.number().int().min(0),
  status: z.enum(["pending", "loading_scan", "loaded"]).default("pending"),
  qrCodeData: z.string(),
  syncStatus: z.enum(["pending", "synced", "failed"]).default("pending"),
  createdAt: z.string(),
  loadedAt: z.string().optional().nullable(),
});

// 12. مخطط بند مخزون الشاحنة الميداني (VanInventoryItem)
export const VanInventoryItemSchema = z.object({
  productId: z.string(),
  quantityLoaded: z.number().int().min(0),
  quantityRemaining: z.number().int().min(0),
  quantitySold: z.number().int().min(0).default(0),
  quantityReturnedSain: z.number().int().min(0).default(0),
  quantityReturnedAvarie: z.number().int().min(0).default(0),
});

// 13. مخطط مخزون الشاحنة الميداني الشامل (VanInventory)
export const VanInventorySchema = z.object({
  id: z.string(),
  loadingTaskId: z.string(),
  driverId: z.string(),
  items: z.array(VanInventoryItemSchema),
  status: z.enum(["active", "closed"]).default("active"),
  updatedAt: z.string(),
});

// 14. مخطط جرد ومطابقة الشاحنة المسائية (Reconciliation)
export const ReconciliationSchema = z.object({
  id: z.string(),
  idempotencyKey: z.string().uuid().optional(),
  loadingTaskId: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  expectedCash: z.number().min(0),
  declaredCash: z.number().min(0),
  avarieReturns: z.number().int().min(0).default(0),
  sainReturns: z.number().int().min(0).default(0),
  status: z.enum(["pending_scan", "matched", "closed"]).default("pending_scan"),
  createdAt: z.string(),
  closedAt: z.string().optional().nullable(),
});

// الأنواع المعتمدة برمجياً (TypeScript Exports)
export type SfaRecord = z.infer<typeof SfaRecordSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type OverrideToken = z.infer<typeof OverrideTokenSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type DeliveryReceipt = z.infer<typeof DeliveryReceiptSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type LoadingTask = z.infer<typeof LoadingTaskSchema>;
export type VanInventoryItem = z.infer<typeof VanInventoryItemSchema>;
export type VanInventory = z.infer<typeof VanInventorySchema>;
export type Reconciliation = z.infer<typeof ReconciliationSchema>;
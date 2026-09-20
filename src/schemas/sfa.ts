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

// 5. مخطط خط طلب المبيعات وتفكيك المرتجعات الميدانية (Avarie vs Sain)
export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantityFardeau: z.number().int().min(0),
  quantityUnit: z.number().int().min(0),
  unitPrice: z.number().positive(),
  returnedSainUnit: z.number().int().min(0).default(0),  // مرتجع سليم (يعود للمخزن)
  returnedAvarieUnit: z.number().int().min(0).default(0), // مرتجع تالف (يعزل عن المخزن)
});

// 6. مخطط بون التسليم النهائي والسيولة أوفلاين (Bon de Livraison)
export const DeliveryReceiptSchema = z.object({
  id: z.string().uuid(),
  // تمت إضافة مفتاح عدم التكرار (Idempotency Key) لحماية العمليات المالية عند ضعف الإنترنت
  idempotencyKey: z.string().uuid().describe("مفتاح فريد لمنع تكرار تسجيل الفاتورة والخصم المالي في السيرفر عند إعادة الإرسال"),
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  driverId: z.string().uuid(),
  items: z.array(OrderItemSchema),
  totalAmount: z.number().min(0),
  cashPaid: z.number().min(0),
  creditAdded: z.number().min(0),
  overrideTokenUsed: z.string().optional(),
  syncStatus: z.enum(["pending", "synced", "failed"]).default("pending"),
  createdAt: z.string().datetime(),
});

// الأنواع المعتمدة برمجياً (TypeScript Exports)
export type SfaRecord = z.infer<typeof SfaRecordSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type OverrideToken = z.infer<typeof OverrideTokenSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type DeliveryReceipt = z.infer<typeof DeliveryReceiptSchema>;
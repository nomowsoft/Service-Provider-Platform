import { z } from "zod";

export const integrationRequestSchema = z.object({
  type: z.string().optional().default("connection"),
  apiCode: z.string({ message: "كود الربط لمزود الخدمة (apiCode) مطلوب" })
    .trim()
    .min(1, "كود الربط لمزود الخدمة (apiCode) مطلوب"),
  token: z.string({ message: "توكن الجمعية (token) مطلوب" })
    .trim()
    .min(1, "توكن الجمعية (token) مطلوب"),
  name: z.string({ message: "اسم الجمعية (name) مطلوب" })
    .trim()
    .min(1, "اسم الجمعية (name) مطلوب"),
  email: z.string({ message: "البريد الإلكتروني (email) مطلوب" })
    .trim()
    .min(1, "البريد الإلكتروني (email) مطلوب"),
  phone: z.string({ message: "رقم الهاتف (phone) مطلوب" })
    .trim()
    .min(1, "رقم الهاتف (phone) مطلوب"),
  domain: z.string({ message: "الدومين (domain) مطلوب" })
    .trim()
    .min(1, "الدومين (domain) مطلوب"),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
});


export const priceOfferSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.coerce.number({ message: "يرجى تحديد المنتج" }),
      price: z.coerce.number().positive({ message: "قيمة عرض السعر يجب أن تكون أكبر من 0" }),
      qty: z.coerce.number().positive({ message: "الكمية يجب أن تكون أكبر من 0" }).default(1),
      discount: z.coerce.number().min(0).optional().default(0),
    })
  ).min(1, "يجب إضافة منتج واحد على الأقل"),
  provider_note: z.string().optional(),
});

export const raisingClaimSchema = z.object({
  ref: z.string({ message: "رقم الفاتورة (المرجع) مطلوب" })
    .trim()
    .min(1, "رقم الفاتورة (المرجع) مطلوب"),
  invoice_date: z.string({ message: "تاريخ الفاتورة مطلوب" })
    .trim()
    .min(1, "تاريخ الفاتورة مطلوب")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الفاتورة يجب أن يكون بتنسيق YYYY-MM-DD"),
  invoice_lines: z.array(
    z.object({
      product_id: z.coerce.number({ message: "يرجى تحديد المنتج للبند" }),
      price_unit: z.coerce.number().positive({ message: "قيمة سعر البند يجب أن تكون أكبر من 0" }),
      quantity: z.coerce.number().int().positive({ message: "الكمية يجب أن تكون عدداً صحيحاً أكبر من 0" }).default(1),
    })
  ).min(1, "يجب إضافة بند واحد على الأقل في الفاتورة"),
  attachments: z.array(
    z.object({
      name: z.string({ message: "اسم الملف المرفق مطلوب" }).min(1, "اسم الملف المرفق مطلوب"),
      datas: z.string({ message: "محتوى الملف المرفق مطلوب" }).min(1, "محتوى الملف المرفق مطلوب"),
    })
  ).min(1, "يجب إرفاق ملف فاتورة/مستند مالي واحد على الأقل"),
});
export const updateClaimSchema = z.object({
  invoices: z.array(
    z.object({
      invoice_id: z.coerce.number({ message: "معرف الفاتورة مطلوب" }),
      ref: z.string({ message: "رقم الفاتورة (المرجع) مطلوب" })
        .trim()
        .min(1, "رقم الفاتورة (المرجع) مطلوب"),
      invoice_date: z.string({ message: "تاريخ الفاتورة مطلوب" })
        .trim()
        .min(1, "تاريخ الفاتورة مطلوب")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الفاتورة يجب أن يكون بتنسيق YYYY-MM-DD"),
      invoice_lines: z.array(
        z.object({
          product_id: z.coerce.number({ message: "يرجى تحديد المنتج للبند" }),
          price_unit: z.coerce.number().positive({ message: "قيمة سعر البند يجب أن تكون أكبر من 0" }),
          quantity: z.coerce.number().int().positive({ message: "الكمية يجب أن تكون عدداً صحيحاً أكبر من 0" }).default(1),
        })
      ).min(1, "يجب إضافة بند واحد على الأقل في الفاتورة"),
      attachments: z.array(
        z.object({
          attachment_id: z.coerce.number().optional(),
          name: z.string({ message: "اسم الملف المرفق مطلوب" }).min(1, "اسم الملف المرفق مطلوب"),
          datas: z.string().optional().default(""),
        })
      ).min(1, "يجب إرفاق ملف فاتورة/مستند مالي واحد على الأقل"),
    })
  ).min(1, "يجب تحديد فاتورة واحدة على الأقل للتحديث"),
});


export const passwordSchema = z
  .string()
  .min(1, { message: "يرجى إدخال كلمة المرور" })
  .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
  .regex(/[a-z]/, { message: "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل" })
  .regex(/[A-Z]/, { message: "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل" })
  .regex(/\d/, { message: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل" })
  .regex(/[^A-Za-z0-9]/, { message: "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (مثل @$!%*?&)" });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "يرجى إدخال كلمة المرور الحالية" }),
  newPassword: z.string().min(1, { message: "يرجى إدخال كلمة المرور الجديدة" }).pipe(passwordSchema),
  confirmPassword: z.string().min(1, { message: "يرجى تأكيد كلمة المرور الجديدة" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقتين",
  path: ["confirmPassword"],
});

export const registerSchema = z.object({
  entityName: z
    .string()
    .min(1, { message: "يرجى إدخال اسم المنشأة الطبية/الخدمية" })
    .min(3, { message: "اسم المنشأة يجب أن يكون 3 أحرف على الأقل" }),
  email: z
    .string()
    .min(1, { message: "يرجى إدخال البريد الإلكتروني" })
    .email({ message: "البريد الإلكتروني غير صحيح" }),
  name: z
    .string()
    .min(1, { message: "يرجى إدخال الاسم الكامل للممثل" })
    .min(3, { message: "الاسم الكامل للممثل يجب أن يكون 3 أحرف على الأقل" }),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine(
      (val) => !val || /^(05\d{8})$/.test(val),
      { message: "رقم الهاتف غير صحيح، يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" }
    ),
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: "يرجى تأكيد كلمة المرور" }),
  role: z.enum(["SERVICE_PROVIDER"]).default("SERVICE_PROVIDER"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيدها غير متطابقتين",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "يرجى إدخال البريد الإلكتروني" })
    .email({ message: "البريد الإلكتروني غير صحيح" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "رمز إعاده التعيين (Token) مفقود" }),
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: "يرجى تأكيد كلمة المرور" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيدها غير متطابقتين",
  path: ["confirmPassword"],
});

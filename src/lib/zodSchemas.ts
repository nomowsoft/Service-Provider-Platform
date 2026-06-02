import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
});

export const serviceRequestSchema = z.object({
  beneficiaryName: z.string().min(3, { message: "اسم المستفيد يجب أن يكون 3 أحرف على الأقل" }),
  beneficiaryNationalId: z
    .string()
    .length(10, { message: "رقم الهوية الوطنية يجب أن يتكون من 10 أرقام" })
    .regex(/^\d+$/, { message: "رقم الهوية الوطنية يجب أن يحتوي على أرقام فقط" }),
  description: z.string().min(5, { message: "الوصف يجب أن يكون 5 أحرف على الأقل" }),
  charityContributionPercentage: z.coerce
    .number()
    .min(0, { message: "نسبة مساهمة الجمعية لا يمكن أن تقل عن 0%" })
    .max(100, { message: "نسبة مساهمة الجمعية لا يمكن أن تزيد عن 100%" })
    .default(100),
  beneficiaryContributionValue: z.coerce
    .number()
    .min(0, { message: "قيمة مساهمة المستفيد لا يمكن أن تقل عن 0" })
    .default(0),
});

export const priceOfferSchema = z.object({
  amountTotal: z.coerce.number().positive({ message: "قيمة عرض السعر يجب أن تكون أكبر من 0" }),
  notes: z.string().optional(),
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
  password: z
    .string()
    .min(1, { message: "يرجى إدخال كلمة المرور" })
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
    .regex(/[a-z]/, { message: "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل" })
    .regex(/[A-Z]/, { message: "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل" })
    .regex(/\d/, { message: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل" })
    .regex(/[^A-Za-z0-9]/, { message: "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (مثل @$!%*?&)" }),
  confirmPassword: z.string().min(1, { message: "يرجى تأكيد كلمة المرور" }),
  role: z.enum(["SERVICE_PROVIDER", "CHARITY_STAFF"]).default("SERVICE_PROVIDER"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيدها غير متطابقتين",
  path: ["confirmPassword"],
});

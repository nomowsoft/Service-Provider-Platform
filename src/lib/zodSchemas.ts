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

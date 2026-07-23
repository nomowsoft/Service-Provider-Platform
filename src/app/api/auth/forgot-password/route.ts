import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { forgotPasswordSchema } from "@/utils/validation";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate inputs with Zod
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "البريد الإلكتروني غير مسجل لدينا، يرجى التأكد من البريد المدخل" },
        { status: 400 }
      );
    }

    // 2. Generate secure reset token & 1-hour expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    // 3. Save reset token to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // 4. Construct reset URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;

    // 5. Send email via Nodemailer
    await sendPasswordResetEmail({
      toEmail: user.email,
      userName: user.name,
      resetUrl,
    });

    return NextResponse.json(
      { message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء إرسال رابط إعادة التعيين" },
      { status: 500 }
    );
  }
}

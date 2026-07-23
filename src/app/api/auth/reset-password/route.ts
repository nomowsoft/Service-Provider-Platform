import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";
import { resetPasswordSchema } from "@/utils/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate inputs with Zod
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // 1. Find user by resetToken
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
      include: { provider: true },
    });

    if (!user || !user.resetTokenExpiry) {
      return NextResponse.json(
        { message: "رابط إعادة تعيين كلمة المرور غير صالح أو سبق استخدامه" },
        { status: 400 }
      );
    }

    // 2. Check if token has expired
    if (new Date() > new Date(user.resetTokenExpiry)) {
      return NextResponse.json(
        { message: "انتهت صلاحية رابط إعادة تعيين كلمة المرور، يرجى طلب رابط جديد" },
        { status: 400 }
      );
    }

    // 3. Hash new password
    const passwordHash = await bcrypt.hash(password, 14);

    // 4. Update user password and clear resetToken
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // 5. Auto-login user: create and set session cookie
    const payload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      providerId: updatedUser.providerId,
    };

    const sessionToken = await signSession(payload);
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        provider: user.provider,
      },
      token: sessionToken,
      message: "تم تحديث كلمة المرور وتسجيل الدخول بنجاح!",
    }, { status: 200 });
  } catch (error) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء تحديث كلمة المرور" },
      { status: 500 }
    );
  }
}

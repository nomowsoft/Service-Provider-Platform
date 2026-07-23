import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { passwordSchema } from "@/utils/validation";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        provider: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    let provider = user.provider;
    if (user.role === "SERVICE_PROVIDER" && provider) {
      if (!provider.apiCode) {
        const apiCode = `code_${crypto.randomBytes(24).toString("hex")}`;
        provider = await prisma.serviceProvider.update({
          where: { id: provider.id },
          data: { apiCode },
        });
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: provider,
      },
      message: "تم تسجيل الدخول بنجاح",
    }, { status: 200 });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "الاسم مطلوب" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
      message: "تم تحديث البيانات بنجاح",
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث البيانات" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { message: "يرجى إدخال كلمة المرور الحالية" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    // 1. Verify current password correctness FIRST
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    // 2. ONLY THEN check new password and validate its strength
    if (!newPassword) {
      return NextResponse.json(
        { message: "يرجى إدخال كلمة المرور الجديدة" },
        { status: 400 }
      );
    }

    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      return NextResponse.json(
        { message: passwordValidation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Hash new password & update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "تم تغيير كلمة المرور بنجاح",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تغيير كلمة المرور" },
      { status: 500 }
    );
  }
}

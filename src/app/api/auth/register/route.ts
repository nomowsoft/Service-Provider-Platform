import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/utils/validation";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate inputs with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role, entityName, phone } = validation.data;

    // Reject registration if role is not SERVICE_PROVIDER
    // if (role !== "SERVICE_PROVIDER") {
    //   return NextResponse.json(
    //     { message: "غير مسموح بإنشاء هذا النوع من الحسابات حالياً" },
    //     { status: 400 }
    //   );
    // }

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "البريد الإلكتروني مسجل بالفعل لمستخدم آخر" },
        { status: 400 }
      );
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 14);

    // 3. Create provider and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find all service providers starting with SP- to calculate the next sequence number
      const providers = await tx.serviceProvider.findMany({
        where: {
          code: {
            startsWith: "SP-",
          },
        },
        select: { code: true },
      });

      let maxNum = 0;
      for (const p of providers) {
        const suffix = p.code.substring(3);
        if (suffix.length === 5) {
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      const nextCode = `SP-${String(maxNum + 1).padStart(5, "0")}`;

      const createdProvider = await tx.serviceProvider.create({
        data: {
          name: entityName,
          code: nextCode,
          email: email,
          phone: phone || null,
          apiCode: `code_${crypto.randomBytes(24).toString("hex")}`,
        },
      });

      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: "SERVICE_PROVIDER",
          providerId: createdProvider.id,
        },
      });

      return { user: createdUser, provider: createdProvider };
    });

    // 4. Sign session
    const payload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      providerId: result.user.providerId,
    };

    const token = await signSession(payload);

    // 5. Set session cookie
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        provider: result.provider,
      },
      token,
      message:"تم تسجيل الحساب بنجاح"
    }, { status: 200 });
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء تسجيل الحساب" },
      { status: 500 }
    );
  }
}

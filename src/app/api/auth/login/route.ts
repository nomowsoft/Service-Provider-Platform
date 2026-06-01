import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/zodSchemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate inputs with Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        charity: true,
        provider: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // Sign session
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      charityId: user.charityId,
      providerId: user.providerId,
    };

    const token = await signSession(payload);
    
    // Set cookie
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        charity: user.charity,
        provider: user.provider,
      },
      token,
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}

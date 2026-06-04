import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        charity: true,
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
        charity: user.charity,
        provider: provider,
      },
    });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

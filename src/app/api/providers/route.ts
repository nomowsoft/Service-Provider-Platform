import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    // Only SUPER_ADMIN can view the list of providers
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const providers = await prisma.serviceProvider.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Fetch Providers API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل مزودي الخدمة" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    // Only SUPER_ADMIN can create providers
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, code, apiCode } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { message: "اسم مزود الخدمة مطلوب" },
        { status: 400 }
      );
    }

    // Create provider in a transaction to safely compute the next code
    const provider = await prisma.$transaction(async (tx) => {
      let finalCode = code;
      if (!finalCode) {
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
        finalCode = `SP-${String(maxNum + 1).padStart(5, "0")}`;
      } else {
        // Validate uniqueness of custom code
        const existing = await tx.serviceProvider.findUnique({
          where: { code: finalCode },
        });
        if (existing) {
          throw new Error("كود مزود الخدمة مستخدم بالفعل");
        }
      }

      let finalApiCode = apiCode;
      if (!finalApiCode) {
        finalApiCode = `code_${crypto.randomBytes(24).toString("hex")}`;
      } else {
        // Validate uniqueness of custom apiCode
        const existing = await tx.serviceProvider.findUnique({
          where: { apiCode: finalApiCode },
        });
        if (existing) {
          throw new Error("كود الربط (apiCode) مستخدم بالفعل");
        }
      }

      return await tx.serviceProvider.create({
        data: {
          name: name.trim(),
          code: finalCode,
          email: email || null,
          phone: phone || null,
          apiCode: finalApiCode,
        },
      });
    });

    return NextResponse.json({ provider, message: "تم إنشاء مزود الخدمة بنجاح" });
  } catch (error: any) {
    console.error("Create Provider API Error:", error);
    return NextResponse.json(
      { message: error.message || "حدث خطأ أثناء إنشاء مزود الخدمة" },
      { status: 500 }
    );
  }
}

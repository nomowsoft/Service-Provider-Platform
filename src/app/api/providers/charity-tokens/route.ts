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

    if (session.role !== "SERVICE_PROVIDER" || !session.providerId) {
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const charities = await prisma.charity.findMany({
      where: { providerId: session.providerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ charities });
  } catch (error) {
    console.error("Fetch Provider Charities Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل الجمعيات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    if (session.role !== "SERVICE_PROVIDER" || !session.providerId) {
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "يرجى إدخال اسم الجمعية" }, { status: 400 });
    }

    // Generate unique cryptographically secure token
    let token = "";
    let isTokenUnique = false;
    while (!isTokenUnique) {
      token = `tok_${crypto.randomBytes(24).toString("hex")}`;
      const existingToken = await prisma.charity.findUnique({
        where: { token },
      });
      if (!existingToken) {
        isTokenUnique = true;
      }
    }

    // Generate unique sequential code
    let code = "";
    let isUnique = false;
    let count = await prisma.charity.count();
    while (!isUnique) {
      code = `CH${String(count + 1).padStart(3, "0")}`;
      const existingCode = await prisma.charity.findUnique({ where: { code } });
      if (!existingCode) {
        isUnique = true;
      } else {
        count++;
      }
    }

    // Create the charity
    const charity = await prisma.charity.create({
      data: {
        name: name.trim(),
        code,
        token,
        providerId: session.providerId,
      },
    });

    return NextResponse.json({ charity, message: "تم إضافة الجمعية بنجاح" });
  } catch (error) {
    console.error("Create Provider Charity Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة الجمعية" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
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

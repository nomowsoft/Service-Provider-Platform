import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "غير مصرح، هذه الصفحة مخصصة لمدير النظام فقط" },
        { status: 403 }
      );
    }

    let logs: any[] = [];
    const logModel = (prisma as any).emailLog;

    if (logModel) {
      logs = await logModel.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } else {
      try {
        logs = await prisma.$queryRawUnsafe(
          `SELECT * FROM "EmailLog" ORDER BY "createdAt" DESC LIMIT 100`
        );
      } catch (err) {
        console.warn("Prisma raw query fallback for EmailLog:", err);
      }
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET Email Logs Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب سجلات البريد الإلكتروني" },
      { status: 500 }
    );
  }
}

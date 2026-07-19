import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    if (session.role !== "SERVICE_PROVIDER" || !session.providerId) {
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const { id } = await params;
    const charityId = parseInt(id, 10);

    if (isNaN(charityId)) {
      return NextResponse.json({ message: "معرف جمعية غير صحيح" }, { status: 400 });
    }

    const charity = await prisma.charity.findUnique({
      where: { id: charityId },
      select: {
        id: true,
        status: true,
        providerId: true,
      },
    });

    if (!charity) {
      return NextResponse.json({ message: "الجمعية غير موجودة" }, { status: 404 });
    }

    if (charity.providerId !== session.providerId) {
      return NextResponse.json(
        { message: "غير مصرح لك بإدارة هذه الجمعية" },
        { status: 403 }
      );
    }

    if (charity.status !== "UPDATING") {
      return NextResponse.json(
        { message: "لا يوجد طلب تحديث بيانات معلق لهذه الجمعية" },
        { status: 400 }
      );
    }

    await prisma.charity.update({
      where: { id: charity.id },
      data: {
        status: "CONNECTED",
        pendingName: null,
        pendingEmail: null,
        pendingPhone: null,
        pendingDomain: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم رفض طلب تحديث البيانات",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء معالجة الرفض" },
      { status: 500 }
    );
  }
}

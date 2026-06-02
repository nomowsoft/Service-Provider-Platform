import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(
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
      return NextResponse.json({ message: "معرف غير صحيح" }, { status: 400 });
    }

    // Verify charity exists and belongs to this service provider
    const charity = await prisma.charity.findUnique({
      where: { id: charityId },
    });

    if (!charity) {
      return NextResponse.json({ message: "الجمعية غير موجودة" }, { status: 404 });
    }

    if (charity.providerId !== session.providerId) {
      return NextResponse.json(
        { message: "غير مصرح لك بحذف هذه الجمعية" },
        { status: 403 }
      );
    }

    await prisma.charity.delete({
      where: { id: charityId },
    });

    return NextResponse.json({ message: "تم حذف الجمعية بنجاح" });
  } catch (error) {
    console.error("Delete Provider Charity Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف الجمعية" },
      { status: 500 }
    );
  }
}

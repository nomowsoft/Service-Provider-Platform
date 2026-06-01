import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { priceOfferSchema } from "@/lib/zodSchemas";

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
      return NextResponse.json(
        { message: "يجب أن تكون مزود خدمة لتقديم عرض سعر" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    // Check request status
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!serviceRequest) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    if (serviceRequest.status !== "RFQ") {
      return NextResponse.json(
        { message: "لا يمكن تقديم عرض سعر لطلب ليس في مرحلة طلب عروض الأسعار" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = priceOfferSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amountTotal: price, notes } = validation.data;

    // Check if an offer already exists from this provider
    const existingOffer = await prisma.priceOffer.findFirst({
      where: {
        requestId,
        providerId: session.providerId,
      },
    });

    let offer;
    if (existingOffer) {
      // Update existing offer
      offer = await prisma.priceOffer.update({
        where: { id: existingOffer.id },
        data: {
          amountTotal: price,
          notes,
          status: "PENDING",
        },
      });
    } else {
      // Create new offer
      offer = await prisma.priceOffer.create({
        data: {
          requestId,
          providerId: session.providerId,
          amountTotal: price,
          notes,
          status: "PENDING",
        },
      });
    }


    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("Create Offer API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تقديم عرض السعر" },
      { status: 500 }
    );
  }
}

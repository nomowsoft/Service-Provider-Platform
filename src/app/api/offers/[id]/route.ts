import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const offerId = parseInt(id);
    if (isNaN(offerId)) {
      return NextResponse.json({ message: "معرف عرض السعر غير صالح" }, { status: 400 });
    }

    const { action } = await request.json(); // "approve" or "reject"
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ message: "الإجراء المطلوب غير صالح" }, { status: 400 });
    }

    // Fetch the price offer
    const offer = await prisma.priceOffer.findUnique({
      where: { id: offerId },
      include: {
        request: true,
        provider: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ message: "عرض السعر غير موجود" }, { status: 404 });
    }

    const { role, charityId } = session;

    // Verify permission: Only charity staff of the request's charity or super admins can approve/reject offers
    if (role !== "CHARITY_STAFF" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "لا تملك الصلاحية لإدارة عروض الأسعار" }, { status: 403 });
    }

    if (role === "CHARITY_STAFF" && offer.request.charityId !== charityId) {
      return NextResponse.json({ message: "لا تملك الصلاحية للتحكم بطلبات هذه الجمعية" }, { status: 403 });
    }

    if (offer.request.status !== "RFQ") {
      return NextResponse.json({ message: "لا يمكن تعديل عروض الأسعار لطلب ليس في مرحلة عروض الأسعار" }, { status: 400 });
    }

    if (action === "approve") {
      // Transaction to approve offer, reject others, and update request
      const updatedOffer = await prisma.$transaction(async (tx) => {
        // 1. Approve this offer
        const appOffer = await tx.priceOffer.update({
          where: { id: offerId },
          data: { status: "APPROVED" },
        });

        // 2. Reject all other offers for this request
        await tx.priceOffer.updateMany({
          where: {
            requestId: offer.requestId,
            id: { not: offerId },
          },
          data: { status: "REJECTED" },
        });

        // 3. Update the Service Request
        const cost = offer.amountTotal;
        const percentage = offer.request.charityContributionPercentage;
        const charityVal = (cost * percentage) / 100;
        const beneficiaryVal = cost - charityVal;

        await tx.serviceRequest.update({
          where: { id: offer.requestId },
          data: {
            status: "RAISING_CLAIM",
            serviceCost: cost,
            charityContributionValue: charityVal,
            beneficiaryContributionValue: beneficiaryVal,
            serviceProviderId: offer.providerId,
          },
        });

        return appOffer;
      });

      return NextResponse.json({ offer: updatedOffer, message: "تمت الموافقة على عرض السعر بنجاح" });
    } else {
      // Reject action
      const updatedOffer = await prisma.priceOffer.update({
        where: { id: offerId },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ offer: updatedOffer, message: "تم رفض عرض السعر" });
    }
  } catch (error) {
    console.error("Action Offer API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء معالجة عرض السعر" },
      { status: 500 }
    );
  }
}

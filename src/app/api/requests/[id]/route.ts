import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    if (isNaN(id)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        charity: true,
        serviceProvider: true,
        priceOffers: {
          include: {
            provider: true,
          },
          orderBy: { createdAt: "desc" }
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    // Role-based visibility check
    const { role, charityId, providerId } = session;
    if (role === "CHARITY_STAFF" && charityId !== serviceRequest.charityId) {
      return NextResponse.json({ message: "غير مصرح لك بعرض هذا الطلب" }, { status: 403 });
    }
    
    if (role === "SERVICE_PROVIDER") {
      // Providers can only see details of RFQs or requests assigned to them
      const hasOffer = serviceRequest.priceOffers.some(o => o.providerId === providerId);
      const isAssigned = serviceRequest.serviceProviderId === providerId;
      const isRfq = serviceRequest.status === "RFQ";
      
      if (!isRfq && !isAssigned && !hasOffer) {
        return NextResponse.json({ message: "غير مصرح لك بعرض هذا الطلب" }, { status: 403 });
      }
    }

    return NextResponse.json({ request: serviceRequest });
  } catch (error) {
    console.error("Fetch Request Detail API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل تفاصيل الطلب" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    if (isNaN(id)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    const body = await request.json();
    const { status, description } = body;

    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { priceOffers: true }
    });


    if (!existingRequest) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    const { role, charityId, providerId } = session;

    // Validate update permissions and transition logic
    const updateData: { status?: string; description?: string } = {};

    if (status) {
      // 1. Submit Claim (Service Provider transitions from RAISING_CLAIM to CLAIM_REVIEW)
      if (status === "CLAIM_REVIEW") {
        if (role !== "SERVICE_PROVIDER" || existingRequest.serviceProviderId !== providerId) {
          return NextResponse.json(
            { message: "يجب أن تكون مزود الخدمة المعين لتقديم المطالبة المالية" },
            { status: 403 }
          );
        }
        if (existingRequest.status !== "RAISING_CLAIM") {
          return NextResponse.json(
            { message: "لا يمكن تقديم مطالبة مالية في هذه المرحلة" },
            { status: 400 }
          );
        }
        updateData.status = "CLAIM_REVIEW";
      }

      // 2. Reject Claim (Charity / Admin transitions back to RAISING_CLAIM)
      else if (status === "RAISING_CLAIM" && existingRequest.status === "CLAIM_REVIEW") {
        if (role !== "CHARITY_STAFF" && role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { message: "لا تملك صلاحية مراجعة أو رفض المطالبة المالية" },
            { status: 403 }
          );
        }
        if (role === "CHARITY_STAFF" && existingRequest.charityId !== charityId) {
          return NextResponse.json({ message: "غير مصرح لك للتحكم بطلبات هذه الجمعية" }, { status: 403 });
        }
        updateData.status = "RAISING_CLAIM";
      }

      // 3. Complete Request / Approve Claim (Charity / Admin transitions to COMPLETED)
      else if (status === "COMPLETED") {
        if (role !== "CHARITY_STAFF" && role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { message: "لا تملك صلاحية إعتماد اكتمال الطلب" },
            { status: 403 }
          );
        }
        if (role === "CHARITY_STAFF" && existingRequest.charityId !== charityId) {
          return NextResponse.json({ message: "غير مصرح لك للتحكم بطلبات هذه الجمعية" }, { status: 403 });
        }
        if (existingRequest.status !== "CLAIM_REVIEW") {
          return NextResponse.json(
            { message: "يجب تقديم ومراجعة المطالبة المالية قبل إغلاق الطلب" },
            { status: 400 }
          );
        }
        updateData.status = "COMPLETED";
      }

      // Other general updates (Only Charity/Admin when request is in draft or RFQ)
      else {
        if (role !== "CHARITY_STAFF" && role !== "SUPER_ADMIN") {
          return NextResponse.json({ message: "غير مصرح لك بتعديل هذا الطلب" }, { status: 403 });
        }
        if (role === "CHARITY_STAFF" && existingRequest.charityId !== charityId) {
          return NextResponse.json({ message: "غير مصرح لك لتعديل طلبات هذه الجمعية" }, { status: 403 });
        }
        updateData.status = status;
      }
    }

    if (description !== undefined) {
      if (role !== "CHARITY_STAFF" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ message: "غير مصرح لك بتعديل وصف الطلب" }, { status: 403 });
      }
      updateData.description = description;
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        charity: true,
        serviceProvider: true,
      }
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("Update Request API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث الطلب" },
      { status: 500 }
    );
  }
}

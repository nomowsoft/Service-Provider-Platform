import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { serviceRequestSchema } from "@/lib/zodSchemas";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { role, charityId, providerId } = session;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // Build query filters based on role
    let filter: Prisma.ServiceRequestWhereInput = {};
    if (role === "CHARITY_STAFF" && charityId) {
      filter.charityId = charityId;
    } else if (role === "SERVICE_PROVIDER" && providerId) {
      filter = {
        OR: [
          { status: "RFQ" },
          { serviceProviderId: providerId }
        ]
      };
    }

    if (statusFilter) {
      if (filter.OR) {
        // Intersect OR with status filter
        filter = {
          AND: [
            { status: statusFilter },
            { OR: filter.OR }
          ]
        };
      } else {
        filter.status = statusFilter;
      }
    }

    const requests = await prisma.serviceRequest.findMany({
      where: filter,
      include: {
        charity: true,
        serviceProvider: true,
        priceOffers: {
          include: {
            provider: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch Requests API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل الطلبات" },
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

    // Only charity staff or super admin can create requests
    if (session.role !== "CHARITY_STAFF" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "لا تملك الصلاحية لإنشاء طلب جديد" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request inputs with Zod
    const validation = serviceRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { beneficiaryName, beneficiaryNationalId, description, charityContributionPercentage, beneficiaryContributionValue } = validation.data;

    // Resolve charityId
    const reqCharityId = session.role === "CHARITY_STAFF" ? session.charityId : body.charityId;
    if (!reqCharityId) {
      return NextResponse.json(
        { message: "يجب تحديد الجمعية الأهلية التابع لها الطلب" },
        { status: 400 }
      );
    }

    // Auto-generate name sequence (SR-YYYY-XXXX)
    const year = new Date().getFullYear();
    const count = await prisma.serviceRequest.count();
    const sequenceNumber = String(count + 1).padStart(4, "0");
    const name = `SR-${year}-${sequenceNumber}`;

    const newRequest = await prisma.serviceRequest.create({
      data: {
        name,
        beneficiaryName,
        beneficiaryNationalId,
        description,
        charityId: reqCharityId,
        charityContributionPercentage,
        beneficiaryContributionValue,
        status: "RFQ", // Requests start in RFQ stage to gather pricing bids
      },
    });

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Create Request API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء الطلب" },
      { status: 500 }
    );
  }
}

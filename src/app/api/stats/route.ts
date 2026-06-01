import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { role, charityId, providerId } = session;

    // Build query filters based on role
    let filter: Prisma.ServiceRequestWhereInput = {};
    if (role === "CHARITY_STAFF" && charityId) {
      filter.charityId = charityId;
    } else if (role === "SERVICE_PROVIDER" && providerId) {
      // Service Provider sees:
      // 1. RFQs (open to all providers to submit offers)
      // 2. Or requests where this provider is selected/assigned
      filter = {
        OR: [
          { status: "RFQ" },
          { serviceProviderId: providerId }
        ]
      };
    }

    // Fetch all relevant requests to compile stats
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
      orderBy: { updatedAt: "desc" }
    });

    // Compute stats
    let rfqCount = 0;
    let claimCount = 0;
    let completedCount = 0;
    let pendingCount = 0;

    requests.forEach((req) => {
      if (req.status === "RFQ") {
        rfqCount++;
      } else if (req.status === "RAISING_CLAIM" || req.status === "CLAIM_REVIEW") {
        claimCount++;
      } else if (req.status === "COMPLETED") {
        completedCount++;
      } else {
        pendingCount++;
      }
    });

    // Get recent activity list (last 5 requests)
    const recentRequests = requests.slice(0, 5).map((req) => ({
      id: req.id,
      name: req.name,
      beneficiaryName: req.beneficiaryName,
      charityName: req.charity.name,
      providerName: req.serviceProvider?.name || "لم يحدد بعد",
      status: req.status,
      cost: req.serviceCost,
      date: req.dateRequest,
    }));

    return NextResponse.json({
      stats: {
        rfqCount,
        claimCount,
        completedCount,
        pendingCount,
        totalCount: requests.length,
      },
      recentRequests,
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل إحصائيات لوحة التحكم" },
      { status: 500 }
    );
  }
}

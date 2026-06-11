import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchRFQsFromOdoo } from "@/app/api/requests/odoo";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    // Fetch live RFQs from Odoo
    let odooRFQs: any[] = [];
    try {
      odooRFQs = await fetchRFQsFromOdoo(session);
    } catch (err) {
      console.error("Stats API Error fetching Odoo RFQs:", err);
    }

    // Compute stats from API data
    const rfqCount = odooRFQs.length;

    // Compile recent activity list
    const recentRequests = odooRFQs.map((req) => ({
      id: req.id,
      name: req.name,
      beneficiaryName: req.beneficiaryName,
      charityName: req.charity?.name || "",
      providerName: req.serviceProvider?.name || "لم يحدد بعد",
      status: req.status,
      cost: req.serviceCost || 0,
      date: req.createdAt,
    }));

    // Sort descending by date
    recentRequests.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      stats: {
        rfqCount,
        claimCount: 0,
        completedCount: 0,
        pendingCount: 0,
        totalCount: rfqCount,
      },
      recentRequests: recentRequests.slice(0, 5),
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل إحصائيات لوحة التحكم" },
      { status: 500 }
    );
  }
}

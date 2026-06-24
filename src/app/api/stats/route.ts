import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchRFQsFromOdoo, fetchClaimsFromOdoo } from "@/app/api/requests/odoo";

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

    // Fetch live Claims from Odoo
    let odooClaims: any[] = [];
    try {
      odooClaims = await fetchClaimsFromOdoo(session);
    } catch (err) {
      console.error("Stats API Error fetching Odoo Claims:", err);
    }

    // Compute RFQ/Requests stats from API data
    const rfqCount = odooRFQs.filter(r => r.status?.toLowerCase().trim() === "draft").length;
    const requestClaimCount = odooRFQs.filter(r => r.status?.toLowerCase().trim() === "to approve").length;
    const completedCount = odooRFQs.filter(r => r.status?.toLowerCase().trim() === "purchase").length;
    const pendingCount = odooRFQs.filter(r => r.status?.toLowerCase().trim() === "cancel").length;
    const totalCount = odooRFQs.length;

    // Compute Claims stats
    const newClaimsCount = odooClaims.filter(c => !c.claimStatus || c.claimStatus === "new").length;
    const raisingClaimsCount = odooClaims.filter(c => c.claimStatus === "raising_the_claim").length;
    const updateClaimsCount = odooClaims.filter(c => c.claimStatus === "update_the_claim").length;
    const acceptedClaimsCount = odooClaims.filter(c => c.claimStatus === "claim_accepted").length;
    const totalClaimsCount = odooClaims.length;

    // Compile recent activity list for RFQs
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

    // Compile recent activity list for Claims
    const recentClaims = odooClaims.map((claim) => ({
      id: claim.id,
      purchaseOrderId: claim.purchaseOrderId,
      requestNumber: claim.requestNumber,
      providerName: claim.providerName,
      serviceCost: claim.serviceCost,
      subServiceType: claim.subServiceType,
      claimStatus: claim.claimStatus || "new",
      date: claim.requestDate,
      charityName: claim.charity?.name || "",
    }));

    // Sort descending by date
    recentRequests.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    recentClaims.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      stats: {
        rfqCount,
        claimCount: requestClaimCount,
        completedCount,
        pendingCount,
        totalCount,
      },
      claimStats: {
        newCount: newClaimsCount,
        raisingCount: raisingClaimsCount,
        updateCount: updateClaimsCount,
        acceptedCount: acceptedClaimsCount,
        totalCount: totalClaimsCount,
      },
      recentRequests: recentRequests.slice(0, 5),
      recentClaims: recentClaims.slice(0, 5),
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل إحصائيات لوحة التحكم" },
      { status: 500 }
    );
  }
}

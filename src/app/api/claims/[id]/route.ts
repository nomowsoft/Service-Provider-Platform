import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchClaimDetailFromOdoo } from "../../requests/odoo";

/**
 * GET /api/claims/:id
 * Fetches a single claim's detailed data from Odoo by purchaseOrderId.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const purchaseOrderId = parseInt(id);
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    const claimDetail = await fetchClaimDetailFromOdoo(session, purchaseOrderId);

    if (!claimDetail) {
      return NextResponse.json({ message: "المطالبة المالية غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ claim: claimDetail });
  } catch (error) {
    console.error("Error loading claim detail:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل تفاصيل المطالبة المالية" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchRFQsFromOdoo } from "./odoo";

/**
 * GET /api/requests
 * Lists all RFQ-stage offers from the Odoo API for the current user.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let apiRequests: any[] = [];

    if (!statusFilter || statusFilter === "RFQ") {
      apiRequests = await fetchRFQsFromOdoo(session);
    }
    console.log(apiRequests);
    return NextResponse.json({ requests: apiRequests });
  } catch (error) {
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل الطلبات" },
      { status: 500 }
    );
  }
}

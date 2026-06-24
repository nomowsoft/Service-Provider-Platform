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

    const apiRequests = await fetchRFQsFromOdoo(session);
    return NextResponse.json({ requests: apiRequests });
  } catch (error) {
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل الطلبات" },
      { status: 500 }
    );
  }
}

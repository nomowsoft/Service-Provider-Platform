import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchClaimsFromOdoo } from "../requests/odoo";

/**
 * GET /api/claims
 * Lists all raising claims from the Odoo API for the current user.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const apiClaims = await fetchClaimsFromOdoo(session);
    return NextResponse.json({ claims: apiClaims });
  } catch (error) {
    console.error("Error loading claims:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل مطالبات المالك" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchClaimDetailFromOdoo, getCharitiesToSync, postClaimToOdoo, updateClaimInOdoo } from "../../requests/odoo";
import { raisingClaimSchema, updateClaimSchema } from "@/utils/validation";

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

/**
 * POST /api/claims/:id
 * Raises a financial claim (creates an invoice) in Odoo.
 */
export async function POST(
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

    const reqBody = await request.json();
    const validation = raisingClaimSchema.safeParse(reqBody);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { ref, invoice_date, attachments, invoice_lines } = validation.data;

    // Resolve charities
    const charities = await getCharitiesToSync(session);
    if (charities.length === 0) {
      return NextResponse.json(
        { message: "لا توجد جمعيات متصلة أو مصرح بها لهذا المزود" },
        { status: 400 }
      );
    }

    // Use the connected charity to route the request
    const charity = charities[0];

    const payload = {
      claim_status: "raising_the_claim",
      ref,
      invoice_date,
      attachments: attachments || [],
      invoice_lines,
    };

    const postResult = await postClaimToOdoo(purchaseOrderId, charity, payload);

    if (!postResult.ok) {
      return NextResponse.json(
        { message: postResult.error || "حدث خطأ أثناء تقديم المطالبة في النظام الخارجي" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create Claim API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تقديم المطالبة المالية" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/claims/:id
 * Updates a financial claim (updates an invoice) in Odoo.
 */
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
    const purchaseOrderId = parseInt(id);
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    const reqBody = await request.json();
    const validation = updateClaimSchema.safeParse(reqBody);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { invoices } = validation.data;

    // Resolve charities
    const charities = await getCharitiesToSync(session);
    if (charities.length === 0) {
      return NextResponse.json(
        { message: "لا توجد جمعيات متصلة أو مصرح بها لهذا المزود" },
        { status: 400 }
      );
    }

    const charity = charities[0];

    const payload = {
      claim_status: "raising_the_claim",
      invoices,
    };

    const updateResult = await updateClaimInOdoo(purchaseOrderId, charity, payload);

    if (!updateResult.ok) {
      return NextResponse.json(
        { message: updateResult.error || "حدث خطأ أثناء تحديث المطالبة في النظام الخارجي" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Claim API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث المطالبة المالية" },
      { status: 500 }
    );
  }
}


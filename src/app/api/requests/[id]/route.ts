import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { priceOfferSchema } from "@/utils/validation";
import {
  getCharitiesToSync,
  fetchOfferDetail,
  postOfferToOdoo,
  resolveProvider,
} from "../odoo";

/* ================================================================== */
/*  GET /api/requests/:id  — Fetch a single offer detail from Odoo    */
/* ================================================================== */

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
    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    const charities = await getCharitiesToSync(session);
    const result = await fetchOfferDetail(requestId, charities);

    if (!result) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    const { offer: fetchedOffer, agreedProducts, charity: matchedCharity } = result;

    const localStatus = fetchedOffer.offer_state || "draft";

    const matchedProvider = await resolveProvider(
      session,
      matchedCharity,
      fetchedOffer.offer_partner_name
    );

    const serviceRequest = {
      id: fetchedOffer.offer_id,
      name: fetchedOffer.offer_name,
      beneficiaryName: fetchedOffer.beneficiary_name || "مستفيد خارجي",
      beneficiaryNationalId: fetchedOffer.beneficiary_mobile || "",
      status: localStatus,
      serviceCost: fetchedOffer.service_cost || 0,
      charityContributionPercentage: 100,
      charityContributionValue: 0,
      beneficiaryContributionValue: 0,
      description: fetchedOffer.sub_service_type || "",
      createdAt: fetchedOffer.request_date
        ? new Date(fetchedOffer.request_date).toISOString()
        : new Date().toISOString(),
      charityId: matchedCharity.id,
      charity: matchedCharity,
      serviceProviderId: matchedProvider?.id || null,
      serviceProvider: matchedProvider || {
        name: fetchedOffer.offer_partner_name || "مزود خدمة خارجي",
      },
      priceOffers: [],
      agreedProducts,
      offerLines: fetchedOffer.lines || [],
      offerNotes: fetchedOffer.offer_notes || "",
      providerNote: fetchedOffer.provider_note || "",
      requestReportAttachment: fetchedOffer.request_report_attachment || null,
    };

    return NextResponse.json({ request: serviceRequest });
  } catch (error) {
    console.error("Fetch Request Detail API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل تفاصيل الطلب" },
      { status: 500 }
    );
  }
}

/* ================================================================== */
/*  POST /api/requests/:id  — Submit a price offer to Odoo            */
/* ================================================================== */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    if (session.role !== "SERVICE_PROVIDER" || !session.providerId) {
      return NextResponse.json(
        { message: "يجب أن تكون مزود خدمة لتقديم عرض سعر" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    // Resolve charities for this provider
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: session.providerId },
      include: { charities: { where: { status: "CONNECTED" } } },
    });

    const charities = (provider?.charities || []).map((c) => ({
      ...c,
      apiCode: provider?.apiCode || null,
    }));

    const result = await fetchOfferDetail(requestId, charities as any);
    if (!result) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    const { offer: fetchedOffer, agreedProducts, charity: matchedCharity } = result;

    // Verify the offer is still in RFQ state
    const offerState = fetchedOffer.offer_state || "";
    if (offerState === "approved" || offerState === "cancel" || offerState === "cancel_done") {
      return NextResponse.json(
        { message: "لا يمكن تقديم عرض سعر لطلب ليس في مرحلة طلب عروض الأسعار" },
        { status: 400 }
      );
    }

    // Validate request body
    const reqBody = await request.json();
    const validation = priceOfferSchema.safeParse(reqBody);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { lines, provider_note } = validation.data;

    // Build Odoo order lines & validate prices
    const odooOrderLines: { product_id: number; price_unit: number; product_qty: number; discount: number }[] = [];
    let amountTotal = 0;

    if (agreedProducts.length > 0) {
      for (const line of lines) {
        const matchedProduct = agreedProducts.find(
          (p: any) => p.product_id === line.productId
        );
        if (!matchedProduct) {
          return NextResponse.json(
            { message: "أحد المنتجات المحددة غير موجود في هذا الطلب" },
            { status: 400 }
          );
        }
        if (line.price > matchedProduct.cost_price) {
          return NextResponse.json(
            {
              message: `سعر العرض لا يمكن أن يتجاوز سعر التكلفة المتفق عليه للمنتج (${matchedProduct.cost_price})`,
            },
            { status: 400 }
          );
        }
        odooOrderLines.push({ product_id: line.productId, price_unit: line.price, product_qty: line.qty, discount: line.discount });
        amountTotal += line.price * line.qty;
      }
    } else {
      for (const line of lines) {
        odooOrderLines.push({ product_id: line.productId, price_unit: line.price, product_qty: line.qty, discount: line.discount });
        amountTotal += line.price * line.qty;
      }
    }

    // Submit to Odoo — offer_state must be "draft" for RFQ-stage offers
    const postResult = await postOfferToOdoo(
      requestId,
      matchedCharity as any,
      { 
        offer_state: "to approve", 
        order_line: odooOrderLines,
        provider_note: provider_note || ""
      }
    );

    if (!postResult.ok) {
      return NextResponse.json(
        { message: postResult.error || "حدث خطأ أثناء تقديم العرض في النظام الخارجي" },
        { status: 500 }
      );
    }

    const offer = {
      requestId,
      providerId: session.providerId,
      providerName: provider?.name || "",
      charityId: matchedCharity.id,
      charityName: matchedCharity.name,
      amountTotal,
      notes: provider_note || null,
      lines: odooOrderLines,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    };

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("Create Offer API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تقديم عرض السعر" },
      { status: 500 }
    );
  }
}

/* ================================================================== */
/*  PUT /api/requests/:id  — Update request status (placeholder)      */
/* ================================================================== */

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { message: "Update via API not yet implemented" },
    { status: 501 }
  );
}

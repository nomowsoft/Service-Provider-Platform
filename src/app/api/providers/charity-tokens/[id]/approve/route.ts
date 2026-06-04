import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

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
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const { id } = await params;
    const charityId = parseInt(id, 10);

    if (isNaN(charityId)) {
      return NextResponse.json({ message: "معرف جمعية غير صحيح" }, { status: 400 });
    }

    // Verify charity exists and belongs to this service provider
    const charity = await prisma.charity.findUnique({
      where: { id: charityId },
      include: {
        provider: true,
      },
    });

    if (!charity) {
      return NextResponse.json({ message: "الجمعية غير موجودة" }, { status: 404 });
    }

    if (charity.providerId !== session.providerId) {
      return NextResponse.json(
        { message: "غير مصرح لك بإدارة هذه الجمعية" },
        { status: 403 }
      );
    }

    const providerApiCode = charity.provider?.apiCode;
    if (!providerApiCode) {
      return NextResponse.json(
        { message: "كود الربط لمزود الخدمة غير متوفر" },
        { status: 400 }
      );
    }

    // Check status
    if (charity.status !== "REQUESTED") {
      return NextResponse.json(
        { message: "لا يوجد طلب ارتباط معلق لهذه الجمعية" },
        { status: 400 }
      );
    }

    const domain = charity.pendingDomain || charity.domain;
    if (!domain) {
      return NextResponse.json(
        { message: "دومين الجمعية غير متوفر لإرسال تأكيد الارتباط" },
        { status: 400 }
      );
    }

    // Build the callback URL
    let targetUrl = domain.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }
    
    if (targetUrl.endsWith("/")) {
      targetUrl = `${targetUrl}api/srb/connect`;
    } else {
      targetUrl = `${targetUrl}/api/srb/connect`;
    }

    // Send HTTP POST confirmation to charity's domain
    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: charity.token,
          code: providerApiCode,
        }),
      });

      if (!response.ok) {
        return NextResponse.json(
          { message: `فشل سيرفر الجمعية في استقبال التأكيد (رمز الاستجابة: ${response.status})` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("External Confirmation Call Failed:", error);
      return NextResponse.json(
        { message: "تعذر الاتصال بسيرفر الجمعية عبر الدومين المحدد. يرجى التحقق من عمل الدومين وصحته." },
        { status: 400 }
      );
    }

    // Update the charity state and move pending data to main fields
    await prisma.charity.update({
      where: { id: charity.id },
      data: {
        status: "CONNECTED",
        name: charity.pendingName || charity.name,
        email: charity.pendingEmail || charity.email,
        phone: charity.pendingPhone || charity.phone,
        domain: charity.pendingDomain || charity.domain,
        connectedAt: new Date(),
        pendingName: null,
        pendingEmail: null,
        pendingPhone: null,
        pendingDomain: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تمت الموافقة وتأكيد ارتباط الجمعية بنجاح وتم إرسال إشعار التأكيد لهم",
    });
  } catch (error) {
    console.error("Approve Provider Charity Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء معالجة الموافقة" },
      { status: 500 }
    );
  }
}

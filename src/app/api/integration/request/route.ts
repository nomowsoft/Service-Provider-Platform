import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "تنسيق الطلب غير صحيح، يرجى إرسال JSON صالح" },
        { status: 400 }
      );
    }

    const { apiCode, token, name, email, phone, domain } = body;

    // 1. Validation
    if (!apiCode || !apiCode.trim()) {
      return NextResponse.json(
        { message: "كود الربط لمزود الخدمة (apiCode) مطلوب" },
        { status: 400 }
      );
    }

    if (!token || !token.trim()) {
      return NextResponse.json(
        { message: "توكن الجمعية (token) مطلوب" },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "اسم الجمعية (name) مطلوب" },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { message: "البريد الإلكتروني (email) مطلوب" },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { message: "رقم الهاتف (phone) مطلوب" },
        { status: 400 }
      );
    }

    if (!domain || !domain.trim()) {
      return NextResponse.json(
        { message: "الدومين (domain) مطلوب" },
        { status: 400 }
      );
    }

    // 2. Find Service Provider by apiCode
    const provider = await prisma.serviceProvider.findFirst({
      where: { apiCode: apiCode.trim() },
    });

    if (!provider) {
      return NextResponse.json(
        { message: "كود الربط لمزود الخدمة (apiCode) غير صحيح" },
        { status: 400 }
      );
    }

    // 3. Find Charity by token that belongs to the provider
    const charity = await prisma.charity.findFirst({
      where: {
        token: token.trim(),
        providerId: provider.id,
      },
    });

    if (!charity) {
      return NextResponse.json(
        { message: "التوكن الخاص بالجمعية غير صحيح أو لا ينتمي لمزود الخدمة هذا" },
        { status: 400 }
      );
    }

    // Checking if there is already a pending request or an active connection
    if (charity.status === "REQUESTED") {
      return NextResponse.json(
        { message: "يوجد طلب ارتباط مسبق لهذه الجمعية وهو قيد المعالجة حالياً" },
        { status: 400 }
      );
    }

    if (charity.status === "CONNECTED") {
      return NextResponse.json(
        { message: "الجمعية مرتبطة ومتصلة بالفعل بمزود الخدمة هذا" },
        { status: 400 }
      );
    }

    // 4. Update the charity status and save pending fields
    await prisma.charity.update({
      where: { id: charity.id },
      data: {
        status: "REQUESTED",
        pendingName: name.trim(),
        pendingEmail: email.trim(),
        pendingPhone: phone.trim(),
        pendingDomain: domain.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم استقبال الطلب بنجاح، وبانتظار تأكيد الارتباط من قبل مزود الخدمة",
    });
  } catch (error) {
    console.error("External Integration Request Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ داخلي أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}

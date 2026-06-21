import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { integrationRequestSchema } from "@/utils/validation";

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    let body;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { message: "تنسيق الطلب غير صحيح، يرجى إرسال JSON صالح" },
        { status: 400 }
      );
    }

    // 1. Validation using Zod
    const validation = integrationRequestSchema.safeParse(body);
    if (!validation.success) {
      const firstErrorMessage = validation.error.issues[0].message;
      return NextResponse.json({ message: firstErrorMessage }, { status: 400 });
    }

    const { apiCode, token, name, email, phone, domain } = validation.data;

    // 2. Fetch Provider and Charity in parallel with selective fields (optimization)
    const [provider, charity] = await Promise.all([
      prisma.serviceProvider.findUnique({
        where: { apiCode },
        select: { id: true },
      }),
      prisma.charity.findUnique({
        where: { token },
        select: { id: true, status: true, providerId: true },
      }),
    ]);

    // 3. Status and relationship checks
    if (!provider) {
      return NextResponse.json(
        { message: "كود الربط لمزود الخدمة (apiCode) غير صحيح" },
        { status: 400 }
      );
    }

    if (!charity || charity.providerId !== provider.id) {
      return NextResponse.json(
        { message: "التوكن الخاص بالجمعية غير صحيح أو لا ينتمي لمزود الخدمة هذا" },
        { status: 400 }
      );
    }

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
        pendingName: name,
        pendingEmail: email,
        pendingPhone: phone,
        pendingDomain: domain,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم استقبال الطلب بنجاح، وبانتظار تأكيد الارتباط من قبل مزود الخدمة",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("External Integration Request Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ داخلي أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}


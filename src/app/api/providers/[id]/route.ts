import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const providerId = parseInt(id);
    if (isNaN(providerId)) {
      return NextResponse.json({ message: "معرف مزود الخدمة غير صالح" }, { status: 400 });
    }

    // Only SUPER_ADMIN can view any provider's info,
    // OR a SERVICE_PROVIDER user can view their own provider info.
    if (session.role !== "SUPER_ADMIN" && (session.role !== "SERVICE_PROVIDER" || session.providerId !== providerId)) {
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({ message: "مزود الخدمة غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Fetch Provider Detail API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل تفاصيل مزود الخدمة" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const providerId = parseInt(id);
    if (isNaN(providerId)) {
      return NextResponse.json({ message: "معرف مزود الخدمة غير صالح" }, { status: 400 });
    }

    // Only SUPER_ADMIN can edit any provider,
    // OR a SERVICE_PROVIDER user can edit their own provider.
    if (session.role !== "SUPER_ADMIN" && (session.role !== "SERVICE_PROVIDER" || session.providerId !== providerId)) {
      return NextResponse.json({ message: "غير مصرح بالوصول" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, code, apiCode } = body;

    // Fetch the existing provider to ensure it exists
    const existingProvider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!existingProvider) {
      return NextResponse.json({ message: "مزود الخدمة غير موجود" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ message: "اسم مزود الخدمة لا يمكن أن يكون فارغاً" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      updateData.email = email || null;
    }

    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    if (code !== undefined) {
      if (typeof code !== "string" || code.trim() === "") {
        return NextResponse.json({ message: "الكود لا يمكن أن يكون فارغاً" }, { status: 400 });
      }
      const trimmedCode = code.trim();
      if (trimmedCode !== existingProvider.code) {
        // Validate uniqueness of new code
        const duplicate = await prisma.serviceProvider.findUnique({
          where: { code: trimmedCode },
        });
        if (duplicate) {
          return NextResponse.json({ message: "كود مزود الخدمة مستخدم بالفعل" }, { status: 400 });
        }
        updateData.code = trimmedCode;
      }
    }

    if (apiCode !== undefined) {
      if (typeof apiCode !== "string" || apiCode.trim() === "") {
        return NextResponse.json({ message: "كود الربط (apiCode) لا يمكن أن يكون فارغاً" }, { status: 400 });
      }
      const trimmedApiCode = apiCode.trim();
      if (trimmedApiCode !== existingProvider.apiCode) {
        // Validate uniqueness of new apiCode
        const duplicate = await prisma.serviceProvider.findUnique({
          where: { apiCode: trimmedApiCode },
        });
        if (duplicate) {
          return NextResponse.json({ message: "كود الربط (apiCode) مستخدم بالفعل" }, { status: 400 });
        }
        updateData.apiCode = trimmedApiCode;
      }
    }

    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: updateData,
    });

    return NextResponse.json({ provider: updatedProvider, message: "تم تحديث بيانات مزود الخدمة بنجاح" });
  } catch (error: any) {
    console.error("Update Provider API Error:", error);
    return NextResponse.json(
      { message: error.message || "حدث خطأ أثناء تحديث بيانات مزود الخدمة" },
      { status: 500 }
    );
  }
}

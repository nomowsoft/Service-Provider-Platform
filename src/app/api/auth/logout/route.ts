import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json(
      { message: "تم تسجيل الخروج بنجاح" },
      { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء تسجيل الخروج" },
      { status: 500 }
    );
  }
}

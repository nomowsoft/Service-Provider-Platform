import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ message: "تم تسجيل الخروج بنجاح" });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء تسجيل الخروج" },
      { status: 500 }
    );
  }
}

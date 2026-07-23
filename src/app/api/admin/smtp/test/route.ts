import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "غير مصرح، هذه العملية مخصصة لمدير النظام فقط" },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { host, port, secure, user, password } = body;

    // Retrieve saved password if password field is masked
    if (!password || password === "••••••••") {
      const smtpModel = (prisma as any).smtpSetting;
      let existingSmtp: any = null;
      if (smtpModel) {
        existingSmtp = await smtpModel.findFirst();
      } else {
        try {
          const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "SmtpSetting" LIMIT 1`);
          if (rows && rows.length > 0) existingSmtp = rows[0];
        } catch (e) {
          console.warn("Raw query fallback error in smtp test:", e);
        }
      }
      password = existingSmtp?.password || process.env.SMTP_PASS || "";
    }

    host = host ? host.trim() : (process.env.SMTP_HOST || "");
    port = port ? parseInt(String(port), 10) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);
    secure = secure !== undefined ? Boolean(secure) : (process.env.SMTP_SECURE === "true");
    user = user ? user.trim() : (process.env.SMTP_USER || "");
    
    // Auto-strip spaces from Gmail App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const cleanPassword = password ? password.trim().replace(/\s+/g, "") : "";

    if (!host || !user) {
      return NextResponse.json(
        { success: false, message: "يرجى إدخال عنوان خادم SMTP واسم المستخدم لاختبار الاتصال" },
        { status: 400 }
      );
    }

    // Create transporter & verify connection
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: cleanPassword,
      },
      connectionTimeout: 8000, // 8 second timeout
    });

    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: `تم الاتصال بخادم البريد (${host}:${port}) بنجاح والتحقق من كلمة المرور!`,
    });
  } catch (error) {
    const errMessage = (error as Error).message || "فشل الاتصال بخادم البريد الإلكتروني";
    console.error("[SMTP TEST ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        message: `فشل الاتصال بخادم البريد: ${errMessage}`,
      },
      { status: 400 }
    );
  }
}

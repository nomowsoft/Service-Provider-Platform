import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح، هذه الصفحة مخصصة لمدير النظام فقط" }, { status: 403 });
    }

    let smtp: any = null;
    const smtpModel = (prisma as any).smtpSetting;

    if (smtpModel) {
      smtp = await smtpModel.findFirst();
    } else {
      try {
        const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "SmtpSetting" LIMIT 1`);
        if (rows && rows.length > 0) {
          smtp = rows[0];
        }
      } catch (err) {
        console.warn("Prisma raw query fallback for SmtpSetting:", err);
      }
    }

    return NextResponse.json({
      smtp: smtp
        ? {
            host: smtp.host || "",
            port: smtp.port || 587,
            secure: Boolean(smtp.secure),
            user: smtp.user || "",
            password: smtp.password ? "••••••••" : "",
            hasPassword: !!smtp.password,
            fromEmail: smtp.fromEmail || "",
            fromName: smtp.fromName || "فريق دعم سرب",
          }
        : {
            host: process.env.SMTP_HOST || "",
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
            secure: process.env.SMTP_SECURE === "true",
            user: process.env.SMTP_USER || "",
            password: "",
            hasPassword: !!process.env.SMTP_PASS,
            fromEmail: process.env.SMTP_FROM || "",
            fromName: "فريق دعم سرب",
          },
    });
  } catch (error) {
    console.error("GET SMTP Settings Error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء جلب إعدادات SMTP" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح، هذه العملية مخصصة لمدير النظام فقط" }, { status: 403 });
    }

    const body = await request.json();
    const { host, port, secure, user, password, fromEmail, fromName } = body;

    const smtpModel = (prisma as any).smtpSetting;
    let existingSmtp: any = null;

    if (smtpModel) {
      existingSmtp = await smtpModel.findFirst();
    } else {
      try {
        const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "SmtpSetting" LIMIT 1`);
        if (rows && rows.length > 0) {
          existingSmtp = rows[0];
        }
      } catch (err) {
        console.warn("Prisma raw query fallback for SmtpSetting check:", err);
      }
    }

    let finalPassword = password;
    if (password === "••••••••" || !password) {
      finalPassword = existingSmtp?.password || process.env.SMTP_PASS || "";
    }

    const parsedPort = port ? parseInt(String(port), 10) : 587;
    const isSecure = Boolean(secure);
    const hostVal = host ? host.trim() : "";
    const userVal = user ? user.trim() : "";
    const cleanPassword = finalPassword ? finalPassword.trim().replace(/\s+/g, "") : "";
    const fromEmailVal = fromEmail ? fromEmail.trim() : "";
    const fromNameVal = fromName ? fromName.trim() : "فريق دعم سرب";

    if (smtpModel) {
      if (existingSmtp) {
        await smtpModel.update({
          where: { id: existingSmtp.id },
          data: {
            host: hostVal,
            port: parsedPort,
            secure: isSecure,
            user: userVal,
            password: cleanPassword,
            fromEmail: fromEmailVal,
            fromName: fromNameVal,
          },
        });
      } else {
        await smtpModel.create({
          data: {
            id: 1,
            host: hostVal,
            port: parsedPort,
            secure: isSecure,
            user: userVal,
            password: cleanPassword,
            fromEmail: fromEmailVal,
            fromName: fromNameVal,
          },
        });
      }
    } else {
      // Direct raw query execution fallback
      if (existingSmtp) {
        await prisma.$executeRawUnsafe(
          `UPDATE "SmtpSetting" SET "host" = $1, "port" = $2, "secure" = $3, "user" = $4, "password" = $5, "fromEmail" = $6, "fromName" = $7, "updatedAt" = NOW() WHERE id = 1`,
          hostVal,
          parsedPort,
          isSecure,
          userVal,
          cleanPassword,
          fromEmailVal,
          fromNameVal
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "SmtpSetting" (id, host, port, secure, "user", password, "fromEmail", "fromName", "updatedAt") VALUES (1, $1, $2, $3, $4, $5, $6, $7, NOW())`,
          hostVal,
          parsedPort,
          isSecure,
          userVal,
          cleanPassword,
          fromEmailVal,
          fromNameVal
        );
      }
    }

    return NextResponse.json({ message: "تم حفظ إعدادات خادم البريد SMTP بنجاح" });
  } catch (error) {
    console.error("POST SMTP Settings Error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء حفظ إعدادات SMTP" }, { status: 500 });
  }
}

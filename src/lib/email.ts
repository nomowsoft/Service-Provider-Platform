import nodemailer from "nodemailer";
import prisma from "@/lib/db";

async function logEmailAttempt({
  toEmail,
  subject,
  status,
  error,
}: {
  toEmail: string;
  subject: string;
  status: "SUCCESS" | "FAILED" | "MOCK";
  error?: string | null;
}) {
  try {
    const logModel = (prisma as any).emailLog;
    if (logModel) {
      await logModel.create({
        data: {
          toEmail,
          subject,
          status,
          error: error || null,
        },
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "EmailLog" ("toEmail", "subject", "status", "error", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
        toEmail,
        subject,
        status,
        error || null
      );
    }
  } catch (err) {
    console.error("Failed to log email attempt:", err);
  }
}

export async function sendPasswordResetEmail({
  toEmail,
  userName,
  resetUrl,
}: {
  toEmail: string;
  userName: string;
  resetUrl: string;
}) {
  const subject = "إعادة تعيين كلمة المرور - البوابة المركزية لمزودي الخدمة";
  try {
    // 1. Check if SMTP configuration exists in database
    let dbSmtp: any = null;
    const smtpModel = (prisma as any).smtpSetting;

    if (smtpModel) {
      dbSmtp = await smtpModel.findFirst();
    } else {
      try {
        const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "SmtpSetting" LIMIT 1`);
        if (rows && rows.length > 0) {
          dbSmtp = rows[0];
        }
      } catch (err) {
        console.warn("Prisma raw query fallback in email.ts:", err);
      }
    }

    let host = (dbSmtp?.host || process.env.SMTP_HOST || "").trim();
    let port = dbSmtp?.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);
    let secure = dbSmtp?.secure ?? (process.env.SMTP_SECURE === "true");
    let user = (dbSmtp?.user || process.env.SMTP_USER || "").trim();
    let pass = (dbSmtp?.password || process.env.SMTP_PASS || "").trim().replace(/\s+/g, "");
    let fromEmail = (dbSmtp?.fromEmail || process.env.SMTP_FROM || "no-reply@sirb-platform.com").trim();
    let fromName = (dbSmtp?.fromName || "فريق دعم سرب").trim();

    console.log(`[EMAIL LOG] Preparing password reset email for: ${toEmail}`);
    console.log(`[EMAIL LOG] Reset Link: ${resetUrl}`);

    if (!host || !user) {
      console.warn(
        "[EMAIL WARN] SMTP credentials are not fully configured. Email printed to console instead of sending."
      );
      await logEmailAttempt({
        toEmail,
        subject,
        status: "MOCK",
        error: "إعدادات SMTP غير مكتملة، تم طباعة الرابط في السيرفر دون إرسال إيميل فعلي",
      });
      return { success: true, isMock: true };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إعادة تعيين كلمة المرور - سرب</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f6;
          margin: 0;
          padding: 0;
          color: #1e293b;
          direction: rtl;
          text-align: right;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
          direction: rtl;
          text-align: right;
        }
        .header {
          background: linear-gradient(135deg, #022c22 0%, #043e2f 50%, #064e3b 100%);
          padding: 35px 20px;
          text-align: center;
          color: #ffffff;
          direction: rtl;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #ffffff;
          text-align: center;
        }
        .header p {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #a7f3d0;
          opacity: 0.9;
          text-align: center;
        }
        .content {
          padding: 35px 30px;
          font-size: 15px;
          line-height: 1.8;
          color: #334155;
          direction: rtl;
          text-align: right;
        }
        .greeting {
          font-size: 17px;
          font-weight: 700;
          color: #064e3b;
          margin-bottom: 16px;
          direction: rtl;
          text-align: right;
        }
        .button-wrapper {
          text-align: center;
          margin: 32px 0;
          direction: rtl;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.25);
          transition: all 0.2s ease;
        }
        .notice-box {
          background-color: #f0fdf4;
          border-right: 4px solid #10b981;
          padding: 16px;
          border-radius: 8px;
          font-size: 13px;
          color: #065f46;
          margin: 24px 0;
          direction: rtl;
          text-align: right;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px 30px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
          direction: rtl;
        }
        .footer-brand {
          font-weight: 700;
          color: #064e3b;
        }
      </style>
    </head>
    <body dir="rtl" style="direction: rtl; text-align: right; background-color: #f4f7f6; margin: 0; padding: 0;">
      <div class="container" dir="rtl" style="direction: rtl; text-align: right; max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div class="header" dir="rtl" style="direction: rtl; text-align: center; background: linear-gradient(135deg, #022c22 0%, #043e2f 50%, #064e3b 100%); padding: 35px 20px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 14px auto; width: 56px; height: 56px;">
            <tr>
              <td align="center" valign="middle" style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); border-radius: 16px; font-size: 28px; font-weight: bold; color: #ffffff; text-align: center; vertical-align: middle; line-height: 56px;">
                S
              </td>
            </tr>
          </table>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">البوابة المركزية الموحدة</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0; opacity: 0.9; text-align: center;">منصة إدارة طلبات الجمعيات ومزودي الخدمات</p>
        </div>

        <div class="content" dir="rtl" style="direction: rtl; text-align: right; padding: 35px 30px; font-size: 15px; line-height: 1.8; color: #334155;">
          <div class="greeting" dir="rtl" style="direction: rtl; text-align: right; font-size: 17px; font-weight: 700; color: #064e3b; margin-bottom: 16px;">مرحبًا ${userName}،</div>
          
          <p dir="rtl" style="direction: rtl; text-align: right; margin: 12px 0;">تلقّينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابكم في <strong>البوابة المركزية الموحدة لمزودي الخدمة</strong>.</p>
          
          <p dir="rtl" style="direction: rtl; text-align: right; margin: 12px 0;">لإنشاء كلمة مرور جديدة، يرجى الضغط على الزر التالي:</p>
          
          <div class="button-wrapper" align="center" style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" class="btn" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px;">إعادة تعيين كلمة المرور</a>
          </div>

          <div class="notice-box" dir="rtl" style="direction: rtl; text-align: right; background-color: #f0fdf4; border-right: 4px solid #10b981; padding: 16px; border-radius: 8px; font-size: 13px; color: #065f46; margin: 24px 0;">
            ⏱️ <strong>ملاحظة هامة:</strong> رابط إعادة تعيين كلمة المرور صالح لمدة محددة، ويُستخدم لمرة واحدة فقط.
          </div>

          <p dir="rtl" style="direction: rtl; text-align: right; margin: 12px 0;">في حال لم تقوموا بطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة، وستبقى كلمة المرور الحالية دون تغيير.</p>
          
          <p dir="rtl" style="direction: rtl; text-align: right; color: #64748b; font-size: 13px; margin: 12px 0;">للحفاظ على أمان حسابكم، يرجى عدم مشاركة رابط إعادة التعيين أو كلمة المرور مع أي شخص.</p>
        </div>

        <div class="footer" dir="rtl" style="direction: rtl; text-align: center; background-color: #f8fafc; padding: 24px 30px; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9;">
          مع خالص التحية،<br>
          <span class="footer-brand" style="font-weight: 700; color: #064e3b;">فريق دعم سرب</span>
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });

    console.log(`[EMAIL SUCCESS] Reset email sent to ${toEmail}`);
    await logEmailAttempt({
      toEmail,
      subject,
      status: "SUCCESS",
    });

    return { success: true, isMock: false };
  } catch (error) {
    const errMessage = (error as Error).message || "فشل إرسال البريد الإلكتروني عبر خادم SMTP";
    console.error("[EMAIL ERROR] Failed to send email via Nodemailer:", error);
    await logEmailAttempt({
      toEmail,
      subject,
      status: "FAILED",
      error: errMessage,
    });

    return { success: false, error: errMessage };
  }
}

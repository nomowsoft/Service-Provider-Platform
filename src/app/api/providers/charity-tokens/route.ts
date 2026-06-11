import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import prisma from "@/lib/db";
import crypto from "crypto";

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Validates session and ensures the user is an authorized SERVICE_PROVIDER. */
async function authorizeProvider(): Promise<
  | { session: SessionPayload & { providerId: number }; error?: never }
  | { session?: never; error: NextResponse }
> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json({ message: "غير مصرح" }, { status: 401 }),
    };
  }

  if (session.role !== "SERVICE_PROVIDER" || !session.providerId) {
    return {
      error: NextResponse.json(
        { message: "غير مصرح بالوصول" },
        { status: 403 }
      ),
    };
  }

  return { session: session as SessionPayload & { providerId: number } };
}

/** Generates a unique sequential charity code (e.g. CH001, CH002, …). */
async function generateUniqueCode(): Promise<string> {
  const lastCharity = await prisma.charity.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  const nextId = (lastCharity?.id ?? 0) + 1;
  let code = `CH${String(nextId).padStart(3, "0")}`;

  // Safety fallback: verify code uniqueness (handles manual inserts / deletions)
  const exists = await prisma.charity.findUnique({
    where: { code },
    select: { id: true },
  });

  if (exists) {
    let counter = nextId + 1;
    while (true) {
      code = `CH${String(counter).padStart(3, "0")}`;
      const duplicate = await prisma.charity.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!duplicate) break;
      counter++;
    }
  }

  return code;
}

// ─── GET: List charities for the authenticated provider ───────────────────────

export async function GET() {
  try {
    const auth = await authorizeProvider();
    if (auth.error) return auth.error;

    const charities = await prisma.charity.findMany({
      where: { providerId: auth.session.providerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        token: true,
        status: true,
        domain: true,
        connectedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { charities, message: "تم تحميل الجمعيات بنجاح" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل الجمعيات" },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new charity with a unique token and code ──────────────────

export async function POST(request: Request) {
  try {
    const auth = await authorizeProvider();
    if (auth.error) return auth.error;

    let body: { name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "تنسيق الطلب غير صحيح، يرجى إرسال JSON صالح" },
        { status: 400 }
      );
    }

    const trimmedName = body.name?.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { message: "يرجى إدخال اسم الجمعية" },
        { status: 400 }
      );
    }

    // Generate token + code concurrently
    const [token, code] = await Promise.all([
      Promise.resolve(`tok_${crypto.randomBytes(24).toString("hex")}`),
      generateUniqueCode(),
    ]);

    const charity = await prisma.charity.create({
      data: {
        name: trimmedName,
        code,
        token,
        providerId: auth.session.providerId,
      },
    });

    return NextResponse.json(
      { charity, message: "تم إضافة الجمعية بنجاح" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة الجمعية" },
      { status: 500 }
    );
  }
}

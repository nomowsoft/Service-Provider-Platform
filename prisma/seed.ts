import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Clean up database
  await prisma.priceOffer.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.charity.deleteMany({});
  await prisma.serviceProvider.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Super Admin
  await prisma.user.create({
    data: {
      email: "admin@platform.com",
      name: "المدير العام",
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  // 2. Create Charities
  const charity1 = await prisma.charity.create({
    data: {
      name: "جمعية البر الأهلية",
      code: "CH001",
      email: "bir@charity.org",
      phone: "0501112223",
    },
  });

  const charity2 = await prisma.charity.create({
    data: {
      name: "جمعية رعاية الأيتام",
      code: "CH002",
      email: "care@charity.org",
      phone: "0502223334",
    },
  });

  // Create Charity Staff
  await prisma.user.create({
    data: {
      email: "bir@charity.org",
      name: "أحمد محمد (جمعية البر)",
      password: passwordHash,
      role: "CHARITY_STAFF",
      charityId: charity1.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "care@charity.org",
      name: "سارة عبد الرحمن (رعاية الأيتام)",
      password: passwordHash,
      role: "CHARITY_STAFF",
      charityId: charity2.id,
    },
  });

  // 3. Create Service Providers
  const provider1 = await prisma.serviceProvider.create({
    data: {
      name: "شركة الأمل للخدمات الطبية",
      code: "SP001",
      email: "hope@provider.com",
      phone: "0503334445",
    },
  });

  const provider2 = await prisma.serviceProvider.create({
    data: {
      name: "مؤسسة النور التعليمية",
      code: "SP002",
      email: "noor@provider.com",
      phone: "0504445556",
    },
  });

  // Create Provider Users
  await prisma.user.create({
    data: {
      email: "hope@provider.com",
      name: "خالد العتيبي (شركة الأمل)",
      password: passwordHash,
      role: "SERVICE_PROVIDER",
      providerId: provider1.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "noor@provider.com",
      name: "فهد الحربي (مؤسسة النور)",
      password: passwordHash,
      role: "SERVICE_PROVIDER",
      providerId: provider2.id,
    },
  });

  // 4. Create Service Requests
  // Request 1: RFQ, no offers yet
  await prisma.serviceRequest.create({
    data: {
      name: "SR-2026-0001",
      beneficiaryName: "محمد عبد الله الشهري",
      beneficiaryNationalId: "1029384756",
      charityId: charity1.id,
      status: "RFQ",
      description: "طلب توفير أجهزة طبية كرسي متحرك وأجهزة تنفس للبيت",
      serviceCost: 0,
      charityContributionPercentage: 100,
    },
  });

  // Request 2: RFQ, active offers from both providers
  const req2 = await prisma.serviceRequest.create({
    data: {
      name: "SR-2026-0002",
      beneficiaryName: "سعد بن علي القحطاني",
      beneficiaryNationalId: "1098765432",
      charityId: charity1.id,
      status: "RFQ",
      description: "طلب رعاية طبية منزلية لمدة 3 أشهر لمريض كبير السن",
      serviceCost: 0,
      charityContributionPercentage: 80,
      beneficiaryContributionValue: 1000,
    },
  });

  await prisma.priceOffer.create({
    data: {
      requestId: req2.id,
      providerId: provider1.id,
      amountTotal: 5000,
      status: "SENT",
      notes: "نقدم خدمة الرعاية الطبية المنزلية مع ممرض مرخص بواقع زيارتين أسبوعياً",
    },
  });

  await prisma.priceOffer.create({
    data: {
      requestId: req2.id,
      providerId: provider2.id,
      amountTotal: 4500,
      status: "SENT",
      notes: "عرض سعر خاص لجمعية البر للرعاية المنزلية الشاملة",
    },
  });

  // Request 3: Raising Claim (Offer approved, provider selected)
  const req3 = await prisma.serviceRequest.create({
    data: {
      name: "SR-2026-0003",
      beneficiaryName: "فاطمة بنت حسن البارقي",
      beneficiaryNationalId: "1047586930",
      charityId: charity2.id,
      serviceProviderId: provider1.id,
      status: "RAISING_CLAIM",
      description: "طلب جلسات علاج طبيعي مكثف لطفل من ذوي الاحتياجات الخاصة",
      serviceCost: 3500,
      charityContributionPercentage: 100,
      charityContributionValue: 3500,
      isRaisingClaim: true,
      claimType: "full_claim",
      claimState: "claim_review",
    },
  });

  await prisma.priceOffer.create({
    data: {
      requestId: req3.id,
      providerId: provider1.id,
      amountTotal: 3500,
      status: "APPROVED",
      notes: "علاج طبيعي مكثف 12 جلسة بمعدل 3 جلسات في الأسبوع",
    },
  });

  // Request 4: Completed
  const req4 = await prisma.serviceRequest.create({
    data: {
      name: "SR-2026-0004",
      beneficiaryName: "عبد العزيز بن عمر الحربي",
      beneficiaryNationalId: "1056473829",
      charityId: charity1.id,
      serviceProviderId: provider2.id,
      status: "COMPLETED",
      description: "طلب منحة دراسية للتدريب المهني في الحاسب الآلي",
      serviceCost: 6000,
      charityContributionPercentage: 50,
      charityContributionValue: 3000,
      beneficiaryContributionValue: 3000,
      isRaisingClaim: false,
      claimType: "full_claim",
      claimState: "claim_done",
    },
  });

  await prisma.priceOffer.create({
    data: {
      requestId: req4.id,
      providerId: provider2.id,
      amountTotal: 6000,
      status: "APPROVED",
      notes: "دورة دبلوم كامبردج لتقنية المعلومات معتمدة",
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error in seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

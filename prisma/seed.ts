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

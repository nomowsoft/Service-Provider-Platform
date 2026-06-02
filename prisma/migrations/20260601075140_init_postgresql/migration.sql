-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "charityId" INTEGER,
    "providerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryNationalId" TEXT NOT NULL,
    "charityId" INTEGER NOT NULL,
    "serviceProviderId" INTEGER,
    "dateRequest" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "serviceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "charityContributionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "charityContributionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "beneficiaryContributionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimType" TEXT,
    "claimState" TEXT,
    "isRaisingClaim" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceOffer" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "amountTotal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Charity_code_key" ON "Charity"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProvider_code_key" ON "ServiceProvider"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_name_key" ON "ServiceRequest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PriceOffer_requestId_providerId_key" ON "PriceOffer"("requestId", "providerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOffer" ADD CONSTRAINT "PriceOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOffer" ADD CONSTRAINT "PriceOffer_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

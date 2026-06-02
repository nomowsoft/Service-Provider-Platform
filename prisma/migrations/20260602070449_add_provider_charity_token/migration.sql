-- CreateTable
CREATE TABLE "ProviderCharityToken" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "charityName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCharityToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCharityToken_token_key" ON "ProviderCharityToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCharityToken_providerId_charityName_key" ON "ProviderCharityToken"("providerId", "charityName");

-- AddForeignKey
ALTER TABLE "ProviderCharityToken" ADD CONSTRAINT "ProviderCharityToken_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

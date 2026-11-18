-- AlterTable
ALTER TABLE "CosmeticForm" ADD COLUMN     "introducedVersionGroupId" INTEGER;

-- CreateTable
CREATE TABLE "FormCapture" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "form" TEXT NOT NULL,
    "caughtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormCapture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormCapture_userId_speciesId_idx" ON "FormCapture"("userId", "speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "FormCapture_userId_versionId_form_key" ON "FormCapture"("userId", "versionId", "form");

-- AddForeignKey
ALTER TABLE "FormCapture" ADD CONSTRAINT "FormCapture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormCapture" ADD CONSTRAINT "FormCapture_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormCapture" ADD CONSTRAINT "FormCapture_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

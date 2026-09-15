-- AlterTable
ALTER TABLE "Pokemon" ADD COLUMN     "attack" INTEGER,
ADD COLUMN     "defense" INTEGER,
ADD COLUMN     "formConditionFr" TEXT,
ADD COLUMN     "hp" INTEGER,
ADD COLUMN     "nameFr" TEXT,
ADD COLUMN     "specialAttack" INTEGER,
ADD COLUMN     "specialDefense" INTEGER,
ADD COLUMN     "speed" INTEGER;

-- AlterTable
ALTER TABLE "Species" ADD COLUMN     "evolvesFromSpeciesId" INTEGER;

-- CreateTable
CREATE TABLE "Evolution" (
    "id" INTEGER NOT NULL,
    "evolvedSpeciesId" INTEGER NOT NULL,
    "triggerSlug" TEXT NOT NULL,
    "conditionFr" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Evolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evolution_evolvedSpeciesId_idx" ON "Evolution"("evolvedSpeciesId");

-- CreateIndex
CREATE INDEX "Species_evolutionChainId_idx" ON "Species"("evolutionChainId");

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_evolvesFromSpeciesId_fkey" FOREIGN KEY ("evolvesFromSpeciesId") REFERENCES "Species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolution" ADD CONSTRAINT "Evolution_evolvedSpeciesId_fkey" FOREIGN KEY ("evolvedSpeciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

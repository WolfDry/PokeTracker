-- CreateTable
CREATE TABLE "CosmeticForm" (
    "id" INTEGER NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT,
    "formNameFr" TEXT,
    "isBattleOnly" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "type1Id" INTEGER,
    "type2Id" INTEGER,

    CONSTRAINT "CosmeticForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticForm_slug_key" ON "CosmeticForm"("slug");

-- CreateIndex
CREATE INDEX "CosmeticForm_pokemonId_idx" ON "CosmeticForm"("pokemonId");

-- AddForeignKey
ALTER TABLE "CosmeticForm" ADD CONSTRAINT "CosmeticForm_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmeticForm" ADD CONSTRAINT "CosmeticForm_type1Id_fkey" FOREIGN KEY ("type1Id") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmeticForm" ADD CONSTRAINT "CosmeticForm_type2Id_fkey" FOREIGN KEY ("type2Id") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

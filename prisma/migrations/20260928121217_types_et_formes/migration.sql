-- AlterTable
ALTER TABLE "Pokemon" ADD COLUMN     "introducedVersionGroupId" INTEGER,
ADD COLUMN     "isBattleOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TypeEfficacy" (
    "generationId" INTEGER NOT NULL,
    "attackTypeId" INTEGER NOT NULL,
    "defenseTypeId" INTEGER NOT NULL,
    "factor" INTEGER NOT NULL,

    CONSTRAINT "TypeEfficacy_pkey" PRIMARY KEY ("generationId","attackTypeId","defenseTypeId")
);

-- CreateTable
CREATE TABLE "PokemonPastType" (
    "pokemonId" INTEGER NOT NULL,
    "generationId" INTEGER NOT NULL,
    "type1Id" INTEGER NOT NULL,
    "type2Id" INTEGER,

    CONSTRAINT "PokemonPastType_pkey" PRIMARY KEY ("pokemonId","generationId")
);

-- AddForeignKey
ALTER TABLE "TypeEfficacy" ADD CONSTRAINT "TypeEfficacy_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeEfficacy" ADD CONSTRAINT "TypeEfficacy_attackTypeId_fkey" FOREIGN KEY ("attackTypeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeEfficacy" ADD CONSTRAINT "TypeEfficacy_defenseTypeId_fkey" FOREIGN KEY ("defenseTypeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonPastType" ADD CONSTRAINT "PokemonPastType_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonPastType" ADD CONSTRAINT "PokemonPastType_type1Id_fkey" FOREIGN KEY ("type1Id") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonPastType" ADD CONSTRAINT "PokemonPastType_type2Id_fkey" FOREIGN KEY ("type2Id") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

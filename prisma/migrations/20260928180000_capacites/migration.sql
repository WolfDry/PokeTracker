-- CreateTable
CREATE TABLE "Move" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "generationId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "damageClass" TEXT NOT NULL,
    "power" INTEGER,
    "accuracy" INTEGER,
    "pp" INTEGER,

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovePastValue" (
    "moveId" INTEGER NOT NULL,
    "changedInVersionGroupId" INTEGER NOT NULL,
    "typeId" INTEGER,
    "power" INTEGER,
    "accuracy" INTEGER,
    "pp" INTEGER,

    CONSTRAINT "MovePastValue_pkey" PRIMARY KEY ("moveId","changedInVersionGroupId")
);

-- CreateTable
CREATE TABLE "PokemonMove" (
    "pokemonId" INTEGER NOT NULL,
    "versionGroupId" INTEGER NOT NULL,
    "moveId" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "level" INTEGER,

    CONSTRAINT "PokemonMove_pkey" PRIMARY KEY ("pokemonId","versionGroupId","moveId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Move_slug_key" ON "Move"("slug");

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovePastValue" ADD CONSTRAINT "MovePastValue_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovePastValue" ADD CONSTRAINT "MovePastValue_changedInVersionGroupId_fkey" FOREIGN KEY ("changedInVersionGroupId") REFERENCES "VersionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovePastValue" ADD CONSTRAINT "MovePastValue_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "VersionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


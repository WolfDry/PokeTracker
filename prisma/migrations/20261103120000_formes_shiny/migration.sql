-- AlterTable
ALTER TABLE "ShinyCapture" ADD COLUMN     "pokemonId" INTEGER;

-- AlterTable
ALTER TABLE "ShinyHunt" ADD COLUMN     "pokemonId" INTEGER;

-- AddForeignKey
ALTER TABLE "ShinyHunt" ADD CONSTRAINT "ShinyHunt_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyCapture" ADD CONSTRAINT "ShinyCapture_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

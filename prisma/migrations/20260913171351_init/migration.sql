-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('FULL', 'PARTIAL', 'NONE');

-- CreateEnum
CREATE TYPE "HuntStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "Generation" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "generationId" INTEGER,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionGroup" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "generationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "VersionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionGroupRegion" (
    "versionGroupId" INTEGER NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "VersionGroupRegion_pkey" PRIMARY KEY ("versionGroupId","regionId")
);

-- CreateTable
CREATE TABLE "Version" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "versionGroupId" INTEGER NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionCoverage" (
    "versionId" INTEGER NOT NULL,
    "status" "CoverageStatus" NOT NULL,
    "encounterCount" INTEGER NOT NULL,
    "areaCount" INTEGER NOT NULL,
    "source" TEXT,
    "note" TEXT,

    CONSTRAINT "VersionCoverage_pkey" PRIMARY KEY ("versionId")
);

-- CreateTable
CREATE TABLE "Pokedex" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "isMainSeries" BOOLEAN NOT NULL,
    "regionId" INTEGER,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionFr" TEXT,

    CONSTRAINT "Pokedex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokedexVersionGroup" (
    "pokedexId" INTEGER NOT NULL,
    "versionGroupId" INTEGER NOT NULL,

    CONSTRAINT "PokedexVersionGroup_pkey" PRIMARY KEY ("pokedexId","versionGroupId")
);

-- CreateTable
CREATE TABLE "PokedexEntry" (
    "pokedexId" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "PokedexEntry_pkey" PRIMARY KEY ("pokedexId","speciesId")
);

-- CreateTable
CREATE TABLE "Type" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "genusFr" TEXT,
    "generationId" INTEGER NOT NULL,
    "isLegendary" BOOLEAN NOT NULL DEFAULT false,
    "isMythical" BOOLEAN NOT NULL DEFAULT false,
    "isBaby" BOOLEAN NOT NULL DEFAULT false,
    "captureRate" INTEGER,
    "evolutionChainId" INTEGER,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pokemon" (
    "id" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "formNameFr" TEXT,
    "type1Id" INTEGER NOT NULL,
    "type2Id" INTEGER,
    "height" INTEGER,
    "weight" INTEGER,

    CONSTRAINT "Pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "regionId" INTEGER,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationArea" (
    "id" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "slug" TEXT,
    "nameFr" TEXT,
    "nameEn" TEXT,

    CONSTRAINT "LocationArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterMethod" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "EncounterMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationAreaEncounterRate" (
    "locationAreaId" INTEGER NOT NULL,
    "methodId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "rate" INTEGER NOT NULL,

    CONSTRAINT "LocationAreaEncounterRate_pkey" PRIMARY KEY ("locationAreaId","methodId","versionId")
);

-- CreateTable
CREATE TABLE "EncounterCondition" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "EncounterCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterConditionValue" (
    "id" INTEGER NOT NULL,
    "conditionId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL,

    CONSTRAINT "EncounterConditionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encounter" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'pokeapi',
    "sourceRef" INTEGER,
    "versionId" INTEGER NOT NULL,
    "locationAreaId" INTEGER NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "methodId" INTEGER NOT NULL,
    "slot" INTEGER,
    "rarity" INTEGER NOT NULL,
    "minLevel" INTEGER NOT NULL,
    "maxLevel" INTEGER NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterConditionOnEncounter" (
    "encounterId" INTEGER NOT NULL,
    "conditionValueId" INTEGER NOT NULL,

    CONSTRAINT "EncounterConditionOnEncounter_pkey" PRIMARY KEY ("encounterId","conditionValueId")
);

-- CreateTable
CREATE TABLE "Capture" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "caughtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShinyHunt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "method" TEXT,
    "status" "HuntStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ShinyHunt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShinyCapture" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "huntId" TEXT,
    "encounters" INTEGER,
    "method" TEXT,
    "nickname" TEXT,
    "note" TEXT,
    "caughtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShinyCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Generation_slug_key" ON "Generation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VersionGroup_slug_key" ON "VersionGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Version_slug_key" ON "Version"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Pokedex_slug_key" ON "Pokedex"("slug");

-- CreateIndex
CREATE INDEX "PokedexEntry_pokedexId_number_idx" ON "PokedexEntry"("pokedexId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Type_slug_key" ON "Type"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "Species"("slug");

-- CreateIndex
CREATE INDEX "Species_nameFr_idx" ON "Species"("nameFr");

-- CreateIndex
CREATE INDEX "Species_nameEn_idx" ON "Species"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_slug_key" ON "Pokemon"("slug");

-- CreateIndex
CREATE INDEX "Pokemon_speciesId_idx" ON "Pokemon"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE INDEX "Location_nameFr_idx" ON "Location"("nameFr");

-- CreateIndex
CREATE INDEX "Location_nameEn_idx" ON "Location"("nameEn");

-- CreateIndex
CREATE INDEX "LocationArea_locationId_idx" ON "LocationArea"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "EncounterMethod_slug_key" ON "EncounterMethod"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EncounterCondition_slug_key" ON "EncounterCondition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EncounterConditionValue_slug_key" ON "EncounterConditionValue"("slug");

-- CreateIndex
CREATE INDEX "Encounter_versionId_locationAreaId_idx" ON "Encounter"("versionId", "locationAreaId");

-- CreateIndex
CREATE INDEX "Encounter_pokemonId_versionId_idx" ON "Encounter"("pokemonId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "Encounter_source_sourceRef_key" ON "Encounter"("source", "sourceRef");

-- CreateIndex
CREATE INDEX "Capture_userId_versionId_idx" ON "Capture"("userId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "Capture_userId_speciesId_versionId_key" ON "Capture"("userId", "speciesId", "versionId");

-- CreateIndex
CREATE INDEX "ShinyHunt_userId_status_idx" ON "ShinyHunt"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ShinyCapture_huntId_key" ON "ShinyCapture"("huntId");

-- CreateIndex
CREATE INDEX "ShinyCapture_userId_idx" ON "ShinyCapture"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionGroup" ADD CONSTRAINT "VersionGroup_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionGroupRegion" ADD CONSTRAINT "VersionGroupRegion_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "VersionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "VersionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionCoverage" ADD CONSTRAINT "VersionCoverage_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pokedex" ADD CONSTRAINT "Pokedex_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokedexVersionGroup" ADD CONSTRAINT "PokedexVersionGroup_pokedexId_fkey" FOREIGN KEY ("pokedexId") REFERENCES "Pokedex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokedexVersionGroup" ADD CONSTRAINT "PokedexVersionGroup_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "VersionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokedexEntry" ADD CONSTRAINT "PokedexEntry_pokedexId_fkey" FOREIGN KEY ("pokedexId") REFERENCES "Pokedex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokedexEntry" ADD CONSTRAINT "PokedexEntry_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pokemon" ADD CONSTRAINT "Pokemon_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pokemon" ADD CONSTRAINT "Pokemon_type1Id_fkey" FOREIGN KEY ("type1Id") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pokemon" ADD CONSTRAINT "Pokemon_type2Id_fkey" FOREIGN KEY ("type2Id") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationArea" ADD CONSTRAINT "LocationArea_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationAreaEncounterRate" ADD CONSTRAINT "LocationAreaEncounterRate_locationAreaId_fkey" FOREIGN KEY ("locationAreaId") REFERENCES "LocationArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationAreaEncounterRate" ADD CONSTRAINT "LocationAreaEncounterRate_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "EncounterMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationAreaEncounterRate" ADD CONSTRAINT "LocationAreaEncounterRate_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterConditionValue" ADD CONSTRAINT "EncounterConditionValue_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "EncounterCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_locationAreaId_fkey" FOREIGN KEY ("locationAreaId") REFERENCES "LocationArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "EncounterMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterConditionOnEncounter" ADD CONSTRAINT "EncounterConditionOnEncounter_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterConditionOnEncounter" ADD CONSTRAINT "EncounterConditionOnEncounter_conditionValueId_fkey" FOREIGN KEY ("conditionValueId") REFERENCES "EncounterConditionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyHunt" ADD CONSTRAINT "ShinyHunt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyHunt" ADD CONSTRAINT "ShinyHunt_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyHunt" ADD CONSTRAINT "ShinyHunt_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyCapture" ADD CONSTRAINT "ShinyCapture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyCapture" ADD CONSTRAINT "ShinyCapture_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyCapture" ADD CONSTRAINT "ShinyCapture_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShinyCapture" ADD CONSTRAINT "ShinyCapture_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "ShinyHunt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

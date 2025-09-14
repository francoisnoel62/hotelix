-- CreateEnum
CREATE TYPE "public"."StatutIntervention" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "public"."TypeIntervention" AS ENUM ('PLOMBERIE', 'ELECTRICITE', 'CLIMATISATION', 'CHAUFFAGE', 'MENUISERIE', 'PEINTURE', 'NETTOYAGE', 'AUTRE');

-- CreateEnum
CREATE TYPE "public"."PrioriteIntervention" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."OrigineIntervention" AS ENUM ('STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."TypeZone" AS ENUM ('CHAMBRE', 'RESTAURANT', 'BAR', 'RECEPTION', 'SALON', 'COULOIR', 'ESCALIER', 'ASCENSEUR', 'PARKING', 'JARDIN', 'PISCINE', 'SPA', 'SALLE_SPORT', 'CUISINE', 'BUANDERIE', 'CAVE', 'GRENIER', 'AUTRE');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'TECHNICIEN';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "specialite" TEXT;

-- CreateTable
CREATE TABLE "public"."Zone" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "public"."TypeZone" NOT NULL,
    "description" TEXT,
    "hotelId" INTEGER NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SousZone" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "SousZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Intervention" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "public"."StatutIntervention" NOT NULL DEFAULT 'EN_ATTENTE',
    "type" "public"."TypeIntervention" NOT NULL,
    "priorite" "public"."PrioriteIntervention" NOT NULL DEFAULT 'NORMALE',
    "origine" "public"."OrigineIntervention" NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "hotelId" INTEGER NOT NULL,
    "demandeurId" INTEGER NOT NULL,
    "assigneId" INTEGER,
    "zoneId" INTEGER NOT NULL,
    "sousZoneId" INTEGER,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "expediteurId" INTEGER NOT NULL,
    "destinataireId" INTEGER NOT NULL,
    "hotelId" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Zone" ADD CONSTRAINT "Zone_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "public"."Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousZone" ADD CONSTRAINT "SousZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Intervention" ADD CONSTRAINT "Intervention_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "public"."Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Intervention" ADD CONSTRAINT "Intervention_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Intervention" ADD CONSTRAINT "Intervention_assigneId_fkey" FOREIGN KEY ("assigneId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Intervention" ADD CONSTRAINT "Intervention_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Intervention" ADD CONSTRAINT "Intervention_sousZoneId_fkey" FOREIGN KEY ("sousZoneId") REFERENCES "public"."SousZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "public"."Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

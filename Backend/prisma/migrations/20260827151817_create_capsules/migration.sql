-- CreateEnum
CREATE TYPE "CapsuleType" AS ENUM ('solo', 'group');

-- CreateEnum
CREATE TYPE "UnlockType" AS ENUM ('date', 'location', 'milestone');

-- CreateEnum
CREATE TYPE "CapsuleStatus" AS ENUM ('draft', 'sealed', 'unlocked');

-- CreateTable
CREATE TABLE "capsules" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "type" "CapsuleType" NOT NULL DEFAULT 'solo',
    "status" "CapsuleStatus" NOT NULL DEFAULT 'draft',
    "unlock_type" "UnlockType" NOT NULL DEFAULT 'date',
    "unlock_date" TIMESTAMP(3),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "sealed_at" TIMESTAMP(3),
    "unlocked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capsules_pkey" PRIMARY KEY ("id")
);

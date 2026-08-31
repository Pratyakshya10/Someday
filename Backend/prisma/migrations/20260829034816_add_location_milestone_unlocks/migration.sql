-- AlterTable
ALTER TABLE "capsules" ADD COLUMN     "unlock_lat" DOUBLE PRECISION,
ADD COLUMN     "unlock_lng" DOUBLE PRECISION,
ADD COLUMN     "unlock_milestone" TEXT,
ADD COLUMN     "unlock_place_label" TEXT,
ADD COLUMN     "unlock_radius_m" INTEGER;

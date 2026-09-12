-- AlterTable
ALTER TABLE "capsule_members" ADD COLUMN     "viewed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "capsules" ADD COLUMN     "owner_viewed_unlock_at" TIMESTAMP(3),
ADD COLUMN     "unlock_notified_at" TIMESTAMP(3);

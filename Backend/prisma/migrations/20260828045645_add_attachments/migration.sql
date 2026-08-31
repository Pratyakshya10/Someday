-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('voice', 'photo', 'video');

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "capsule_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "duration_sec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_capsule_id_idx" ON "attachments"("capsule_id");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_capsule_id_fkey" FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

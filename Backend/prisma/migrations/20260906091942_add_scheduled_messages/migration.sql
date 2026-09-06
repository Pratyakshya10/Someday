-- CreateEnum
CREATE TYPE "ScheduledStatus" AS ENUM ('draft', 'scheduled', 'sent', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('none', 'yearly');

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "capsule_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "send_at" TIMESTAMP(3),
    "status" "ScheduledStatus" NOT NULL DEFAULT 'draft',
    "recurrence" "Recurrence" NOT NULL DEFAULT 'none',
    "occasion" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_messages_capsule_id_key" ON "scheduled_messages"("capsule_id");

-- CreateIndex
CREATE INDEX "scheduled_messages_owner_id_idx" ON "scheduled_messages"("owner_id");

-- CreateIndex
CREATE INDEX "scheduled_messages_status_send_at_idx" ON "scheduled_messages"("status", "send_at");

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_capsule_id_fkey" FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'editor', 'viewer');

-- CreateTable
CREATE TABLE "capsule_members" (
    "id" UUID NOT NULL,
    "capsule_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capsule_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capsule_invites" (
    "id" UUID NOT NULL,
    "capsule_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "role" "MemberRole" NOT NULL DEFAULT 'editor',
    "accepted_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capsule_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" UUID NOT NULL,
    "capsule_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "capsule_members_user_id_idx" ON "capsule_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "capsule_members_capsule_id_user_id_key" ON "capsule_members"("capsule_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "capsule_invites_token_key" ON "capsule_invites"("token");

-- CreateIndex
CREATE INDEX "capsule_invites_capsule_id_idx" ON "capsule_invites"("capsule_id");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_capsule_id_author_id_key" ON "contributions"("capsule_id", "author_id");

-- AddForeignKey
ALTER TABLE "capsule_members" ADD CONSTRAINT "capsule_members_capsule_id_fkey" FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capsule_invites" ADD CONSTRAINT "capsule_invites_capsule_id_fkey" FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_capsule_id_fkey" FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

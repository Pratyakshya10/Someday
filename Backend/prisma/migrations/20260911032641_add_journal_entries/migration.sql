-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "mood" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_attachments" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "duration_sec" INTEGER,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journal_entries_owner_id_idx" ON "journal_entries"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_owner_id_entry_date_key" ON "journal_entries"("owner_id", "entry_date");

-- CreateIndex
CREATE INDEX "journal_attachments_entry_id_idx" ON "journal_attachments"("entry_id");

-- AddForeignKey
ALTER TABLE "journal_attachments" ADD CONSTRAINT "journal_attachments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

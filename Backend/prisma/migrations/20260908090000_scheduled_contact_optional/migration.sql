-- A scheduled message can now exist without a recipient while it's a draft.
-- Drop the NOT NULL on contact_id (the FK + cascade are unchanged).
ALTER TABLE "public"."scheduled_messages" ALTER COLUMN "contact_id" DROP NOT NULL;

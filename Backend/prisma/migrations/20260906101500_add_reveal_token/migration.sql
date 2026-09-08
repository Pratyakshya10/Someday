-- Add an unguessable reveal token to each scheduled message. Existing rows are
-- backfilled by the column default; new rows get one from the DB too.
ALTER TABLE "public"."scheduled_messages"
  ADD COLUMN "token" UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX "scheduled_messages_token_key"
  ON "public"."scheduled_messages"("token");

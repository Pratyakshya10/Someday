-- Scheduled messages reference recipients and letter content, so lock the table
-- the same way as the rest: RLS on with no policies blocks Supabase's public
-- REST API, while the app (Prisma as the postgres owner) keeps full access.
ALTER TABLE "public"."scheduled_messages" ENABLE ROW LEVEL SECURITY;

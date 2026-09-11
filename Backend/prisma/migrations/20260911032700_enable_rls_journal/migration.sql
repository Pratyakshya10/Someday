-- Journal entries hold private personal writing, so lock both tables the same
-- way as the rest: RLS on with no policies blocks Supabase's public REST API,
-- while the app (Prisma as the postgres owner) keeps full access.
ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."journal_attachments" ENABLE ROW LEVEL SECURITY;

-- Prisma's own migration-history table lives in the public schema too, so
-- it's just as reachable through Supabase's auto REST API as any real table
-- — the Security Advisor flags it for the same reason. It holds no user
-- data (just migration names/checksums/timestamps), but there's no reason
-- to leave it queryable by the anon key either. Same fix as the rest: RLS
-- on, no policies, blocks PostgREST while Prisma (as the postgres owner,
-- which bypasses RLS) keeps working exactly as before.
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

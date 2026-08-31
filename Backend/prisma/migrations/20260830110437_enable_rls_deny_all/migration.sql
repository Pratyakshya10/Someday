-- Lock down direct data access.
--
-- The app talks to Postgres through Prisma as the `postgres` role (the table
-- OWNER), which bypasses row-level security. Enabling RLS here — with NO
-- policies — blocks Supabase's auto REST API (the anon/authenticated roles)
-- from touching these tables at all, while the app keeps full access.
--
-- Net effect: private letters can only be read/written through our own
-- authorization checks, never through the public anon key.

ALTER TABLE "public"."capsules"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attachments"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."capsule_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."capsule_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contributions"   ENABLE ROW LEVEL SECURITY;

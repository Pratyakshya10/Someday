-- Supabase's Performance Advisor flagged scheduled_messages_contact_id_fkey
-- as an uncovered foreign key — every lookup/join by contact, and every
-- ON DELETE CASCADE when a contact is removed, was doing a full table scan
-- instead of an index seek.
CREATE INDEX "scheduled_messages_contact_id_idx" ON "public"."scheduled_messages"("contact_id");

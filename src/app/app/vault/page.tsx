import { requireUser } from "@/lib/auth";
import { listUserCapsules, resolveEmailInvites } from "@someday/backend";
import { toCapsuleView } from "@/lib/serialize";
import { Vault } from "../screens/Vault";

// Always fetch fresh — the vault changes as capsules are created and sealed.
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await requireUser();
  // Claim any capsules shared with this email before listing.
  if (user.email) await resolveEmailInvites(user.id, user.email);
  const capsules = await listUserCapsules(user.id);
  return <Vault capsules={capsules.map(toCapsuleView)} />;
}

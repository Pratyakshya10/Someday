import { requireUser } from "@/lib/auth";
import { listUserCapsules } from "@someday/backend";
import { toCapsuleView } from "@/lib/serialize";
import { Vault } from "../screens/Vault";

// Always fetch fresh — the vault changes as capsules are created and sealed.
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await requireUser();
  const capsules = await listUserCapsules(user.id);
  return <Vault capsules={capsules.map(toCapsuleView)} />;
}

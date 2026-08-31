import { notFound, redirect } from "next/navigation";
import { getCapsule } from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";
import { toCapsuleView } from "@/lib/serialize";
import { Sealing } from "../../../screens/Sealing";

export default async function SealPage({ params }: PageProps<"/app/capsule/[id]/seal">) {
  const { id } = await params;
  const ownerId = await requireOwnerId();
  const capsule = await getCapsule(id, ownerId);
  if (!capsule) notFound();
  if (capsule.status !== "draft") redirect(`/app/capsule/${id}`);
  // Can't seal without an unlock condition — finish that step first.
  const configured =
    (capsule.unlockType === "date" && capsule.unlockDate) ||
    (capsule.unlockType === "location" && capsule.unlockLat != null && capsule.unlockLng != null) ||
    (capsule.unlockType === "milestone" && capsule.unlockMilestone);
  if (!configured) redirect(`/app/capsule/${id}/delivery`);
  return <Sealing capsule={toCapsuleView(capsule)} />;
}

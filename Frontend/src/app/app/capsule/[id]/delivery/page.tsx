import { notFound, redirect } from "next/navigation";
import { getCapsule } from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";
import { toCapsuleView } from "@/lib/serialize";
import { SetDelivery } from "../../../screens/SetDelivery";

export default async function DeliveryPage({ params }: PageProps<"/app/capsule/[id]/delivery">) {
  const { id } = await params;
  const ownerId = await requireOwnerId();
  const capsule = await getCapsule(id, ownerId);
  if (!capsule) notFound();
  if (capsule.status !== "draft") redirect(`/app/capsule/${id}`);
  return <SetDelivery capsule={toCapsuleView(capsule)} />;
}

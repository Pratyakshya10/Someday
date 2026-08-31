import { requireOwnerId } from "@/lib/auth";
import { NewCapsule } from "../screens/NewCapsule";

export default async function NewCapsulePage({ searchParams }: PageProps<"/app/new">) {
  await requireOwnerId(); // gate: must be signed in
  const { type } = await searchParams;
  const initialType = type === "group" ? "group" : "solo";
  return <NewCapsule initialType={initialType} />;
}

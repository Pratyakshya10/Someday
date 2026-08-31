import { redirect } from "next/navigation";

// /app is just an entry point — send people to their vault.
export default function AppIndex() {
  redirect("/app/vault");
}

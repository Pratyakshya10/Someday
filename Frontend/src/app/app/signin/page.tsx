import { redirect } from "next/navigation";
import { getOwnerId } from "@/lib/auth";
import { SignIn } from "../screens/SignIn";

// Already signed in? Skip straight to the vault.
export default async function SignInPage({ searchParams }: PageProps<"/app/signin">) {
  if (await getOwnerId()) redirect("/app/vault");
  const { error } = await searchParams;
  return <SignIn oauthError={typeof error === "string" ? error : undefined} />;
}

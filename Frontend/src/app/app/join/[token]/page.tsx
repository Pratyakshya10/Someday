import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvite } from "@someday/backend";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: PageProps<"/app/join/[token]"> ) {
  const { token } = await params;
  const user = await requireUser(); // must be signed in to join
  const capsuleId = await acceptInvite(token, user.id, user.email);

  if (capsuleId) redirect(`/app/capsule/${capsuleId}`);

  // Invalid, revoked, or meant for a different email.
  return (
    <main className="relative z-[2] flex min-h-screen items-center justify-center p-8 text-center">
      <div className="max-w-[420px]">
        <h1 className="mb-3 font-serif text-3xl font-medium">This invite isn&rsquo;t valid</h1>
        <p className="mb-6 text-sm text-app-dim">
          It may have been revoked, already used, or created for a different email address.
        </p>
        <Link
          href="/app/vault"
          className="inline-block rounded-full bg-app-accent px-6 py-3 text-[12px] uppercase tracking-[0.16em] text-app-on-accent"
        >
          Go to your vault
        </Link>
      </div>
    </main>
  );
}

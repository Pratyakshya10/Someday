"use client";
// The owner's share dialog for a group capsule: a link invite with a
// view/edit role, email invites with roles, and the member list.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MemberView, InviteView, MemberRole } from "../types";
import {
  createLinkInviteAction,
  inviteEmailAction,
  revokeInviteAction,
  setMemberRoleAction,
  removeMemberAction,
} from "../actions";

const roleLabel = (r: MemberRole) => (r === "owner" ? "Owner" : r === "editor" ? "Can edit" : "Can view");

function RoleSelect({ value, onChange, disabled }: { value: MemberRole; onChange: (r: MemberRole) => void; disabled?: boolean }) {
  return (
    <select
      value={value === "viewer" ? "viewer" : "editor"}
      onChange={(e) => onChange(e.target.value as MemberRole)}
      disabled={disabled}
      className="rounded-md border border-app-border bg-app-surface px-2 py-1 text-xs text-app-text outline-none disabled:opacity-50"
    >
      <option value="editor">Can edit</option>
      <option value="viewer">Can view</option>
    </select>
  );
}

export function SharePanel({
  capsuleId,
  members,
  invites,
}: {
  capsuleId: string;
  members: MemberView[];
  invites: InviteView[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [emailRole, setEmailRole] = useState<MemberRole>("editor");
  const [linkRole, setLinkRole] = useState<MemberRole>("editor");
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkInvite = invites.find((i) => i.email === null);
  const emailInvites = invites.filter((i) => i.email !== null && !i.accepted);

  const buildUrl = (token: string) => `${window.location.origin}/app/join/${token}`;

  // Show the existing link once mounted (window is only available client-side).
  useEffect(() => {
    if (!linkInvite) return;
    const kick = setTimeout(() => setLinkUrl(buildUrl(linkInvite.token)), 0);
    return () => clearTimeout(kick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkInvite?.token]);

  const makeLink = () =>
    start(async () => {
      setError(null);
      const res = await createLinkInviteAction(capsuleId, linkRole);
      if (res.ok && res.token) setLinkUrl(buildUrl(res.token));
      router.refresh();
    });

  const copy = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the link is still shown to copy manually */
    }
  };

  const addEmail = () =>
    start(async () => {
      setError(null);
      const res = await inviteEmailAction(capsuleId, email, emailRole);
      if (!res.ok) return setError(res.error ?? "Couldn't add that email.");
      setEmail("");
      router.refresh();
    });

  const revoke = (id: string) => start(async () => { await revokeInviteAction(capsuleId, id); router.refresh(); });
  const changeRole = (userId: string, role: MemberRole) => start(async () => { await setMemberRoleAction(capsuleId, userId, role); router.refresh(); });
  const remove = (userId: string) => start(async () => { await removeMemberAction(capsuleId, userId); router.refresh(); });

  const input = "rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-faint";

  return (
    <div className="rounded-[10px] border border-app-border bg-app-panel p-4 backdrop-blur-xl">
      <div className="mb-3 text-[10.5px] uppercase tracking-[0.2em] text-app-faint">Share this capsule</div>

      {/* invite link */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <RoleSelect value={linkRole} onChange={setLinkRole} disabled={pending} />
          <button onClick={makeLink} disabled={pending} className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs text-app-text hover:bg-black/[0.04] disabled:opacity-50">
            {linkUrl ? "Reset link" : "Create link"}
          </button>
        </div>
        {linkUrl && (
          <div className="flex items-center gap-2">
            <input readOnly value={linkUrl} className={`${input} flex-1 text-[12px]`} onFocus={(e) => e.currentTarget.select()} />
            <button onClick={copy} className="shrink-0 rounded-full bg-app-accent px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-app-on-accent">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* email invite */}
      <div className="mb-4">
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-app-faint">Invite by email</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className={`${input} min-w-0 flex-1`}
          />
          <RoleSelect value={emailRole} onChange={setEmailRole} disabled={pending} />
          <button onClick={addEmail} disabled={pending || !email.trim()} className="rounded-full bg-app-accent px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-app-on-accent disabled:opacity-50">
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-app-accent">{error}</p>}
      </div>

      {/* members */}
      <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-app-faint">People</div>
      <div className="flex flex-col gap-1.5">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-app-text">
              {m.email ?? m.userId.slice(0, 8)} {m.isYou && <span className="text-app-faint">(you)</span>}
            </span>
            {m.role === "owner" ? (
              <span className="text-xs text-app-dim">Owner</span>
            ) : (
              <>
                <RoleSelect value={m.role} onChange={(r) => changeRole(m.userId, r)} disabled={pending} />
                <button onClick={() => remove(m.userId)} disabled={pending} className="text-app-faint hover:text-app-accent" aria-label="Remove">✕</button>
              </>
            )}
          </div>
        ))}
        {emailInvites.map((i) => (
          <div key={i.id} className="flex items-center gap-2 text-sm text-app-dim">
            <span className="min-w-0 flex-1 truncate">{i.email}</span>
            <span className="text-xs">Invited · {roleLabel(i.role)}</span>
            <button onClick={() => revoke(i.id)} disabled={pending} className="text-app-faint hover:text-app-accent" aria-label="Revoke">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

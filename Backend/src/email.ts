// Outbound email via Resend (https://resend.com). Uses the REST API directly
// with fetch so the package needs no extra dependency. Server-only — the API
// key must never reach the browser.

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Send one email. Returns { ok } rather than throwing, so callers can record
 *  a per-message failure without aborting a whole batch. */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Someday <onboarding@resend.dev>";
  if (!key) return { ok: false, error: "RESEND_API_KEY not configured." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `Resend responded ${res.status}` };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error sending email." };
  }
}

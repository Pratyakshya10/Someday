// Delivery — turns a due ScheduledMessage into an email with a private reveal
// link, sends it via Resend, and records the outcome. This is what the cron
// route calls, automatically, on every sweep — there's no manual "send now"
// in this app; a scheduled message just goes out on its own.

import { sendEmail } from "./email";
import { getUserEmail } from "./admin";
import { listDueMessageIds, claimDueMessage, markSent, markFailed, type ScheduledWithRelations } from "./scheduled";

/** Build the reveal URL for a message from a base origin. */
export function revealUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/r/${token}`;
}

/** The email a recipient receives — plain, warm, and link-first. */
function renderEmail(input: {
  recipientName: string;
  senderName: string;
  occasion: string | null;
  url: string;
}): { subject: string; html: string; text: string } {
  const { recipientName, senderName, occasion, url } = input;
  const subject = occasion
    ? `A letter for you — ${occasion}`
    : `${senderName} left you a letter`;

  const text =
    `Hi ${recipientName},\n\n` +
    `${senderName} wrote you a letter and asked Someday to deliver it today` +
    `${occasion ? ` — ${occasion}` : ""}.\n\n` +
    `Open it here: ${url}\n\n— Someday`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!--[if !mso]><!-->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Square+Peg&display=swap">
    <!--<![endif]-->
    <style>
      /* Web fonts render where the client allows them (most non-Outlook
         clients); everywhere else this falls back to the cursive/serif
         stack below, so the email still reads fine either way. */
      .sd-headline { font-family: 'Square Peg', 'Segoe Script', 'Bradley Hand', cursive, Georgia, serif; }
      @media (max-width: 480px) {
        .sd-card { padding: 28px 20px !important; }
        .sd-headline { font-size: 24px !important; }
      }
    </style>
  </head>
  <body style="margin:0;background:#f7ecde;font-family:Georgia,'Times New Roman',serif;color:#2b2621;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="sd-card" style="max-width:520px;background:#fffaf3;border:1px solid #e7dccb;border-radius:16px;padding:40px;">
          <tr><td style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#a99a86;padding-bottom:20px;">Someday</td></tr>
          <tr><td class="sd-headline" style="font-size:28px;line-height:1.3;padding-bottom:16px;">A letter was kept for you${occasion ? `,<br><em>${escapeHtml(occasion)}</em>` : "."}</td></tr>
          <tr><td style="font-size:16px;line-height:1.6;color:#5b5348;padding-bottom:28px;">
            Hi ${escapeHtml(recipientName)}, ${escapeHtml(senderName)} wrote to you a while ago and asked us to hold it until today. It's ready now.
          </td></tr>
          <tr><td>
            <a href="${url}" style="display:inline-block;background:#2b2621;color:#f8f2e8;text-decoration:none;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;padding:14px 28px;border-radius:999px;">Open your letter</a>
          </td></tr>
          <tr><td style="font-size:13px;color:#a99a86;padding-top:28px;line-height:1.5;">
            If the button doesn't work, paste this link into your browser:<br>
            <a href="${url}" style="color:#8a7d68;">${url}</a>
          </td></tr>
        </table>
        <div style="font-size:12px;color:#b3a68f;padding-top:20px;">Sent by Someday on ${escapeHtml(senderName)}'s behalf.</div>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** Send one already-loaded message and record the result. */
export async function deliverMessage(
  msg: ScheduledWithRelations,
  baseUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!msg.contact) return { ok: false, error: "No recipient set." };
  const senderName = (await getUserEmail(msg.ownerId)) ?? "Someone";
  const { subject, html, text } = renderEmail({
    recipientName: msg.contact.name,
    senderName,
    occasion: msg.occasion,
    url: revealUrl(baseUrl, msg.token),
  });

  const res = await sendEmail({ to: msg.contact.email, subject, html, text });
  if (res.ok) {
    await markSent(msg.id, msg.capsuleId, msg.sendAt ?? new Date());
    return { ok: true };
  }
  await markFailed(msg.id);
  return { ok: false, error: res.error };
}

/**
 * Deliver every message that's due. Each one is claimed atomically first
 * (scheduled -> sending) so this is safe to call from a scheduler that fires
 * more often than one run takes to finish, or to have two schedulers hitting
 * it at once — whichever call wins the claim sends it, the rest skip it.
 * Returns a small summary for logging.
 */
export async function deliverDue(baseUrl: string): Promise<{ sent: number; failed: number; total: number }> {
  const ids = await listDueMessageIds();
  let sent = 0;
  let failed = 0;
  for (const id of ids) {
    const msg = await claimDueMessage(id);
    if (!msg) continue; // another run already has this one
    const res = await deliverMessage(msg, baseUrl);
    if (res.ok) sent++;
    else failed++;
  }
  return { sent, failed, total: ids.length };
}

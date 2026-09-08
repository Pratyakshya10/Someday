// Cron endpoint — delivers every scheduled message whose time has come.
//
// A scheduler (Vercel Cron, GitHub Actions, cron-job.org, …) hits this on an
// interval. It's protected by a shared secret so only the scheduler can trigger
// sends. The reveal links are built from this request's own origin.

import { deliverDue } from "@someday/backend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed until configured
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // Also allow ?secret= for schedulers that can't set headers.
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

async function run(req: Request): Promise<Response> {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Prefer the public app URL if set; otherwise use the request's own origin.
  const baseUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const summary = await deliverDue(baseUrl);
  return Response.json({ ok: true, ...summary });
}

export const GET = run;
export const POST = run;

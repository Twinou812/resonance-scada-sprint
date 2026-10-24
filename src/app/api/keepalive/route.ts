import { createClient } from "@supabase/supabase-js";

// Called once a day by the Vercel cron in vercel.json. A real query against
// telemetry_state counts as database activity, which keeps the free-tier
// Supabase project from pausing after a week without visitors.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "",
  );

  const { data, error } = await supabase
    .from("telemetry_state")
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, row: data?.id ?? null, at: new Date().toISOString() });
}

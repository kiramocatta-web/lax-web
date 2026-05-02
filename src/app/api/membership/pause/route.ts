// src/app/api/membership/pause/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const MAX_PAUSE_WEEKS_PER_YEAR = 6;

type PauseProfileRow = {
  stripe_subscription_id: string | null;
  membership_status: string | null;
  membership_paused_until: string | null;
  membership_pause_year: number | null;
  membership_pause_weeks_used: number | null;
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST() {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error: profileErr } = await supabase
      .from("profiles")
      .select(
        "stripe_subscription_id,membership_status,membership_paused_until,membership_pause_year,membership_pause_weeks_used"
      )
      .eq("id", user.id)
      .single();

    const profile = data as PauseProfileRow | null;

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: profileErr?.message || "Profile not found" },
        { status: 500 }
      );
    }

    const subscriptionId = profile.stripe_subscription_id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No Stripe subscription found for this member." },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    const pausedUntil = profile.membership_paused_until
      ? new Date(profile.membership_paused_until)
      : null;

    if (pausedUntil && pausedUntil > now) {
      return NextResponse.json(
        { error: `Already paused until ${pausedUntil.toISOString()}` },
        { status: 400 }
      );
    }

    const usedYear = Number(profile.membership_pause_year ?? currentYear);

    const usedCount =
      usedYear === currentYear
        ? Number(profile.membership_pause_weeks_used ?? 0)
        : 0;

    if (usedCount >= MAX_PAUSE_WEEKS_PER_YEAR) {
      return NextResponse.json(
        {
          error: `Pause limit reached (${MAX_PAUSE_WEEKS_PER_YEAR} weeks per year).`,
        },
        { status: 400 }
      );
    }

    const newPausedUntil = addDays(now, 7);
    const resumesAtUnix = Math.floor(newPausedUntil.getTime() / 1000);

    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: "void",
        resumes_at: resumesAtUnix,
      },
    });

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        membership_paused_until: newPausedUntil.toISOString(),
        membership_pause_year: currentYear,
        membership_pause_weeks_used: usedCount + 1,
        membership_status: "paused",
      })
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      membership_paused_until: newPausedUntil.toISOString(),
      membership_pause_year: currentYear,
      membership_pause_weeks_used: usedCount + 1,
      remaining: MAX_PAUSE_WEEKS_PER_YEAR - (usedCount + 1),
    });
  } catch (e: any) {
    console.error("membership pause failed:", e);

    return NextResponse.json(
      { error: e?.message || "Pause failed" },
      { status: 500 }
    );
  }
}
// src/app/api/membership/pause/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_PAUSE_WEEKS_PER_YEAR = 6;

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

    // ✅ Pull the CORRECT pause fields from profiles
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("membership_paused_until,membership_pause_year,membership_pause_weeks_used")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    const pausedUntilRaw = profile?.membership_paused_until ?? null;
    const pausedUntil = pausedUntilRaw ? new Date(pausedUntilRaw) : null;

    // If already paused into the future, block
    if (pausedUntil && pausedUntil > now) {
      return NextResponse.json(
        { error: `Already paused until ${pausedUntil.toISOString()}` },
        { status: 400 }
      );
    }

    const usedYear = Number(profile?.membership_pause_year ?? currentYear);
    const usedCount =
      usedYear === currentYear
        ? Number(profile?.membership_pause_weeks_used ?? 0)
        : 0;

    if (usedCount >= MAX_PAUSE_WEEKS_PER_YEAR) {
      return NextResponse.json(
        { error: `Pause limit reached (${MAX_PAUSE_WEEKS_PER_YEAR} weeks per year).` },
        { status: 400 }
      );
    }

    const newPausedUntil = addDays(now, 7);

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
    return NextResponse.json(
      { error: e?.message || "Pause failed" },
      { status: 500 }
    );
  }
}
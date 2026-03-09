import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-track-secret");

    if (!process.env.TRACKING_SECRET || secret !== process.env.TRACKING_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const path = String(body?.path ?? "").trim() || null;
    const visitorId = String(body?.visitor_id ?? "").trim() || null;

    const { error } = await supabaseAdmin.from("website_clicks").insert({
      path,
      visitor_id: visitorId,
    });

    if (error) {
      console.error("Track click insert failed:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track click route failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
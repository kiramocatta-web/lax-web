import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendComeBackEmail } from "@/lib/email/sendComeBackEmail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      Boolean(adminProfile?.is_admin) ||
      String(adminProfile?.role ?? "").toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const to = String(body?.to ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const bodyText = String(body?.body ?? "").trim();

    if (!to || !subject || !bodyText) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await sendComeBackEmail({
      to,
      subject,
      body: bodyText,
      recipientName: "Test User",
      lastBookingDate: "2026-01-01",
      daysSinceLastBooking: 30,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
    }

    const supabase = await supabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const message = String(body?.message ?? "").trim();

    if (message.length < 5) {
      return NextResponse.json({ error: "Message is too short." }, { status: 400 });
    }

    const to = process.env.LAX_ADMIN_EMAIL || "admin@laxnlounge.com.au";
    const from = process.env.RESEND_FROM || "onboarding@resend.dev";

    await resend.emails.send({
      from,
      to,
      replyTo: user.email ?? undefined,
      subject: `LAX App Support — ${user.email ?? user.id}`,
      text: `From: ${user.email ?? "unknown"} (${user.id})\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
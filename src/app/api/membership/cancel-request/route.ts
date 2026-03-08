import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const adminEmail = process.env.LAX_ADMIN_EMAIL || "kiramocatta@gmail.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const reason = String(body?.reason ?? "").trim();

    if (!reason) {
      return NextResponse.json(
        { error: "Please enter a reason for cancellation." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("full_name, role, membership_plan, membership_status")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: profileErr?.message || "Profile not found" },
        { status: 500 }
      );
    }

    const role = String(profile.role ?? "").toLowerCase();

    if (role === "affiliate") {
      return NextResponse.json(
        { error: "Affiliates cannot submit membership cancellation requests." },
        { status: 403 }
      );
    }

    if (!resend || !resendFromEmail) {
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 }
      );
    }

    const customerName = profile.full_name?.trim() || "Member";
    const customerEmail = user.email ?? "—";

    const emailResult = await resend.emails.send({
      from: resendFromEmail,
      to: [adminEmail],
      replyTo: user.email ? [user.email] : undefined,
      subject: `Membership cancellation request — ${customerName}`,
      text: [
        "A member has submitted a cancellation request.",
        "",
        `Name: ${customerName}`,
        `Email: ${customerEmail}`,
        `User ID: ${user.id}`,
        `Membership plan: ${profile.membership_plan ?? "—"}`,
        `Membership status: ${profile.membership_status ?? "—"}`,
        "",
        "Reason:",
        reason,
      ].join("\n"),
    });

    if ((emailResult as any)?.error) {
      return NextResponse.json(
        { error: (emailResult as any).error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
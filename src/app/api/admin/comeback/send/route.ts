import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendComeBackEmail } from "@/lib/email/sendComeBackEmail";

export const runtime = "nodejs";

type Recipient = {
  id: string;
  email: string;
  name: string | null;
  last_booking_date: string;
  days_since_last_booking: number;
};

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
    const subject = String(body?.subject ?? "").trim();
    const bodyText = String(body?.body ?? "").trim();
    const recipients = Array.isArray(body?.recipients) ? (body.recipients as Recipient[]) : [];

    if (!subject || !bodyText || recipients.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    for (const recipient of recipients) {
      await sendComeBackEmail({
        to: recipient.email,
        subject,
        body: bodyText,
        recipientName: recipient.name,
        lastBookingDate: recipient.last_booking_date,
        daysSinceLastBooking: recipient.days_since_last_booking,
      });
    }

    return NextResponse.json({ ok: true, sent: recipients.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to send comeback emails" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function clean(s: unknown) {
  return String(s ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const message = clean(body?.message);
    const email = clean(body?.email);
    const anonymous = Boolean(body?.anonymous);
    const page = clean(body?.page);

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // If not anonymous, we require an email (either from logged-in user or manual input)
    if (!anonymous && !email) {
      return NextResponse.json({ error: "Email is required (or send anonymously)." }, { status: 400 });
    }

    const toEmail = "admin@laxnlounge.com.au";
    const fromEmail = process.env.RESEND_FROM_EMAIL; // e.g. "LAX <noreply@yourdomain.com>"

    if (!process.env.RESEND_API_KEY || !fromEmail) {
      return NextResponse.json(
        { error: "Server email not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL)." },
        { status: 500 }
      );
    }

    const subject = anonymous
      ? "LAX Contact — Anonymous message"
      : `LAX Contact — ${email}`;

    const text = [
      anonymous ? "From: Anonymous" : `From: ${email}`,
      page ? `Page: ${page}` : "",
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      text,
      // Optional: set reply-to so you can reply directly when not anonymous
      replyTo: anonymous ? undefined : email,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to send" }, { status: 500 });
  }
}
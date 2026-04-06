import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function getFromEmail() {
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "LAX N LOUNGE <admin@laxnlounge.com.au>"
  );
}

export async function sendBookingEmail(args: {
  to: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  peopleCount: number;
}) {
  const resend = getResend();
  const from = getFromEmail();

  const { data, error } = await resend.emails.send({
    from,
    to: args.to,
    subject: "Lax N Lounge — Booking Confirmed ✅",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Booking Confirmed ✅</h2>
        <p><b>Date:</b> ${args.bookingDate}</p>
        <p><b>Time:</b> ${args.startTime.slice(0, 5)} – ${args.endTime.slice(0, 5)}</p>
        <p><b>People:</b> ${args.peopleCount}</p>
        ${args.durationMinutes ? `<p><b>Duration:</b> ${args.durationMinutes} mins</p>` : ""}
        <p style="margin-top:16px;">See you soon 👑</p>
      </div>
    `,
  });

  if (error) {
    console.error("sendBookingEmail Resend error:", error);
    throw new Error(error.message || "Failed to send booking confirmation");
  }

  console.log("sendBookingEmail success:", data);
}

export async function sendComeBackEmail(args: {
  to: string;
  subject: string;
  body: string;
  recipientName?: string | null;
  lastBookingDate?: string | null;
  daysSinceLastBooking?: number | null;
}) {
  const resend = getResend();
  const from = getFromEmail();

  const personalizedBody = args.body
    .replaceAll("{{name}}", args.recipientName || "there")
    .replaceAll("{{last_booking_date}}", args.lastBookingDate || "—")
    .replaceAll(
      "{{days_since_last_booking}}",
      args.daysSinceLastBooking != null ? String(args.daysSinceLastBooking) : "—"
    );

  const { data, error } = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <div style="white-space:pre-wrap">${personalizedBody}</div>
      </div>
    `,
  });

  if (error) {
    console.error("sendComeBackEmail Resend error:", error);
    throw new Error(error.message || "Failed to send comeback email");
  }

  console.log("sendComeBackEmail success:", data);
}
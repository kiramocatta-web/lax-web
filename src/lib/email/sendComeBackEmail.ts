import { Resend } from "resend";

export async function sendComeBackEmail(args: {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  recipientName?: string | null;
  lastBookingDate?: string | null;
  daysSinceLastBooking?: number | null;
}) {

  const resend = new Resend(process.env.RESEND_API_KEY);

  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "LAX N LOUNGE <bookings@laxnlounge.com.au>";

  const personalizedBody = args.body
    .replaceAll("{{name}}", args.recipientName || "there")
    .replaceAll("{{last_booking_date}}", args.lastBookingDate || "—")
    .replaceAll(
      "{{days_since_last_booking}}",
      args.daysSinceLastBooking != null ? String(args.daysSinceLastBooking) : "—"
    );

  await resend.emails.send({
  from,
  to: args.to,
  subject: args.subject,
  html: args.isHtml
    ? personalizedBody
    : `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <div style="white-space:pre-wrap">${personalizedBody}</div>
      </div>
    `,
});
}
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
  bookingId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  customerEmail: string | null;
  customerPhone: string | null;
  totalAmountCents: number | null;
  rescheduled?: boolean;
};

function formatMoney(cents: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export async function sendAdminBookingNotification({
  bookingId,
  bookingDate,
  startTime,
  endTime,
  peopleCount,
  customerEmail,
  customerPhone,
  totalAmountCents,
  rescheduled = false,
}: Props) {
  const to = process.env.BOOKING_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!to) throw new Error("Missing BOOKING_NOTIFICATION_EMAIL");
  if (!from) throw new Error("Missing RESEND_FROM_EMAIL");

  const subject = rescheduled
    ? `Rescheduled booking – ${bookingDate} ${startTime}`
    : `New booking – ${bookingDate} ${startTime}`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${rescheduled ? "Booking rescheduled" : "New booking made"}</h2>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Date:</strong> ${bookingDate}</p>
        <p><strong>Time:</strong> ${startTime} – ${endTime}</p>
        <p><strong>People:</strong> ${peopleCount}</p>
        <p><strong>Customer email:</strong> ${customerEmail ?? "—"}</p>
        <p><strong>Customer phone:</strong> ${customerPhone ?? "—"}</p>
        <p><strong>Amount paid:</strong> ${formatMoney(totalAmountCents)}</p>
      </div>
    `,
  });

  if (error) {
    console.error("sendAdminBookingNotification Resend error:", error);
    throw new Error(error.message || "Failed to send admin booking notification");
  }

  console.log("sendAdminBookingNotification success:", data);
}
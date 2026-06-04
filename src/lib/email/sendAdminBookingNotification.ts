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

function formatDateDM(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-");
  if (!year || !month || !day) return date;
  return `${day}-${month}`;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

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

  if (!to || !from) {
    console.warn("Missing BOOKING_NOTIFICATION_EMAIL or RESEND_FROM_EMAIL");
    return;
  }

  const cleanDate = formatDateDM(bookingDate);
  const cleanStart = formatTime(startTime);
  const cleanEnd = formatTime(endTime);

  const subject = rescheduled
    ? `Booking Rescheduled - ${cleanStart} ${peopleCount} people ${cleanDate}`
    : `Booking Confirmed - ${cleanStart} ${peopleCount} people ${cleanDate}`;

  await resend.emails.send({
    from,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;">
        <h2>${rescheduled ? "Booking Rescheduled" : "New Booking Confirmed"}</h2>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Date:</strong> ${cleanDate}</p>
        <p><strong>Time:</strong> ${cleanStart} - ${cleanEnd}</p>
        <p><strong>People:</strong> ${peopleCount}</p>
        <p><strong>Email:</strong> ${customerEmail ?? "—"}</p>
        <p><strong>Phone:</strong> ${customerPhone ?? "—"}</p>
        <p><strong>Total:</strong> ${formatMoney(totalAmountCents)}</p>
      </div>
    `,
  });
}
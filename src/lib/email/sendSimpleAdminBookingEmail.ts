import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
  bookingId: number;
  customerName?: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  totalAmountCents: number | null;
  discountCode?: string | null;
};

function money(cents: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export async function sendSimpleAdminBookingEmail({
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  bookingDate,
  startTime,
  endTime,
  peopleCount,
  totalAmountCents,
  discountCode,
}: Props) {
  if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

  const from =
    process.env.RESEND_FROM_EMAIL ||
    "LAX N LOUNGE <bookings@laxnlounge.com.au>";

  const to =
    process.env.BOOKING_NOTIFICATION_EMAIL ||
    process.env.LAX_ADMIN_EMAIL ||
    "admin@laxnlounge.com.au";

  const subject = `New booking confirmed — ${bookingDate} ${startTime.slice(
    0,
    5
  )}`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>New Booking Confirmed</h2>

        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Name:</strong> ${customerName || "—"}</p>
        <p><strong>Email:</strong> ${customerEmail || "—"}</p>
        <p><strong>Phone:</strong> ${customerPhone || "—"}</p>

        <hr />

        <p><strong>Date:</strong> ${bookingDate}</p>
        <p><strong>Time:</strong> ${startTime.slice(0, 5)} – ${endTime.slice(
      0,
      5
    )}</p>
        <p><strong>People:</strong> ${peopleCount}</p>
        <p><strong>Payment:</strong> ${money(totalAmountCents)}</p>
        <p><strong>Discount code:</strong> ${discountCode || "None"}</p>

        <hr />

        <p style="color:#666;">Sent automatically from LAX N LOUNGE.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Simple admin booking email failed:", error);
    throw new Error(error.message || "Admin booking email failed");
  }

  console.log("Simple admin booking email sent:", data);
}
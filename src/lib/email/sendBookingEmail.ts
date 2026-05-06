import { Resend } from "resend";
import { bookingConfirmedTemplate } from "./templates/bookingConfirmed";
import { renderTemplate } from "./templates/renderTemplate";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  return new Resend(process.env.RESEND_API_KEY);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "LAX N LOUNGE <admin@laxnlounge.com.au>";
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

  const html = renderTemplate(bookingConfirmedTemplate, {
    BOOKING_DATE: args.bookingDate,
    START_TIME: args.startTime.slice(0, 5),
    END_TIME: args.endTime.slice(0, 5),
    PEOPLE_COUNT: args.peopleCount,
    BOOK_URL: "https://www.laxnlounge.com.au/book",
  });

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: args.to,
    subject: "Lax N Lounge — Booking Confirmed ✅",
    html,
  });

  if (error) throw new Error(error.message);
}
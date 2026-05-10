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


const d = new Date(args.bookingDate);
const day = d.getDate();

const suffix =
  day % 10 === 1 && day !== 11
    ? "st"
    : day % 10 === 2 && day !== 12
    ? "nd"
    : day % 10 === 3 && day !== 13
    ? "rd"
    : "th";

const weekday = d.toLocaleDateString("en-AU", {
  weekday: "long",
});

const month = d.toLocaleDateString("en-AU", {
  month: "long",
});

const formattedDate = `${weekday} ${day}${suffix} ${month}`;

  const html = renderTemplate(bookingConfirmedTemplate, {
  BOOKING_DATE_FORMATTED: formattedDate,
  START_TIME: args.startTime.slice(0, 5),
  END_TIME: args.endTime.slice(0, 5),
  DURATION_MINUTES: args.durationMinutes ?? "",
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
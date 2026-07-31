import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendAdminBookingNotification } from "@/lib/email/sendAdminBookingNotification";
import { sendBookingEmail } from "@/lib/email/sendBookingEmail";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const OPEN_HOUR = 5;
const CLOSE_HOUR = 22;
const INTERVAL = 15;
const MAX_CAPACITY = 8;

type BookingRow = {
  id?: number;
  start_time: string;
  end_time: string | null;
  people_count: number;
};

type BookingBlockRow = {
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":");

  return Number(hours) * 60 + Number(minutes);
}

function minutesToHHMMSS(totalMinutes: number) {
  const hours = String(
    Math.floor(totalMinutes / 60)
  ).padStart(2, "0");

  const minutes = String(
    totalMinutes % 60
  ).padStart(2, "0");

  return `${hours}:${minutes}:00`;
}

function isFutureDate(value: string | null) {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function getBookingStartDateTime(
  bookingDate: string,
  startTime: string
) {
  /*
   * The venue operates in Brisbane time.
   * Brisbane is UTC+10 year-round.
   */
  return new Date(`${bookingDate}T${startTime}+10:00`);
}

function formatExpiryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const bookingDate: string | undefined =
      body?.booking_date;

    const startMinute: number | undefined =
      body?.start_minute;

    const durationMinutes: number | undefined =
      body?.duration_minutes;

    const rescheduleBookingId =
      Number(body?.reschedule_booking_id ?? 0) || null;

    const peopleCount = 1;

    if (
      !bookingDate ||
      typeof startMinute !== "number" ||
      !durationMinutes
    ) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      return NextResponse.json(
        { error: "Invalid booking date" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(startMinute) ||
      startMinute < 0 ||
      startMinute >= 1440
    ) {
      return NextResponse.json(
        { error: "Invalid start time" },
        { status: 400 }
      );
    }

    if (![60, 90, 120].includes(durationMinutes)) {
      return NextResponse.json(
        { error: "Invalid duration" },
        { status: 400 }
      );
    }

   const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select(
    "role,phone,full_name,membership_plan,membership_status,membership_expires_at,membership_paused_until"
  )
  .eq("id", user.id)
  .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            profileError?.message ||
            "Profile not found",
        },
        { status: 500 }
      );
    }

    if (!profile.phone) {
      return NextResponse.json(
        {
          error:
            "Phone number is required. Please update your profile.",
        },
        { status: 400 }
      );
    }

    const role = String(
      profile.role ?? ""
    ).toLowerCase();

    const membershipPlan = String(
      profile.membership_plan ?? ""
    ).toLowerCase();

    let membershipStatus = String(
      profile.membership_status ?? "inactive"
    ).toLowerCase();

    const membershipExpiresAt =
      profile.membership_expires_at ?? null;

    const activeMembershipStatuses = [
      "active",
      "trialing",
      "cancellation_requested",
    ];

    const recurringWeeklyPlans = [
  "weekly",
  "secret_weekly_15",
];

const isRecurringWeekly =
  recurringWeeklyPlans.includes(
    membershipPlan
  );

    const isFixedDurationPlan =
      membershipPlan === "pass7" ||
      membershipPlan === "monthly" ||
      membershipPlan === "gift_weekly" ||
      membershipPlan === "gift_monthly";

    let packageCreditId: string | null = null;

    const openMinute = OPEN_HOUR * 60;
    const closeMinute = CLOSE_HOUR * 60;
    const endMinute = startMinute + durationMinutes;

    if (
      startMinute < openMinute ||
      startMinute >= closeMinute
    ) {
      return NextResponse.json(
        { error: "Outside opening hours" },
        { status: 400 }
      );
    }

    if (endMinute > closeMinute) {
      return NextResponse.json(
        { error: "Booking exceeds closing time" },
        { status: 400 }
      );
    }

    if (startMinute % INTERVAL !== 0) {
      return NextResponse.json(
        {
          error:
            "Start time must be 15-minute aligned",
        },
        { status: 400 }
      );
    }

    const startTime =
      minutesToHHMMSS(startMinute);

    const endTime =
      minutesToHHMMSS(endMinute);

    const requestedBookingStart =
      getBookingStartDateTime(
        bookingDate,
        startTime
      );

    if (
      Number.isNaN(requestedBookingStart.getTime()) ||
      requestedBookingStart.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "Please choose a future booking time.",
        },
        { status: 400 }
      );
    }

    if (role !== "affiliate") {
      const pausedUntil =
        profile.membership_paused_until ?? null;

      if (isFutureDate(pausedUntil)) {
        return NextResponse.json(
          {
            error:
              "Your membership is currently paused.",
            paused_until: pausedUntil,
          },
          { status: 403 }
        );
      }

      /*
       * Clear a pause that has already finished.
       *
       * Only recurring weekly memberships should
       * automatically return to active here.
       */
      if (pausedUntil && !isFutureDate(pausedUntil)) {
        const pauseUpdate: {
          membership_paused_until: null;
          membership_status?: string;
        } = {
          membership_paused_until: null,
        };

        if (isRecurringWeekly) {
          pauseUpdate.membership_status = "active";
          membershipStatus = "active";
        }

        await supabase
          .from("profiles")
          .update(pauseUpdate)
          .eq("id", user.id);
      }

      const {
        data: activePackageCredit,
        error: packageCreditError,
      } = await supabase
        .from("package_credits")
        .select("id,remaining_sessions")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("remaining_sessions", 0)
        .order("purchased_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (packageCreditError) {
        return NextResponse.json(
          { error: packageCreditError.message },
          { status: 500 }
        );
      }

      const hasPackageCredit =
        Boolean(activePackageCredit?.id);

      let hasTimedMembershipAccess = false;

      if (isRecurringWeekly) {
        hasTimedMembershipAccess =
          activeMembershipStatuses.includes(
            membershipStatus
          ) ||
          (
            ["cancelled", "canceled"].includes(
              membershipStatus
            ) &&
            isFutureDate(membershipExpiresAt)
          );
      } else if (isFixedDurationPlan) {
        hasTimedMembershipAccess =
          activeMembershipStatuses.includes(
            membershipStatus
          ) &&
          isFutureDate(membershipExpiresAt);
      }

      if (
        !hasTimedMembershipAccess &&
        !hasPackageCredit
      ) {
        if (
          isFixedDurationPlan &&
          !isFutureDate(membershipExpiresAt)
        ) {
          await supabase
            .from("profiles")
            .update({
              membership_status: "inactive",
              membership_paused_until: null,
              stripe_subscription_id: null,
              stripe_current_period_end: null,
            })
            .eq("id", user.id);
        }

        return NextResponse.json(
          {
            error:
              "No active membership or package credits. Please purchase access to book.",
          },
          { status: 403 }
        );
      }

      /*
       * Fixed-duration plans cannot create a booking
       * that starts at or after their access expiry.
       */
      if (
        isFixedDurationPlan &&
        membershipExpiresAt
      ) {
        const expiryTimestamp =
          new Date(membershipExpiresAt).getTime();

        if (
          !Number.isFinite(expiryTimestamp) ||
          requestedBookingStart.getTime() >=
            expiryTimestamp
        ) {
          return NextResponse.json(
            {
              error: `Your access expires on ${formatExpiryDate(
                membershipExpiresAt
              )}. Please select an earlier booking.`,
              membership_expires_at:
                membershipExpiresAt,
            },
            { status: 403 }
          );
        }
      }

      /*
       * A reschedule does not use another package
       * session. A new booking does.
       */
      if (
        !rescheduleBookingId &&
        hasPackageCredit
      ) {
        packageCreditId =
          activePackageCredit?.id ?? null;
      }
    }

    let existingBookingToReschedule:
      | {
          id: number;
          booking_type: string | null;
          status: string | null;
          booking_date: string | null;
          start_time: string | null;
          user_id: string;
        }
      | null = null;

    if (rescheduleBookingId) {
      const {
        data: existingBooking,
        error: existingBookingError,
      } = await supabase
        .from("bookings")
        .select(
  "id,booking_type,status,booking_date,start_time,user_id"
)
        .eq("id", rescheduleBookingId)
        .eq("user_id", user.id)
        .single();

      if (
        existingBookingError ||
        !existingBooking
      ) {
        return NextResponse.json(
          {
            error:
              "Original booking not found.",
          },
          { status: 404 }
        );
      }

      if (
        String(
          existingBooking.booking_type ?? ""
        ).toLowerCase() !== "member"
      ) {
        return NextResponse.json(
          {
            error:
              "Only member bookings can be rescheduled here.",
          },
          { status: 403 }
        );
      }

      if (
        ["cancelled", "rescheduled"].includes(
          String(
            existingBooking.status ?? ""
          ).toLowerCase()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "This booking can no longer be rescheduled.",
          },
          { status: 400 }
        );
      }

      if (
        !existingBooking.booking_date ||
        !existingBooking.start_time
      ) {
        return NextResponse.json(
          {
            error:
              "Original booking is missing date/time.",
          },
          { status: 400 }
        );
      }

      const existingStart =
        getBookingStartDateTime(
          existingBooking.booking_date,
          existingBooking.start_time
        );

      if (
        Number.isNaN(existingStart.getTime()) ||
        existingStart.getTime() <= Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "Past bookings cannot be rescheduled.",
          },
          { status: 400 }
        );
      }

      existingBookingToReschedule =
        existingBooking;
    }

    const {
      data: blockRows,
      error: blockError,
    } = await supabase
      .from("booking_blocks")
      .select(
        "is_full_day,start_time,end_time,reason"
      )
      .eq("block_date", bookingDate);

    if (blockError) {
      return NextResponse.json(
        { error: blockError.message },
        { status: 500 }
      );
    }

    const blocks =
      (blockRows ?? []) as BookingBlockRow[];

    for (const block of blocks) {
      if (block.is_full_day) {
        return NextResponse.json(
          {
            error: block.reason
              ? `This date is blocked: ${block.reason}`
              : "This date is unavailable.",
          },
          { status: 409 }
        );
      }

      if (
        !block.start_time ||
        !block.end_time
      ) {
        continue;
      }

      const blockStart =
        timeToMinutes(block.start_time);

      const blockEnd =
        timeToMinutes(block.end_time);

      const overlaps =
        blockStart < endMinute &&
        blockEnd > startMinute;

      if (overlaps) {
        return NextResponse.json(
          {
            error: block.reason
              ? `This time is blocked: ${block.reason}`
              : "This time is unavailable.",
          },
          { status: 409 }
        );
      }
    }

    const {
      data: bookingRows,
      error: bookingFetchError,
    } = await supabase
      .from("bookings")
      .select(
        "id,start_time,end_time,people_count"
      )
      .eq("booking_date", bookingDate)
      .or("status.is.null,status.neq.cancelled")
      .lt("start_time", endTime)
      .gt("end_time", startTime);

    if (bookingFetchError) {
      return NextResponse.json(
        { error: bookingFetchError.message },
        { status: 500 }
      );
    }

    const bookings =
      (bookingRows ?? []) as BookingRow[];

    for (
      let minute = startMinute;
      minute < endMinute;
      minute += INTERVAL
    ) {
      const slotStart = minute;
      const slotEnd = minute + INTERVAL;

      let usedCapacity = 0;

      for (const booking of bookings) {
        if (!booking.end_time) continue;

        if (
          rescheduleBookingId &&
          booking.id === rescheduleBookingId
        ) {
          continue;
        }

        const existingStartMinute =
          timeToMinutes(booking.start_time);

        const existingEndMinute =
          timeToMinutes(booking.end_time);

        if (
          existingStartMinute < slotEnd &&
          existingEndMinute > slotStart
        ) {
          usedCapacity +=
            booking.people_count ?? 1;
        }
      }

      if (
        usedCapacity + peopleCount >
        MAX_CAPACITY
      ) {
        return NextResponse.json(
          {
            error:
              "This time is no longer available. Please choose another slot.",
          },
          { status: 409 }
        );
      }
    }

    const {
      data: insertedBooking,
      error: insertError,
    } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        customer_email: user.email ?? null,
        customer_phone: profile.phone,
        customer_name:
          profile.full_name ?? null,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        people_count: peopleCount,
        booking_type: "member",
        total_amount_cents: 0,
        status: "confirmed",
        rescheduled_from_booking_id:
          existingBookingToReschedule?.id ??
          null,
      })
      .select("id")
      .single();

    if (
      insertError ||
      !insertedBooking
    ) {
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Booking could not be created.",
        },
        { status: 500 }
      );
    }

    console.log(
      "MEMBER BOOKING INSERTED:",
      insertedBooking.id
    );

    /*
     * A package credit should ideally be decremented
     * before sending emails.
     */
    if (packageCreditId) {
      const { error: creditError } =
        await supabase.rpc(
          "decrement_package_credit",
          {
            credit_id: packageCreditId,
          }
        );

      if (creditError) {
        /*
         * Remove the newly inserted booking so the
         * customer does not receive a free package
         * booking when credit deduction fails.
         */
        await supabase
          .from("bookings")
          .delete()
          .eq("id", insertedBooking.id)
          .eq("user_id", user.id);

        return NextResponse.json(
          { error: creditError.message },
          { status: 500 }
        );
      }
    }

    if (existingBookingToReschedule) {
      const { error: oldBookingUpdateError } =
        await supabase
          .from("bookings")
          .update({
            status: "rescheduled",
            rescheduled_to_booking_id:
              insertedBooking.id,
          })
          .eq(
            "id",
            existingBookingToReschedule.id
          )
          .eq("user_id", user.id);

      if (oldBookingUpdateError) {
        return NextResponse.json(
          {
            error:
              oldBookingUpdateError.message,
          },
          { status: 500 }
        );
      }
    }

    if (role === "affiliate") {
      await supabase.rpc(
        "increment_affiliate_visits",
        {
          p_user_id: user.id,
        }
      );
    }

    try {
      await resend.emails.send({
        from:
          "LAX N LOUNGE <bookings@laxnlounge.com.au>",
        to: "admin@laxnlounge.com.au",
        subject:
          `URGENT New member booking #${insertedBooking.id}`,
        text: `
New member booking made.

Booking ID: ${insertedBooking.id}
Date: ${bookingDate}
Time: ${startTime} - ${endTime}
Duration: ${durationMinutes} minutes
People: ${peopleCount}
Email: ${user.email ?? "N/A"}
Phone: ${profile.phone ?? "N/A"}
Name: ${profile.full_name ?? "N/A"}
        `,
      });
    } catch (error) {
      console.error(
        "SIMPLE MEMBER ADMIN EMAIL FAILED:",
        error
      );
    }

    try {
      if (user.email) {
        await sendBookingEmail({
          to: user.email,
          bookingDate,
          startTime,
          endTime,
          peopleCount,
        });
      }
    } catch (error) {
      console.warn(
        "sendBookingEmail failed:",
        error
      );
    }

    try {
      await sendAdminBookingNotification({
        bookingId: insertedBooking.id,
        bookingDate,
        startTime,
        endTime,
        peopleCount,
        customerEmail:
          user.email ?? null,
        customerPhone: profile.phone,
        totalAmountCents: 0,
        rescheduled: Boolean(
          existingBookingToReschedule
        ),
      });
    } catch (error) {
      console.warn(
        "sendAdminBookingNotification failed:",
        error
      );
    }

    return NextResponse.json({
      ok: true,
      booking_id: insertedBooking.id,
      rescheduled: Boolean(
        existingBookingToReschedule
      ),
    });
  } catch (error: any) {
    console.error(
      "BOOKING CREATE FAILED:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Booking failed",
      },
      { status: 500 }
    );
  }
}
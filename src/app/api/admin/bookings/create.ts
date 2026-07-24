import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendAdminBookingNotification } from "@/lib/email/sendAdminBookingNotification";

export const runtime = "nodejs";

const OPEN_HOUR = 5;
const CLOSE_HOUR = 22;
const INTERVAL = 15;
const MAX_CAPACITY = 8;

type BookingRow = {
  start_time: string;
  end_time: string | null;
  people_count: number;
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
            "Profile could not be found.",
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

    /*
     * Affiliates bypass normal membership and
     * package-access checks.
     */
    if (role !== "affiliate") {
      /*
       * Check whether the customer has an active
       * package credit.
       */
      const {
        data: packageCredit,
        error: packageCreditError,
      } = await supabase
        .from("package_credits")
        .select("id,remaining_sessions,status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("remaining_sessions", 0)
        .limit(1)
        .maybeSingle();

      if (packageCreditError) {
        return NextResponse.json(
          { error: packageCreditError.message },
          { status: 500 }
        );
      }

      /*
       * Block customers whose membership is paused.
       */
      const pausedUntilRaw =
        profile.membership_paused_until ?? null;

      if (isFutureDate(pausedUntilRaw)) {
        return NextResponse.json(
          {
            error:
              "Your membership is currently paused.",
            paused_until: pausedUntilRaw,
          },
          { status: 403 }
        );
      }

      /*
       * Clear a pause date that has already passed.
       *
       * Do not automatically change the membership
       * status here because the customer's plan may
       * also have expired.
       */
      if (pausedUntilRaw && !isFutureDate(pausedUntilRaw)) {
        await supabase
          .from("profiles")
          .update({
            membership_paused_until: null,
          })
          .eq("id", user.id);
      }

      const status = String(
        profile.membership_status ?? "inactive"
      ).toLowerCase();

      const membershipPlan = String(
        profile.membership_plan ?? ""
      ).toLowerCase();

      const hasFutureExpiry = isFutureDate(
        profile.membership_expires_at ?? null
      );

      const hasPackageCredit = Boolean(
        packageCredit?.id
      );

      const activeMembershipStatuses = [
        "active",
        "trialing",
        "cancellation_requested",
      ];

      const isFixedDurationPlan =
        membershipPlan === "pass7" ||
        membershipPlan === "monthly";

      let hasMembershipAccess = false;

      /*
       * Fixed-duration plans must have a future
       * expiry date.
       *
       * An active status cannot override an
       * expired 7-day or monthly pass.
       */
      if (isFixedDurationPlan) {
        hasMembershipAccess =
          activeMembershipStatuses.includes(status) &&
          hasFutureExpiry;
      } else {
        /*
         * Ongoing memberships may be active without
         * a fixed expiry.
         *
         * Cancelled memberships retain access only
         * until their paid-through expiry.
         */
        hasMembershipAccess =
          activeMembershipStatuses.includes(status) ||
          (status === "cancelled" && hasFutureExpiry);
      }

      const hasAccess =
        hasMembershipAccess ||
        hasPackageCredit;

      if (!hasAccess) {
        /*
         * Mark expired fixed-duration plans inactive.
         */
        if (isFixedDurationPlan && !hasFutureExpiry) {
          await supabase
            .from("profiles")
            .update({
              membership_status: "inactive",
            })
            .eq("id", user.id);
        }

        let errorMessage =
          "No active membership or package credit. Please purchase access to book.";

        if (
          membershipPlan === "pass7" &&
          !hasFutureExpiry
        ) {
          errorMessage =
            "Your 7-day pass has expired. Please purchase another pass or make a single booking.";
        }

        if (
          membershipPlan === "monthly" &&
          !hasFutureExpiry
        ) {
          errorMessage =
            "Your monthly access has expired. Please renew or make a single booking.";
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => null);

    const bookingDate: string | undefined =
      body?.booking_date;

    const startMinute: number | undefined =
      body?.start_minute;

    const durationMinutes: number | undefined =
      body?.duration_minutes;

    const peopleCount = 1;

    if (
      !bookingDate ||
      typeof startMinute !== "number" ||
      typeof durationMinutes !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (![60, 90, 120].includes(durationMinutes)) {
      return NextResponse.json(
        { error: "Invalid duration" },
        { status: 400 }
      );
    }

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

    const { data: rows, error: bookingFetchError } =
      await supabase
        .from("bookings")
        .select(
          "start_time,end_time,people_count"
        )
        .eq("booking_date", bookingDate)
        .neq("status", "cancelled")
        .lt("start_time", endTime)
        .gt("end_time", startTime);

    if (bookingFetchError) {
      return NextResponse.json(
        { error: bookingFetchError.message },
        { status: 500 }
      );
    }

    const bookings = (rows ?? []) as BookingRow[];

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

        const existingStart =
          timeToMinutes(booking.start_time);

        const existingEnd =
          timeToMinutes(booking.end_time);

        const overlaps =
          existingStart < slotEnd &&
          existingEnd > slotStart;

        if (overlaps) {
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

    /*
     * This value must match the existing database
     * check constraint.
     */
    const bookingType = "single";

    const { data: inserted, error: insertError } =
      await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          people_count: peopleCount,
          booking_type: bookingType,
          customer_phone: profile.phone,
          customer_email: user.email,
          customer_name:
            profile.full_name ?? null,
          total_amount_cents: 0,
          status: "confirmed",
        })
        .select("id")
        .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    if (role === "affiliate") {
      await supabase.rpc(
        "increment_affiliate_visits",
        {
          p_user_id: user.id,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      booking_id: inserted.id,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Booking failed";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
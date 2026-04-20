"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

type ProfileRow = {
  full_name: string | null;
  role: string | null;
  is_admin?: boolean | null;
  membership_plan: string | null;
  membership_status: string | null;
  membership_expires_at: string | null;
  stripe_current_period_end: string | null;
  membership_paused_until: string | null;
  membership_pause_weeks_used: number | null;
  membership_pause_year: number | null;
};

type AffiliateRow = {
  code: string | null;
  used_count: number | null;
  credit_cents: number | null;
  visits_count: number | null;
  is_active: boolean | null;
  agreement_accepted_at: string | null;
  agreement_version: string | null;
  bank_bsb: string | null;
  bank_account: string | null;
};

type BookingRow = {
  id: number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  total_amount_cents: number | null;
  booking_type: string | null;
  status: string | null;
  rescheduled_to_booking_id?: number | null;
  rescheduled_from_booking_id?: number | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtAUDFromCents(cents: number | null | undefined) {
  const safe = Number(cents ?? 0);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(safe / 100);
}

function fmtTime(time: string | null) {
  if (!time) return "—";

  const raw = time.slice(0, 5);
  const [h, m] = raw.split(":").map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) return raw;

  const d = new Date();
  d.setHours(h, m, 0, 0);

  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtLength(
  durationMinutes: number | null,
  start: string | null,
  end: string | null
) {
  if (durationMinutes && durationMinutes > 0) {
    if (durationMinutes % 60 === 0) return `${durationMinutes / 60} hr`;
    return `${durationMinutes} mins`;
  }

  if (!start || !end) return "—";

  const [sh, sm] = start.slice(0, 5).split(":").map(Number);
  const [eh, em] = end.slice(0, 5).split(":").map(Number);

  if ([sh, sm, eh, em].some(Number.isNaN)) return "—";

  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const diff = endMins - startMins;

  if (diff <= 0) return "—";
  if (diff % 60 === 0) return `${diff / 60} hr`;
  return `${diff} mins`;
}

function getBookingStartKey(booking: BookingRow) {
  if (!booking.booking_date || !booking.start_time) return null;

  const datePart = booking.booking_date.slice(0, 10);
  const timePart = booking.start_time.slice(0, 8);

  return `${datePart}T${timePart}`;
}

function getBrisbaneNowKey() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
    "minute"
  )}:${get("second")}`;
}

function membershipStatusCopy(
  membershipStatus: string | null | undefined,
  membershipExpiresAt: string | null | undefined
) {
  const status = String(membershipStatus ?? "").toLowerCase();
  const expires = membershipExpiresAt ? new Date(membershipExpiresAt) : null;
  const now = new Date();

  if (status === "cancellation_requested") {
    return {
      label: "Cancellation requested",
      helper: "Your cancellation request is being reviewed by admin.",
    };
  }

  if (status === "cancelled" || status === "canceled") {
    if (expires && expires.getTime() > now.getTime()) {
      return {
        label: "Cancelled",
        helper: `Access remains active until ${fmtDate(
          membershipExpiresAt ?? null
        )}.`,
      };
    }

    return {
      label: "Cancelled",
      helper: "Your membership has ended.",
    };
  }

  if (status === "paused") {
    return {
      label: "Paused",
      helper: membershipExpiresAt
        ? `Paused until ${fmtDate(membershipExpiresAt)}.`
        : "Your membership is currently paused.",
    };
  }

  if (status === "active") {
    return {
      label: "Active",
      helper: "Your membership is active.",
    };
  }

  if (status === "trialing") {
    return {
      label: "Trialing",
      helper: "Your membership is currently trialing.",
    };
  }

  if (status === "past_due") {
    return {
      label: "Past due",
      helper: "There is an issue with your membership payment.",
    };
  }

  return {
    label: membershipStatus ?? "—",
    helper: "",
  };
}

function BookingCard({
  booking,
  showActions = false,
  onCancel,
  cancelling = false,
}: {
  booking: BookingRow;
  showActions?: boolean;
  onCancel?: (booking: BookingRow) => void;
  cancelling?: boolean;
}) {
  const bookingType = String(booking.booking_type ?? "").toLowerCase();
  const status = String(booking.status ?? "").toLowerCase();
  const canCancel = bookingType === "member" || bookingType === "affiliate";

  const rescheduleHref =
    bookingType === "single"
      ? `/book/single?reschedule_booking_id=${booking.id}`
      : `/book?reschedule_booking_id=${booking.id}`;

  const statusLabel =
    status === "rescheduled"
      ? "Rescheduled"
      : status === "cancelled"
      ? "Cancelled"
      : booking.status ?? "booked";

  return (
    <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-white">
            {fmtDate(booking.booking_date)}
          </div>
          <div className="mt-1 text-sm text-white/70">
            {fmtTime(booking.start_time)}
            {booking.end_time ? ` – ${fmtTime(booking.end_time)}` : ""}
          </div>
        </div>

        <div className="text-right text-sm text-white/60">{statusLabel}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/60">Length</div>
          <div className="mt-1 font-semibold text-white">
            {fmtLength(
              booking.duration_minutes ?? null,
              booking.start_time,
              booking.end_time
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/60">People</div>
          <div className="mt-1 font-semibold text-white">
            {Number(booking.people_count ?? 0)}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/60">Amount</div>
          <div className="mt-1 font-semibold text-white">
            {fmtAUDFromCents(booking.total_amount_cents ?? 0)}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/60">Type</div>
          <div className="mt-1 font-semibold text-white">
            {booking.booking_type ?? "—"}
          </div>
        </div>
      </div>

      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={rescheduleHref}
            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Reschedule
          </a>

          {canCancel ? (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => onCancel?.(booking)}
              className="inline-flex items-center justify-center rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [email, setEmail] = useState("—");
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const [bsb, setBsb] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [savingBankDetails, setSavingBankDetails] = useState(false);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [showCancelRequestSentModal, setShowCancelRequestSentModal] =
    useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingToCancel, setBookingToCancel] = useState<BookingRow | null>(
    null
  );

  const [cancelReason, setCancelReason] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<
    null | "portal" | "pause" | "logout" | "cancel-booking" | "cancel-request"
  >(null);

  async function load() {
    setLoading(true);
    setErr("");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session?.user) {
      setIsLoggedIn(false);
      setProfile(null);
      setAffiliate(null);
      setBookings([]);
      setEmail("—");
      setFullName("");
      setBsb("");
      setAccountNumber("");
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    setEmail(session.user.email ?? "—");

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select(
        [
          "full_name",
          "role",
          "is_admin",
          "membership_plan",
          "membership_status",
          "membership_expires_at",
          "stripe_current_period_end",
          "membership_paused_until",
          "membership_pause_weeks_used",
          "membership_pause_year",
        ].join(",")
      )
      .eq("id", session.user.id)
      .single<ProfileRow>();

    if (profErr || !prof) {
      setErr(profErr?.message || "Profile not found");
      setProfile(null);
      setAffiliate(null);
      setBookings([]);
      setLoading(false);
      return;
    }

    if (prof.is_admin) {
      router.replace("/admin");
      return;
    }

    setProfile(prof);
    setFullName(prof.full_name ?? "");
    setIsEditingName(!(prof.full_name ?? "").trim());

    const role = String(prof.role ?? "").toLowerCase();

    if (role === "affiliate") {
      const { data: aff, error: affErr } = await supabase
        .from("affiliates")
        .select(
          "code,used_count,credit_cents,visits_count,is_active,agreement_accepted_at,agreement_version,bank_bsb,bank_account"
        )
        .eq("user_id", session.user.id)
        .maybeSingle<AffiliateRow>();

      if (affErr) {
        setErr(affErr.message);
        setAffiliate(null);
        setBsb("");
        setAccountNumber("");
      } else {
        setAffiliate(aff ?? null);
        setBsb(aff?.bank_bsb ?? "");
        setAccountNumber(aff?.bank_account ?? "");
      }
    } else {
      setAffiliate(null);
      setBsb("");
      setAccountNumber("");
    }

    const bookingsRes = await fetch("/api/profile/bookings", {
      method: "GET",
      cache: "no-store",
    });

    const bookingsJson = await bookingsRes.json().catch(() => null);

    if (!bookingsRes.ok) {
      setErr(bookingsJson?.error || "Failed to load bookings");
      setBookings([]);
    } else {
      setBookings((bookingsJson?.bookings as BookingRow[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = String(profile?.role ?? "").toLowerCase();
  const isAffiliate = role === "affiliate";

  const hasMembership =
    !!profile?.membership_plan &&
    ["weekly", "pass7"].includes(
      String(profile.membership_plan).toLowerCase()
    );

  const isMember = !isAffiliate && hasMembership;
  const isSingleAccount = !isAffiliate && !isMember;

  const displayName =
    fullName.trim() || (email !== "—" ? email.split("@")[0] : "") || "there";

  const isWeekly = profile?.membership_plan === "weekly";
  const isPass7 = profile?.membership_plan === "pass7";

  const planLabel = isWeekly
    ? "$20 p/w Unlimited"
    : isPass7
    ? "7-Day Pass (Unlimited)"
    : "—";

  const dateLabel = isWeekly ? "Next payment" : "Expiry date";
  const dateValue = isWeekly
    ? fmtDate(profile?.stripe_current_period_end ?? null)
    : fmtDate(profile?.membership_expires_at ?? null);

  const pauseUsed = profile?.membership_pause_weeks_used ?? 0;
  const pauseYear = profile?.membership_pause_year ?? new Date().getFullYear();

  const membershipStatusUI = membershipStatusCopy(
    profile?.membership_status,
    profile?.membership_expires_at
  );

  const membershipExpired =
    !!profile?.membership_expires_at &&
    new Date(profile.membership_expires_at).getTime() <= Date.now();

  const membershipStatusValue = String(
    profile?.membership_status ?? ""
  ).toLowerCase();

  const nowKey = getBrisbaneNowKey();

  const upcomingBookings = [...bookings]
    .filter((booking) => {
      const status = String(booking.status ?? "").toLowerCase();
      if (status !== "confirmed") return false;

      const startKey = getBookingStartKey(booking);
      return startKey ? startKey >= nowKey : false;
    })
    .sort((a, b) => {
      const aKey = getBookingStartKey(a) ?? "";
      const bKey = getBookingStartKey(b) ?? "";
      return aKey.localeCompare(bKey);
    });

  const bookingHistory = [...bookings]
    .filter((booking) => {
      const status = String(booking.status ?? "").toLowerCase();
      const startKey = getBookingStartKey(booking);

      if (status === "cancelled" || status === "rescheduled") return true;
      if (!startKey) return true;

      return startKey < nowKey;
    })
    .sort((a, b) => {
      const aKey = getBookingStartKey(a) ?? "";
      const bKey = getBookingStartKey(b) ?? "";
      return bKey.localeCompare(aKey);
    });

  const enquiryHref = "/profile/enquiry?returnTo=%2Fprofile";

  const saveName = async () => {
    setSavingName(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) throw new Error("Not logged in");

      const trimmed = fullName.trim();

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmed || null })
        .eq("id", user.id);

      if (error) throw error;

      await load();
      setIsEditingName(false);
    } catch (e: any) {
      alert(e?.message || "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const saveBankDetails = async () => {
  setSavingBankDetails(true);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) throw new Error("Not logged in");

    const cleanBsb = bsb.trim() || null;
    const cleanAccount = accountNumber.trim() || null;

    const { data, error } = await supabase
      .from("affiliates")
      .update({
        bank_bsb: cleanBsb,
        bank_account: cleanAccount,
      })
      .eq("user_id", user.id)
      .select("user_id, bank_bsb, bank_account")
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error("No affiliate row was updated.");
    }

    setBsb(data.bank_bsb ?? "");
    setAccountNumber(data.bank_account ?? "");

    alert("Payout details updated");
    console.log("Saved affiliate bank details:", data);

    await load();
  } catch (e: any) {
    alert(e?.message || "Failed to update payout details");
    console.error("saveBankDetails error:", e);
  } finally {
    setSavingBankDetails(false);
  }
};

  const pauseOneWeek = async () => {
    setBusy("pause");

    try {
      const res = await fetch("/api/membership/pause", { method: "POST" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Pause failed");
      }

      await load();
      setShowPauseModal(true);
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setBusy(null);
    }
  };

  const openCustomerPortal = async () => {
    setBusy("portal");

    try {
      const res = await fetch("/api/stripe/customer-portal", { method: "POST" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Couldn’t open portal");
      }

      window.location.href = json.url;
    } catch (e: any) {
      alert(e?.message || "Error");
      setBusy(null);
    }
  };

  const submitCancellationRequest = async () => {
    const trimmedReason = cancelReason.trim();

    if (!trimmedReason) {
      alert("Please enter a reason for cancellation.");
      return;
    }

    setBusy("cancel-request");

    try {
      const res = await fetch("/api/membership/cancel-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: trimmedReason,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Could not submit cancellation request");
      }

      setCancelReason("");
      setShowCancelRequestModal(false);
      await load();
      setShowCancelRequestSentModal(true);
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setBusy(null);
    }
  };

  const cancelBooking = async (booking?: BookingRow) => {
    const targetBooking = booking ?? bookingToCancel;
    if (!targetBooking) return;

    setBusy("cancel-booking");

    try {
      const res = await fetch("/api/profile/bookings/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: targetBooking.id,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to cancel booking");
      }

      setBookingToCancel(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to cancel booking");
    } finally {
      setBusy(null);
    }
  };

  const logout = async () => {
    setBusy("logout");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="mx-auto max-w-xl px-6 py-10 pb-24">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-3xl font-semibold">
            {isLoggedIn
              ? isAffiliate
                ? `Affiliate Profile — ${displayName}`
                : `Welcome, ${displayName}`
              : "Profile"}
          </h1>

          <a
            href={!isLoggedIn || isSingleAccount ? "/book/single" : "/book"}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            Book →
          </a>
        </div>

        {loading ? (
          <div className="mt-6 text-white/70">Loading…</div>
        ) : !isLoggedIn ? (
          <>
            <div className="mt-6 rounded-2xl bg-white/10 p-6 text-center">
              <h2 className="text-2xl font-semibold text-white">
                Want to keep track of your bookings?
              </h2>

              <p className="mt-3 text-white/70">
                Create an account to view your booking history, reschedule
                and manage your details, and keep everything in one place.
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-5">
              <div className="text-sm text-white/70">Create account</div>

              <p className="mt-2 text-white/70">
                Save your details and access your bookings anytime.
              </p>

              <div className="mt-4 grid gap-3">
                <a
                  href="/signup"
                  className="w-full rounded-2xl bg-emerald-600 py-4 text-center text-lg font-semibold text-white transition hover:bg-emerald-500"
                >
                  Create an account
                </a>

                <a
                  href="/login"
                  className="w-full rounded-2xl bg-white/10 py-4 text-center font-semibold text-white transition hover:bg-white/20"
                >
                  Log in
                </a>
              </div>
            </div>
          </>
        ) : err ? (
          <div className="mt-6 text-red-300">{err}</div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <div className="text-sm text-white/70">Signed in as</div>
              <div className="text-lg font-semibold">
                {fullName.trim() || "—"}
              </div>

              {!!fullName.trim() && !isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="mt-1 text-xs text-white/60 underline underline-offset-2 hover:text-white"
                >
                  Edit
                </button>
              )}

              <div className="mt-1 text-sm text-white/60">{email}</div>

              {isEditingName && (
                <div className="mt-5">
                  <label className="text-sm text-white/70">Full name</label>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 rounded-xl bg-white p-3 text-black"
                    />

                    <button
                      disabled={savingName}
                      onClick={saveName}
                      className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {savingName ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {isAffiliate ? (
                <div className="mt-5 grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Active code</span>
                    <span className="font-semibold">
                      {affiliate?.code ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Used code count</span>
                    <span className="font-semibold">
                      {Number(affiliate?.used_count ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Credit</span>
                    <span className="font-semibold">
                      {fmtAUDFromCents(affiliate?.credit_cents ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Times you’ve visited LAX</span>
                    <span className="font-semibold">
                      {Number(affiliate?.visits_count ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Agreement accepted</span>
                    <span className="font-semibold">
                      {affiliate?.agreement_accepted_at ? "Yes" : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Affiliate since</span>
                    <span className="font-semibold">
                      {fmtDate(affiliate?.agreement_accepted_at ?? null)}
                    </span>
                  </div>

                  <div className="mt-2 rounded-2xl bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">
                      Payout details
                    </div>
                    <p className="mt-1 text-xs text-white/60">
                      Add your BSB and account number for affiliate payouts.
                    </p>

                    <div className="mt-4 grid gap-3">
                      <div>
                        <label className="text-sm text-white/70">BSB</label>
                        <input
                          type="text"
                          value={bsb}
                          onChange={(e) => setBsb(e.target.value)}
                          placeholder="123-456"
                          className="mt-2 w-full rounded-xl bg-white p-3 text-black"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-white/70">
                          Account number
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Account number"
                          className="mt-2 w-full rounded-xl bg-white p-3 text-black"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={savingBankDetails}
                        onClick={saveBankDetails}
                        className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {savingBankDetails
                          ? "Saving..."
                          : "Save payout details"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <a
                      href="/affiliate-agreement"
                      className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      View Affiliate Agreement
                    </a>
                  </div>
                </div>
              ) : isMember ? (
                <div className="mt-5 grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Membership</span>
                    <span className="font-semibold">{planLabel}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Status</span>
                    <span className="font-semibold">
                      {membershipStatusUI.label}
                    </span>
                  </div>

                  {membershipStatusUI.helper ? (
                    <div className="rounded-xl bg-white/5 px-3 py-3 leading-relaxed text-white/75">
                      {membershipStatusUI.helper}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">{dateLabel}</span>
                    <span className="font-semibold">{dateValue}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Paused until</span>
                    <span className="font-semibold">
                      {fmtDate(profile?.membership_paused_until ?? null)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">
                      Pause weeks used ({pauseYear})
                    </span>
                    <span className="font-semibold">{pauseUsed} / 6</span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Account type</span>
                    <span className="font-semibold">Single booking account</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Bookings</span>
                    <span className="font-semibold">{bookings.length} total</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              {isAffiliate ? (
                <>
                  <a
                    href={enquiryHref}
                    className="w-full rounded-2xl bg-white/10 py-4 text-center font-semibold text-white transition hover:bg-white/20"
                  >
                    Send us a message
                  </a>
                </>
              ) : isMember ? (
                <>
                  <button
                    disabled={busy !== null}
                    onClick={openCustomerPortal}
                    className="w-full rounded-2xl bg-emerald-600 py-4 text-lg font-semibold text-white disabled:opacity-50"
                  >
                    {busy === "portal" ? "Opening…" : "Update card details"}
                  </button>

                  <button
                    disabled={
                      busy !== null ||
                      pauseUsed >= 6 ||
                      membershipStatusValue === "cancelled" ||
                      membershipStatusValue === "canceled" ||
                      membershipExpired
                    }
                    onClick={pauseOneWeek}
                    className="w-full rounded-2xl bg-emerald-800 py-4 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy === "pause" ? "Pausing…" : "Pause 1 Week"}
                  </button>

                  {membershipStatusValue === "cancellation_requested" ? (
                    <div className="w-full rounded-2xl bg-white/5 py-4 text-center font-semibold text-white/70">
                      Cancellation request sent. Admin will review it shortly.
                    </div>
                  ) : (membershipStatusValue === "cancelled" ||
                      membershipStatusValue === "canceled") &&
                    membershipExpired ? (
                    <a
                      href="/membership"
                      className="w-full rounded-2xl bg-white/10 py-4 text-center font-semibold text-white transition hover:bg-white/20"
                    >
                      Want to re-sign up?
                    </a>
                  ) : (
                    <button
                      disabled={busy !== null || membershipExpired}
                      onClick={() => setShowCancelRequestModal(true)}
                      className="w-full rounded-2xl bg-red-500/10 py-4 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Send cancellation request
                    </button>
                  )}

                  <a
                    href={enquiryHref}
                    className="w-full rounded-2xl bg-white/10 py-4 text-center font-semibold text-white transition hover:bg-white/20"
                  >
                    Send us a message
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/book/single"
                    className="w-full rounded-2xl bg-emerald-600 py-4 text-center text-lg font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Book another session
                  </a>

                  <a
                    href={enquiryHref}
                    className="w-full rounded-2xl bg-white/10 py-4 text-center font-semibold text-white transition hover:bg-white/20"
                  >
                    Send us a message
                  </a>
                </>
              )}

              <button
                disabled={busy !== null}
                onClick={logout}
                className="w-full py-4 text-sm text-white/70 hover:text-white"
              >
                Log out
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Upcoming bookings</h2>
                <span className="text-sm text-white/60">
                  {upcomingBookings.length} upcoming
                </span>
              </div>

              {upcomingBookings.length === 0 ? (
                <p className="mt-4 text-white/60">No upcoming bookings.</p>
              ) : (
                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      showActions={true}
                      onCancel={(nextBooking) => setBookingToCancel(nextBooking)}
                      cancelling={busy === "cancel-booking"}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Booking history</h2>
                <span className="text-sm text-white/60">
                  {bookingHistory.length} total
                </span>
              </div>

              {bookingHistory.length === 0 ? (
                <p className="mt-4 text-white/60">No past bookings yet.</p>
              ) : (
                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {bookingHistory.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-emerald-950 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold text-white">
              Membership Paused
            </h2>

            <p className="mt-4 leading-relaxed text-white/80">
              Take care, we will miss you, but see you when you come back.
            </p>

            <button
              onClick={() => setShowPauseModal(false)}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              × Close
            </button>
          </div>
        </div>
      )}

      {showCancelRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-emerald-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white">
              Cancellation request
            </h2>

            <p className="mt-3 leading-relaxed text-white/75">
              Please let us know why you’d like to cancel your membership. This
              request will be sent to admin for review.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={5}
              placeholder="Reason for cancellation..."
              className="mt-5 w-full rounded-2xl bg-white p-3 text-black"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy === "cancel-request"}
                onClick={() => {
                  setShowCancelRequestModal(false);
                  setCancelReason("");
                }}
                className="rounded-xl bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                disabled={busy === "cancel-request"}
                onClick={submitCancellationRequest}
                className="rounded-xl bg-red-500/10 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {busy === "cancel-request" ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelRequestSentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-emerald-950 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold text-white">Request Sent</h2>

            <p className="mt-4 leading-relaxed text-white/80">
              Your cancellation request has been sent to admin. We will review
              it shortly.
            </p>

            <button
              onClick={() => setShowCancelRequestSentModal(false)}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              × Close
            </button>
          </div>
        </div>
      )}

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-[320px] rounded-2xl border border-white/10 bg-emerald-950 p-6 text-center shadow-2xl">
            <h2 className="text-xl font-semibold text-white">
              Cancel this booking?
            </h2>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={busy === "cancel-booking"}
                onClick={() => setBookingToCancel(null)}
                className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                No
              </button>

              <button
                type="button"
                disabled={busy === "cancel-booking"}
                onClick={() => cancelBooking()}
                className="rounded-xl bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {busy === "cancel-booking" ? "Cancelling…" : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
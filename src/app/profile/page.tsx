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
  membershipExpiresAt: string | null | undefined,
  membershipPausedUntil?: string | null
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
      helper: membershipPausedUntil
        ? `Paused until ${fmtDate(membershipPausedUntil)}.`
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

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-[#f6eadb]/10 bg-[#2d221e]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f6eadb]/10 py-3 last:border-b-0">
      <span className="text-sm text-[#d8c6b4]/70">{label}</span>
      <span className="text-right text-sm font-semibold text-[#fff7ec]">
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  href,
  variant = "neutral",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  variant?: "primary" | "neutral" | "warning" | "danger";
}) {
  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-500 disabled:hover:bg-emerald-600",
    neutral:
      "bg-[#4b3932] text-[#fff7ec] hover:bg-[#5a453d] disabled:hover:bg-[#4b3932]",
    warning:
      "bg-[#74503d] text-[#fff7ec] hover:bg-[#845c47] disabled:hover:bg-[#74503d]",
    danger:
      "bg-[#4a1717] text-red-200 hover:bg-[#5a1d1d] disabled:hover:bg-[#4a1717]",
  } as const;

  const className = `inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`;

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function SidebarItem({
  label,
  active = false,
  href,
}: {
  label: string;
  active?: boolean;
  href?: string;
}) {
  const className = `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
    active
      ? "bg-[#f6eadb] text-[#21130f]"
      : "text-[#d8c6b4]/75 hover:bg-[#3a2a24] hover:text-[#fff7ec]"
  }`;

  if (href) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return <div className={className}>{label}</div>;
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
    <div className="rounded-3xl border border-[#f6eadb]/10 bg-[#1c120f]/35 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-[#fff7ec]">
            {fmtDate(booking.booking_date)}
          </div>
          <div className="mt-1 text-sm text-[#d8c6b4]/70">
            {fmtTime(booking.start_time)}
            {booking.end_time ? ` – ${fmtTime(booking.end_time)}` : ""}
          </div>
        </div>

        <div className="rounded-full bg-[#f6eadb]/10 px-3 py-1 text-xs font-semibold text-[#d8c6b4]">
          {statusLabel}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-2xl bg-[#f6eadb]/5 p-3">
          <div className="text-[#d8c6b4]/60">Length</div>
          <div className="mt-1 font-semibold text-[#fff7ec]">
            {fmtLength(booking.duration_minutes ?? null, booking.start_time, booking.end_time)}
          </div>
        </div>

        <div className="rounded-2xl bg-[#f6eadb]/5 p-3">
          <div className="text-[#d8c6b4]/60">People</div>
          <div className="mt-1 font-semibold text-[#fff7ec]">
            {Number(booking.people_count ?? 0)}
          </div>
        </div>

        <div className="rounded-2xl bg-[#f6eadb]/5 p-3">
          <div className="text-[#d8c6b4]/60">Amount</div>
          <div className="mt-1 font-semibold text-[#fff7ec]">
            {fmtAUDFromCents(booking.total_amount_cents ?? 0)}
          </div>
        </div>

        <div className="rounded-2xl bg-[#f6eadb]/5 p-3">
          <div className="text-[#d8c6b4]/60">Type</div>
          <div className="mt-1 font-semibold text-[#fff7ec]">
            {booking.booking_type ?? "—"}
          </div>
        </div>
      </div>

      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={rescheduleHref}
            className="inline-flex items-center justify-center rounded-2xl bg-[#f6eadb]/10 px-4 py-2 text-sm font-semibold text-[#fff7ec] transition hover:bg-[#f6eadb]/15"
          >
            Reschedule
          </a>

          {canCancel ? (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => onCancel?.(booking)}
              className="inline-flex items-center justify-center rounded-2xl bg-[#4a1717] px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-[#5a1d1d] disabled:opacity-50"
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
  const [showCancelRequestSentModal, setShowCancelRequestSentModal] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingToCancel, setBookingToCancel] = useState<BookingRow | null>(null);

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
    ["weekly", "pass7"].includes(String(profile.membership_plan).toLowerCase());

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
    profile?.membership_expires_at,
    profile?.membership_paused_until
  );

  const membershipExpired =
    !!profile?.membership_expires_at &&
    new Date(profile.membership_expires_at).getTime() <= Date.now();

  const membershipStatusValue = String(profile?.membership_status ?? "").toLowerCase();

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
        .select("user_id, code, bank_bsb, bank_account");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("No affiliate row found for this account.");
      }

      if (data.length > 1) {
        throw new Error("Multiple affiliate rows found for this account.");
      }

      setBsb(data[0].bank_bsb ?? "");
      setAccountNumber(data[0].bank_account ?? "");
      alert("Payout details updated");
      await load();
    } catch (e: any) {
      console.error("saveBankDetails error:", e);
      alert(e?.message || "Failed to update payout details");
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
        body: JSON.stringify({ reason: trimmedReason }),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: targetBooking.id }),
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

  const bookHref = !isLoggedIn || isSingleAccount ? "/book/single" : "/book";
  const accountTypeLabel = isAffiliate ? "Affiliate" : isMember ? "Member" : "Single booking";

  return (
    <div className="min-h-screen bg-[#160d0a] text-[#fff7ec]">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[-20%] top-[-10%] h-96 w-96 rounded-full bg-[#5b392a]/35 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-15%] h-[28rem] w-[28rem] rounded-full bg-emerald-900/20 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl px-5 py-8 pb-24 sm:px-8 lg:py-12">
        <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d8c6b4]/60">LAX Account</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {isLoggedIn ? `Welcome, ${displayName}` : "Profile"}
            </h1>
          </div>

          <a
            href={bookHref}
            className="rounded-2xl bg-[#f6eadb]/10 px-4 py-3 text-sm font-bold text-[#fff7ec] transition hover:bg-[#f6eadb]/15"
          >
            Book →
          </a>
        </div>

        {loading ? (
          <Card className="mx-auto max-w-xl text-center text-[#d8c6b4]">Loading…</Card>
        ) : !isLoggedIn ? (
          <div className="mx-auto max-w-3xl">
            <Card className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d8c6b4]/60">LAX Account</p>
              <h1 className="mt-3 text-3xl font-bold">Track your bookings</h1>
              <p className="mx-auto mt-3 max-w-xl text-[#d8c6b4]/75">
                Create an account to view your booking history, reschedule and manage your details, and keep everything in one place.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ActionButton href="/signup" variant="primary">Create an account</ActionButton>
                <ActionButton href="/login" variant="neutral">Log in</ActionButton>
              </div>
            </Card>
          </div>
        ) : err ? (
          <Card className="mx-auto max-w-xl text-red-200">{err}</Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-8 rounded-[2rem] border border-[#f6eadb]/10 bg-[#211713]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
                <div className="px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d8c6b4]/55">LAX Dashboard</p>
                  <h2 className="mt-2 text-2xl font-bold">Account</h2>
                  <p className="mt-1 text-sm text-[#d8c6b4]/65">{accountTypeLabel}</p>
                </div>

                <nav className="mt-3 grid gap-2">
                  <SidebarItem label="Account" active />
<SidebarItem
  label={isAffiliate ? "Affiliate" : isMember ? "Membership" : "Bookings"}
  href={isMember ? "/membership" : undefined}
/>
<SidebarItem label="Support" href={enquiryHref} />
                </nav>

                <div className="mt-6 grid gap-3 border-t border-[#f6eadb]/10 pt-4">
                  <ActionButton href={bookHref} variant="primary">Book →</ActionButton>
                  <button
                    disabled={busy !== null}
                    onClick={logout}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#d8c6b4]/70 transition hover:bg-[#3a2a24] hover:text-[#fff7ec] disabled:opacity-50"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-6 hidden items-center justify-between gap-6 lg:flex">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d8c6b4]/55">LAX Account</p>
                  <h1 className="mt-2 text-5xl font-bold tracking-tight">Welcome, {displayName}</h1>
                </div>

                <div className="rounded-full border border-[#f6eadb]/10 bg-[#2d221e] px-5 py-3 text-sm font-bold text-[#d8c6b4]">
                  {accountTypeLabel}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="grid gap-6">
                  <Card>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">Basic info</p>
                        <h2 className="mt-2 text-2xl font-bold">Account details</h2>
                        <p className="mt-1 text-sm text-[#d8c6b4]/65">Keep your name and contact details up to date.</p>
                      </div>

                      {!!fullName.trim() && !isEditingName ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="rounded-2xl bg-[#f6eadb]/10 px-4 py-2 text-sm font-bold text-[#fff7ec] transition hover:bg-[#f6eadb]/15"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-6 rounded-3xl bg-[#1c120f]/35 p-4">
                      <DetailRow label="Name" value={fullName.trim() || "—"} />
                      <DetailRow label="Email" value={email} />
                      <DetailRow label="Account type" value={accountTypeLabel} />
                    </div>

                    {isEditingName ? (
                      <div className="mt-5 rounded-3xl bg-[#f6eadb]/5 p-4">
                        <label className="text-sm font-semibold text-[#d8c6b4]">Full name</label>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your name"
                            className="min-h-12 flex-1 rounded-2xl border border-[#f6eadb]/10 bg-[#fff7ec] px-4 text-[#21130f] outline-none placeholder:text-[#8b7a6c] focus:ring-2 focus:ring-emerald-600"
                          />
                          <button
                            disabled={savingName}
                            onClick={saveName}
                            className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {savingName ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </Card>

                  {isAffiliate ? (
                    <Card>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">Affiliate</p>
                        <h2 className="mt-2 text-2xl font-bold">Affiliate details</h2>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-[#1c120f]/35 p-4">
                          <DetailRow label="Active code" value={affiliate?.code ?? "—"} />
                          <DetailRow label="Used code count" value={Number(affiliate?.used_count ?? 0)} />
                          <DetailRow label="Credit" value={fmtAUDFromCents(affiliate?.credit_cents ?? 0)} />
                        </div>

                        <div className="rounded-3xl bg-[#1c120f]/35 p-4">
                          <DetailRow label="Times visited" value={Number(affiliate?.visits_count ?? 0)} />
                          <DetailRow label="Agreement accepted" value={affiliate?.agreement_accepted_at ? "Yes" : "—"} />
                          <DetailRow label="Affiliate since" value={fmtDate(affiliate?.agreement_accepted_at ?? null)} />
                        </div>
                      </div>

                      <div className="mt-5 rounded-3xl bg-[#f6eadb]/5 p-4">
                        <h3 className="font-bold">Payout details</h3>
                        <p className="mt-1 text-sm text-[#d8c6b4]/65">Add your BSB and account number for affiliate payouts.</p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-sm font-semibold text-[#d8c6b4]">BSB</label>
                            <input
                              type="text"
                              value={bsb}
                              onChange={(e) => setBsb(e.target.value)}
                              placeholder="123-456"
                              className="mt-2 min-h-12 w-full rounded-2xl border border-[#f6eadb]/10 bg-[#fff7ec] px-4 text-[#21130f] outline-none placeholder:text-[#8b7a6c] focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-semibold text-[#d8c6b4]">Account number</label>
                            <input
                              type="text"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              placeholder="Account number"
                              className="mt-2 min-h-12 w-full rounded-2xl border border-[#f6eadb]/10 bg-[#fff7ec] px-4 text-[#21130f] outline-none placeholder:text-[#8b7a6c] focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <ActionButton disabled={savingBankDetails} onClick={saveBankDetails} variant="primary">
                            {savingBankDetails ? "Saving…" : "Save payout details"}
                          </ActionButton>
                          <ActionButton href="/affiliate-agreement" variant="neutral">View agreement</ActionButton>
                        </div>
                      </div>
                    </Card>
                  ) : isMember ? (
                    <Card>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">Membership</p>
                        <h2 className="mt-2 text-2xl font-bold">Membership details</h2>
                      </div>

                      <div className="mt-6 rounded-3xl bg-[#1c120f]/35 p-4">
                        <DetailRow label="Membership" value={planLabel} />
                        <DetailRow label="Status" value={membershipStatusUI.label} />
                        <DetailRow label={dateLabel} value={dateValue} />
                        <DetailRow label="Paused until" value={fmtDate(profile?.membership_paused_until ?? null)} />
                        <DetailRow label={`Pause weeks used (${pauseYear})`} value={`${pauseUsed} / 6`} />
                      </div>

                      {membershipStatusUI.helper ? (
                        <div className="mt-5 rounded-3xl border border-[#f6eadb]/10 bg-[#f6eadb]/5 p-4 text-sm leading-relaxed text-[#d8c6b4]">
                          {membershipStatusUI.helper}
                        </div>
                      ) : null}
                    </Card>
                  ) : (
                    <Card>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">Single</p>
                        <h2 className="mt-2 text-2xl font-bold">Booking profile</h2>
                      </div>

                      <div className="mt-6 rounded-3xl bg-[#1c120f]/35 p-4">
                        <DetailRow label="Account type" value="Single booking account" />
                        <DetailRow label="Bookings" value={`${bookings.length} total`} />
                      </div>
                    </Card>
                  )}

                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">Bookings</p>
                        <h2 className="mt-2 text-2xl font-bold">Upcoming bookings</h2>
                      </div>
                      <span className="rounded-full bg-[#f6eadb]/10 px-3 py-1 text-xs font-bold text-[#d8c6b4]">
                        {upcomingBookings.length} upcoming
                      </span>
                    </div>

                    {upcomingBookings.length === 0 ? (
                      <p className="mt-5 rounded-3xl bg-[#1c120f]/35 p-4 text-[#d8c6b4]/70">No upcoming bookings.</p>
                    ) : (
                      <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
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
                  </Card>

                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">History</p>
                        <h2 className="mt-2 text-2xl font-bold">Past bookings</h2>
                      </div>
                      <span className="rounded-full bg-[#f6eadb]/10 px-3 py-1 text-xs font-bold text-[#d8c6b4]">
                        {bookingHistory.length} total
                      </span>
                    </div>

                    {bookingHistory.length === 0 ? (
                      <p className="mt-5 rounded-3xl bg-[#1c120f]/35 p-4 text-[#d8c6b4]/70">No past bookings yet.</p>
                    ) : (
                      <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
                        {bookingHistory.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                <div className="grid gap-6 self-start xl:sticky xl:top-8">
                  <Card>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">Actions</p>
                    <h2 className="mt-2 text-2xl font-bold">Quick actions</h2>
                    <p className="mt-2 text-sm text-[#d8c6b4]/65">Manage your LAX account, bookings and support requests.</p>

                    <div className="mt-6 grid gap-3">
                      {isAffiliate ? (
                        <ActionButton href={enquiryHref} variant="neutral">Send us a message</ActionButton>
                      ) : isMember ? (
                        <>
                          <ActionButton disabled={busy !== null} onClick={openCustomerPortal} variant="primary">
                            {busy === "portal" ? "Opening…" : "Update card details"}
                          </ActionButton>

                          <ActionButton
                            disabled={
                              busy !== null ||
                              pauseUsed >= 6 ||
                              membershipStatusValue === "cancelled" ||
                              membershipStatusValue === "canceled" ||
                              membershipExpired
                            }
                            onClick={pauseOneWeek}
                            variant="warning"
                          >
                            {busy === "pause" ? "Pausing…" : "Pause 1 week"}
                          </ActionButton>

                          {membershipStatusValue === "cancellation_requested" ? (
                            <div className="rounded-2xl bg-[#f6eadb]/5 px-4 py-4 text-center text-sm font-semibold text-[#d8c6b4]">
                              Cancellation request sent. Admin will review it shortly.
                            </div>
                          ) : (membershipStatusValue === "cancelled" || membershipStatusValue === "canceled") && membershipExpired ? (
                            <ActionButton href="/membership" variant="neutral">Want to re-sign up?</ActionButton>
                          ) : (
                            <ActionButton disabled={busy !== null || membershipExpired} onClick={() => setShowCancelRequestModal(true)} variant="danger">
                              Send cancellation request
                            </ActionButton>
                          )}

                        </>
                      ) : (
                        <>
                          <ActionButton href="/book/single" variant="primary">Book another session</ActionButton>
                          <ActionButton href="/membership" variant="warning">Become a member</ActionButton>
                          <ActionButton href={enquiryHref} variant="neutral">Send us a message</ActionButton>
                        </>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8c6b4]/55">Support</p>
                    <h2 className="mt-2 text-xl font-bold">Need help?</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#d8c6b4]/65">
                      Send us a message if anything looks off with your account, payments or bookings.
                    </p>
                    <div className="mt-5">
                      <ActionButton href={enquiryHref} variant="neutral">Contact LAX</ActionButton>
                    </div>
                  </Card>

                  <button
                    disabled={busy !== null}
                    onClick={logout}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#d8c6b4]/70 transition hover:bg-[#3a2a24] hover:text-[#fff7ec] disabled:opacity-50 lg:hidden"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#f6eadb]/10 bg-[#211713] p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-[#fff7ec]">Membership paused</h2>
            <p className="mt-4 leading-relaxed text-[#d8c6b4]/80">
              Take care, we will miss you, but see you when you come back.
            </p>
            <button
              onClick={() => setShowPauseModal(false)}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#f6eadb]/10 px-5 py-3 text-sm font-bold text-[#fff7ec] transition hover:bg-[#f6eadb]/15"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCancelRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#f6eadb]/10 bg-[#211713] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#fff7ec]">Cancellation request</h2>
            <p className="mt-3 leading-relaxed text-[#d8c6b4]/75">
              Please let us know why you’d like to cancel your membership. This request will be sent to admin for review.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={5}
              placeholder="Reason for cancellation..."
              className="mt-5 w-full rounded-3xl border border-[#f6eadb]/10 bg-[#fff7ec] p-4 text-[#21130f] outline-none placeholder:text-[#8b7a6c] focus:ring-2 focus:ring-emerald-600"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy === "cancel-request"}
                onClick={() => {
                  setShowCancelRequestModal(false);
                  setCancelReason("");
                }}
                className="rounded-2xl bg-[#f6eadb]/10 px-4 py-3 font-bold text-[#fff7ec] transition hover:bg-[#f6eadb]/15 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                disabled={busy === "cancel-request"}
                onClick={submitCancellationRequest}
                className="rounded-2xl bg-[#4a1717] px-4 py-3 font-bold text-red-200 transition hover:bg-[#5a1d1d] disabled:opacity-50"
              >
                {busy === "cancel-request" ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelRequestSentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#f6eadb]/10 bg-[#211713] p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-[#fff7ec]">Request sent</h2>
            <p className="mt-4 leading-relaxed text-[#d8c6b4]/80">
              Your cancellation request has been sent to admin. We will review it shortly.
            </p>
            <button
              onClick={() => setShowCancelRequestSentModal(false)}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#f6eadb]/10 px-5 py-3 text-sm font-bold text-[#fff7ec] transition hover:bg-[#f6eadb]/15"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-[#f6eadb]/10 bg-[#211713] p-6 text-center shadow-2xl">
            <h2 className="text-xl font-bold text-[#fff7ec]">Cancel this booking?</h2>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={busy === "cancel-booking"}
                onClick={() => setBookingToCancel(null)}
                className="rounded-2xl bg-[#f6eadb]/10 px-5 py-3 text-sm font-bold text-[#fff7ec] transition hover:bg-[#f6eadb]/15 disabled:opacity-50"
              >
                No
              </button>

              <button
                type="button"
                disabled={busy === "cancel-booking"}
                onClick={() => cancelBooking()}
                className="rounded-2xl bg-[#4a1717] px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-[#5a1d1d] disabled:opacity-50"
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

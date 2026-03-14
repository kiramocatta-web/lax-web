"use client";

import { useEffect, useMemo, useState } from "react";
import GenerateAffiliateInviteCard from "@/components/GenerateAffiliateInviteCard";
import Link from "next/link";

type MemberRow = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  membership_plan: string | null;
  membership_status: string | null;
  membership_expires_at: string | null;
  stripe_current_period_end: string | null;
};

type BookingRow = {
  id: number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  booking_type: string | null;
  status: string | null;
  total_amount_cents: number | null;
  customer_name?: string | null;
  customer_email: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  created_at?: string | null;
  user_id?: string | null;
  profiles:
    | {
        email: string | null;
        phone: string | null;
      }
    | null;
};

type BookingBaseRow = {
  id: number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  booking_type: string | null;
  status: string | null;
  customer_email: string | null;
  customer_phone?: string | null;
  total_amount_cents: number | null;
  user_id: string | null;
};

type AffiliateRow = {
  user_id: string;
  code: string | null;
  used_count: number | null;
  credit_cents: number | null;
  visits_count: number | null;
  is_active: boolean | null;
  accumulated_payout_cents: number | null;
  last_paid_at: string | null;
  last_paid_amount_cents: number | null;
  last_code_use_at?: string | null;
  profiles:
    | {
        email: string | null;
        phone: string | null;
        name?: string | null;
      }
    | null;
};

type BookingBlockRow = {
  id: number;
  block_date: string;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
};

type StripeSubRow = {
  id: string;
  email: string | null;
  phone: string | null;
  membership_plan: string | null;
  membership_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_current_period_end: string | null;
};

type ComeBackRecipientRow = {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  last_booking_date: string;
  days_since_last_booking: number;
  membership_plan: string | null;
  membership_status: string | null;
};

type EmailTemplateRow = {
  id: number;
  name: string;
  subject: string;
  body: string;
  created_at: string;
};

type AdminDashboardClientProps = {
  adminEmail: string;
  adminPhone: string;
  activeMembers: MemberRow[];
  bookings: BookingRow[];
  affiliates: AffiliateRow[];
  bookingBlocks: BookingBlockRow[];
  stripeSubs: StripeSubRow[];
  comeBackRecipients: ComeBackRecipientRow[];
  comeBackTemplates: EmailTemplateRow[];
  totalWebsiteClicks: number;
  todayWebsiteClicks: number;
  uniqueVisitorsTotal: number;
};

type AdminView =
  | "members"
  | "bookings"
  | "stripe"
  | "affiliates"
  | "blocks"
  | "comeback";

type BookingFilter = "today" | "tomorrow" | "week" | "all" | "custom";

type AffiliateDateRange =
  | "lifetime"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

type AffiliateSort =
  | "highest_unpaid"
  | "most_uses"
  | "most_visits"
  | "highest_accumulated_payouts"
  | "recently_active"
  | "alphabetical";

type ComeBackBucket = "14_29" | "30_59" | "60_89" | "90_plus";
type ComeBackEditorMode = "prefill" | "html";

type MemberStatusValue = "active" | "cancellation_requested" | "cancelled";

function fmtDate(iso: string | null) {
  if (!iso) return "—";

  const hasTime = iso.includes("T");
  const d = hasTime ? new Date(iso) : new Date(`${iso}T00:00:00`);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function planLabel(plan: string | null) {
  if (plan === "weekly") return "$20 p/w Unlimited";
  if (plan === "pass7") return "7-Day Pass";
  return plan ?? "—";
}

function formatTime(time: string | null) {
  if (!time) return "—";

  const [hh, mm] = time.split(":");
  const hours = Number(hh);
  const minutes = Number(mm);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = ((hours + 11) % 12) + 1;
  return `${h12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function formatMoney(cents: number | null) {
  const safe = Number(cents ?? 0);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(safe / 100);
}

function getBookingEmail(booking: BookingRow) {
  return booking.profiles?.email ?? booking.customer_email ?? null;
}

function getProfileEmail(
  profile:
    | {
        email: string | null;
        phone: string | null;
        name?: string | null;
      }
    | null
) {
  return profile?.email ?? null;
}

function getProfileName(
  profile:
    | {
        email: string | null;
        phone: string | null;
        name?: string | null;
      }
    | null
) {
  return profile?.name ?? null;
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function normalizeMemberStatus(value: string | null | undefined): MemberStatusValue {
  const v = String(value ?? "").toLowerCase();
  if (v === "cancellation_requested") return "cancellation_requested";
  if (v === "cancelled" || v === "canceled") return "cancelled";
  return "active";
}

function memberStatusLabel(value: string | null | undefined) {
  const v = normalizeMemberStatus(value);
  if (v === "cancellation_requested") return "Cancellation requested";
  if (v === "cancelled") return "Cancelled";
  return "Active";
}

export default function AdminDashboardClient({
  adminEmail,
  adminPhone,
  activeMembers,
  bookings,
  affiliates,
  bookingBlocks,
  stripeSubs,
  comeBackRecipients,
  comeBackTemplates,
  totalWebsiteClicks,
  todayWebsiteClicks,
  uniqueVisitorsTotal,

}: AdminDashboardClientProps) {
  const [view, setView] = useState<AdminView>("members");

  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [expandedBookingId, setExpandedBookingId] = useState<string | number | null>(
    null
  );

  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliateSort, setAffiliateSort] =
    useState<AffiliateSort>("highest_unpaid");
  const [affiliateDateRange, setAffiliateDateRange] =
    useState<AffiliateDateRange>("lifetime");
  const [affiliateCustomStart, setAffiliateCustomStart] = useState("");
  const [affiliateCustomEnd, setAffiliateCustomEnd] = useState("");
  const [payingAffiliateId, setPayingAffiliateId] = useState<string | null>(null);

  const [comeBackBucket, setComeBackBucket] = useState<ComeBackBucket>("14_29");
  const [comeBackEditorMode, setComeBackEditorMode] =
    useState<ComeBackEditorMode>("prefill");
  const [comeBackSubject, setComeBackSubject] = useState(
    "We miss you at Lax N Lounge 🤍"
  );
  const [comeBackBody, setComeBackBody] = useState(
    `Hey {{name}},

We noticed it has been {{days_since_last_booking}} days since your last visit at Lax N Lounge.

Your last booking was on {{last_booking_date}}.

We’d love to welcome you back in for a reset soon 🤍

— Lax N Lounge`
  );
  const [selectedComeBackIds, setSelectedComeBackIds] = useState<string[]>([]);
  const [comeBackWorking, setComeBackWorking] = useState<null | "test" | "send" | "save">(null);

  const [membersState, setMembersState] = useState<MemberRow[]>(activeMembers);
  const [memberDraftStatus, setMemberDraftStatus] = useState<Record<string, MemberStatusValue>>(
    () =>
      Object.fromEntries(
        activeMembers.map((member) => [member.id, normalizeMemberStatus(member.membership_status)])
      )
  );
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [cancellingMemberId, setCancellingMemberId] = useState<string | null>(null);

  const totalActiveMembers = useMemo(() => membersState.length, [membersState]);

  const affiliateStats = useMemo(() => {
    const totalAffiliates = affiliates.length;

    const totalCodeUses = affiliates.reduce(
      (sum, a) => sum + Number(a.used_count ?? 0),
      0
    );

    const totalCreditsOwedCents = affiliates.reduce(
      (sum, a) => sum + Number(a.credit_cents ?? 0),
      0
    );

    const totalVisits = affiliates.reduce(
      (sum, a) => sum + Number(a.visits_count ?? 0),
      0
    );

    const averageUsesPerAffiliate =
      totalAffiliates > 0 ? totalCodeUses / totalAffiliates : 0;

    const topAffiliate =
      [...affiliates].sort(
        (a, b) => Number(b.used_count ?? 0) - Number(a.used_count ?? 0)
      )[0] ?? null;

    const totalAccumulatedPayoutsCents = affiliates.reduce(
      (sum, a) => sum + Number(a.accumulated_payout_cents ?? 0),
      0
    );

    return {
      totalAffiliates,
      totalCodeUses,
      totalCreditsOwedCents,
      totalVisits,
      averageUsesPerAffiliate,
      topAffiliate,
      totalAccumulatedPayoutsCents,
    };
  }, [affiliates]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    const today = toLocalDateString(now);

    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const tomorrow = toLocalDateString(tomorrowDate);

    const weekEndDate = new Date(now);
    weekEndDate.setDate(now.getDate() + 6);
    const weekEnd = toLocalDateString(weekEndDate);

    return bookings.filter((booking) => {
      const bookingDate = booking.booking_date;
      if (!bookingDate) return false;

      if (bookingFilter === "today") return bookingDate === today;
      if (bookingFilter === "tomorrow") return bookingDate === tomorrow;
      if (bookingFilter === "week") return bookingDate >= today && bookingDate <= weekEnd;
      if (bookingFilter === "custom") return customDate ? bookingDate === customDate : false;

      return true;
    });
  }, [bookings, bookingFilter, customDate]);

  const affiliateRows = useMemo(() => {
    const search = affiliateSearch.trim().toLowerCase();

    const filtered = affiliates.filter((affiliate) => {
      const code = String(affiliate.code ?? "").toLowerCase();
      const email = String(getProfileEmail(affiliate.profiles) ?? "").toLowerCase();
      const name = String(getProfileName(affiliate.profiles) ?? "").toLowerCase();

      if (!search) return true;

      return code.includes(search) || email.includes(search) || name.includes(search);
    });

    return [...filtered].sort((a, b) => {
      if (affiliateSort === "highest_unpaid") {
        return Number(b.credit_cents ?? 0) - Number(a.credit_cents ?? 0);
      }

      if (affiliateSort === "most_uses") {
        return Number(b.used_count ?? 0) - Number(a.used_count ?? 0);
      }

      if (affiliateSort === "most_visits") {
        return Number(b.visits_count ?? 0) - Number(a.visits_count ?? 0);
      }

      if (affiliateSort === "highest_accumulated_payouts") {
        return (
          Number(b.accumulated_payout_cents ?? 0) -
          Number(a.accumulated_payout_cents ?? 0)
        );
      }

      if (affiliateSort === "recently_active") {
        const aTime = a.last_code_use_at ? new Date(a.last_code_use_at).getTime() : 0;
        const bTime = b.last_code_use_at ? new Date(b.last_code_use_at).getTime() : 0;
        return bTime - aTime;
      }

      const aName =
        getProfileName(a.profiles) ??
        getProfileEmail(a.profiles) ??
        a.code ??
        "";
      const bName =
        getProfileName(b.profiles) ??
        getProfileEmail(b.profiles) ??
        b.code ??
        "";

      return aName.localeCompare(bName);
    });
  }, [affiliates, affiliateSearch, affiliateSort]);

  const filteredComeBackRecipients = useMemo(() => {
    return comeBackRecipients.filter((recipient) => {
      const days = recipient.days_since_last_booking;

      if (comeBackBucket === "14_29") return days >= 14 && days <= 29;
      if (comeBackBucket === "30_59") return days >= 30 && days <= 59;
      if (comeBackBucket === "60_89") return days >= 60 && days <= 89;
      return days >= 90;
    });
  }, [comeBackRecipients, comeBackBucket]);

  const exportPayoutSummary = () => {
    const header = [
      "Name",
      "Email",
      "Code",
      "Unpaid Balance",
      "Accumulated Payouts",
      "Last Paid",
      "Last Paid Amount",
      "Last Code Use",
      "Visits",
      "Lifetime Uses",
    ];

    const rows = affiliateRows.map((affiliate) => [
      getProfileName(affiliate.profiles) ?? "",
      getProfileEmail(affiliate.profiles) ?? "",
      affiliate.code ?? "",
      formatMoney(affiliate.credit_cents ?? 0),
      formatMoney(affiliate.accumulated_payout_cents ?? 0),
      fmtDateTime(affiliate.last_paid_at),
      formatMoney(affiliate.last_paid_amount_cents ?? 0),
      fmtDateTime(affiliate.last_code_use_at ?? null),
      Number(affiliate.visits_count ?? 0),
      Number(affiliate.used_count ?? 0),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "affiliate-payout-summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportUsageReport = async () => {
    try {
      const params = new URLSearchParams({
        range: affiliateDateRange,
        start: affiliateCustomStart,
        end: affiliateCustomEnd,
      });

      const res = await fetch(
        `/api/admin/affiliates/export-usage?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to export usage report");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "affiliate-usage-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Failed to export usage report");
    }
  };

  const markAffiliatePaid = async (affiliateUserId: string) => {
    if (!confirm("Mark this affiliate as paid and reset their unpaid balance?")) return;

    setPayingAffiliateId(affiliateUserId);

    try {
      const res = await fetch("/api/admin/affiliates/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliate_user_id: affiliateUserId }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to mark affiliate as paid");

      alert("Affiliate marked as paid ✅");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Something went wrong");
    } finally {
      setPayingAffiliateId(null);
    }
  };

  const updateMemberDraftStatus = (memberId: string, value: string) => {
    setMemberDraftStatus((prev) => ({
      ...prev,
      [memberId]: normalizeMemberStatus(value),
    }));
  };

  const saveMemberStatus = async (memberId: string) => {
    const nextStatus = memberDraftStatus[memberId] ?? "active";
    setSavingMemberId(memberId);

    try {
      const res = await fetch("/api/admin/membership/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: memberId,
          membership_status: nextStatus,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || "Failed to update membership status");
      }

      setMembersState((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? {
                ...member,
                membership_status: nextStatus,
              }
            : member
        )
      );

      alert("Membership status updated ✅");
    } catch (e: any) {
      alert(e?.message || "Failed to update membership status");
    } finally {
      setSavingMemberId(null);
    }
  };

  const cancelMembership = async (memberId: string) => {
    if (
      !confirm(
        "Charge the final 2 weeks, cancel future recurring billing, and keep access active for 14 days?"
      )
    ) {
      return;
    }

    setCancellingMemberId(memberId);

    try {
      const res = await fetch("/api/admin/memberships/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: memberId,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || "Failed to cancel membership");
      }

      setMembersState((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? {
                ...member,
                membership_status: "cancelled",
                membership_expires_at:
                  json?.membership_expires_at ?? member.membership_expires_at,
                stripe_current_period_end: null,
              }
            : member
        )
      );

      setMemberDraftStatus((prev) => ({
        ...prev,
        [memberId]: "cancelled",
      }));

      alert("Membership cancelled ✅");
    } catch (e: any) {
      alert(e?.message || "Failed to cancel membership");
    } finally {
      setCancellingMemberId(null);
    }
  };

  const toggleComeBackRecipient = (id: string) => {
    setSelectedComeBackIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllComeBackRecipients = () => {
    const currentIds = filteredComeBackRecipients.map((r) => r.id);
    const allSelected = currentIds.every((id) => selectedComeBackIds.includes(id));

    setSelectedComeBackIds((prev) =>
      allSelected
        ? prev.filter((id) => !currentIds.includes(id))
        : Array.from(new Set([...prev, ...currentIds]))
    );
  };

  const loadComeBackTemplate = (templateId: string) => {
    const template = comeBackTemplates.find((t) => String(t.id) === templateId);
    if (!template) return;
    setComeBackSubject(template.subject);
    setComeBackBody(template.body);
  };

  const copyComeBackEmailList = async (selectedOnly: boolean) => {
    const source = selectedOnly
      ? filteredComeBackRecipients.filter((r) => selectedComeBackIds.includes(r.id))
      : filteredComeBackRecipients;

    const emails = source.map((r) => r.email).filter(Boolean);

    if (emails.length === 0) {
      alert(selectedOnly ? "No selected emails to copy." : "No emails in this group.");
      return;
    }

    try {
      await navigator.clipboard.writeText(emails.join(", "));
      alert("Email list copied ✅");
    } catch {
      alert("Failed to copy email list.");
    }
  };

  const sendComeBackTest = async () => {
    setComeBackWorking("test");
    try {
      const res = await fetch("/api/admin/comeback/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: adminEmail,
          subject: comeBackSubject,
          body: comeBackBody,
          isHtml: comeBackEditorMode === "html",
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to send test email");

      alert(`Test sent to ${adminEmail} ✅`);
    } catch (e: any) {
      alert(e?.message || "Failed to send test email");
    } finally {
      setComeBackWorking(null);
    }
  };

  const sendComeBackSelected = async () => {
    if (selectedComeBackIds.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    setComeBackWorking("send");
    try {
      const res = await fetch("/api/admin/comeback/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_ids: selectedComeBackIds,
          subject: comeBackSubject,
          body: comeBackBody,
          isHtml: comeBackEditorMode === "html",
          recipients: filteredComeBackRecipients.filter((r) =>
            selectedComeBackIds.includes(r.id)
          ),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to send emails");

      alert("Come back emails sent ✅");
    } catch (e: any) {
      alert(e?.message || "Failed to send emails");
    } finally {
      setComeBackWorking(null);
    }
  };

  const saveComeBackTemplate = async () => {
    const name = window.prompt("Template name?");
    if (!name) return;

    setComeBackWorking("save");
    try {
      const res = await fetch("/api/admin/comeback/save-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject: comeBackSubject,
          body: comeBackBody,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to save template");

      alert("Template saved ✅");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Failed to save template");
    } finally {
      setComeBackWorking(null);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex flex-col">

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-8 py-10 pb-24">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">Admin Panel</h1>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/70">Signed in as:</p>
            <p className="text-xl mt-1">{adminEmail}</p>
            <p className="text-white/50 text-sm mt-1">Phone: {adminPhone}</p>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    <p className="text-sm text-white/60">Website clicks altogether</p>
    <p className="mt-2 text-3xl font-semibold">{totalWebsiteClicks}</p>
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    <p className="text-sm text-white/60">Website clicks today</p>
    <p className="mt-2 text-3xl font-semibold">{todayWebsiteClicks}</p>
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    <p className="text-sm text-white/60">Unique visitors total</p>
    <p className="mt-2 text-3xl font-semibold">{uniqueVisitorsTotal}</p>
  </div>
</div>

<div className="mt-6 mb-6 flex flex-wrap gap-3">

  <Link
    href="/bookings-calendar"
    className="rounded-2xl border border-white/20 bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500"
  >
    Open Bookings Calendar
  </Link>

</div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Dashboard View</div>
            <p className="mt-1 text-sm text-white/70">
              Choose a section to manage below.
            </p>

            <select
              value={view}
              onChange={(e) => setView(e.target.value as AdminView)}
              className="mt-4 w-full max-w-md bg-white text-black p-3 rounded-xl"
            >
              <option value="members">Active Members</option>
              <option value="stripe">Stripe Subscription Overview</option>
              <option value="affiliates">Affiliate Performance & Payout Tracking</option>
              <option value="blocks">Block Out Dates</option>
              <option value="comeback">Come Back! Emails</option>
            </select>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            {view === "members" ? (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-semibold">Active Members</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Update status, mark cancellation requests, and complete admin-only cancellations.
                    </p>
                  </div>

                  <div className="text-sm text-white/70">
                    Total:{" "}
                    <span className="text-white font-semibold">{totalActiveMembers}</span>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/10">
                  <table className="w-full text-sm min-w-[1200px]">
                    <thead className="bg-white/10 text-white/80">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Email</th>
                        <th className="text-left px-4 py-3 font-semibold">Phone</th>
                        <th className="text-left px-4 py-3 font-semibold">Plan</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-left px-4 py-3 font-semibold">
                          Expiry / Next Payment
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">Role</th>
                        <th className="text-left px-4 py-3 font-semibold">Change status</th>
                        <th className="text-left px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersState.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-white/60">
                            No active members found.
                          </td>
                        </tr>
                      ) : (
                        membersState.map((member) => {
                          const dateToShow =
                            member.membership_plan === "weekly"
                              ? member.stripe_current_period_end
                              : member.membership_expires_at;

                          const currentStatus = normalizeMemberStatus(
                            member.membership_status
                          );
                          const draftStatus =
                            memberDraftStatus[member.id] ?? currentStatus;

                          const isSaving = savingMemberId === member.id;
                          const isCancelling = cancellingMemberId === member.id;

                          const showCancelButton =
  currentStatus === "cancellation_requested";

                          return (
                            <tr
                              key={member.id}
                              className="border-t border-white/10 text-white/85 align-top"
                            >
                              <td className="px-4 py-3">{member.email ?? "—"}</td>
                              <td className="px-4 py-3">{member.phone ?? "—"}</td>
                              <td className="px-4 py-3">
                                {planLabel(member.membership_plan)}
                              </td>
                              <td className="px-4 py-3">
                                {memberStatusLabel(member.membership_status)}
                              </td>
                              <td className="px-4 py-3">{fmtDate(dateToShow)}</td>
                              <td className="px-4 py-3">{member.role ?? "—"}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-2 min-w-[220px]">
                                  <select
                                    value={draftStatus}
                                    onChange={(e) =>
                                      updateMemberDraftStatus(member.id, e.target.value)
                                    }
                                    className="bg-white text-black p-3 rounded-xl"
                                    disabled={isSaving || isCancelling}
                                  >
                                    <option value="active">Active</option>
                                    <option value="cancellation_requested">
                                      Cancellation requested
                                    </option>
                                    <option value="cancelled">Cancelled
                                    </option>
                                  </select>

                                  <button
                                    type="button"
                                    disabled={isSaving || isCancelling}
                                    onClick={() => saveMemberStatus(member.id)}
                                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold disabled:opacity-50"
                                  >
                                    {isSaving ? "Saving…" : "Save status"}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-2 min-w-[220px]">
                                  {showCancelButton ? (
                                    <button
                                      type="button"
                                      disabled={isSaving || isCancelling}
                                      onClick={() => cancelMembership(member.id)}
                                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50"
                                    >
                                      {isCancelling
                                        ? "Cancelling…"
                                        : "Cancel membership"}
                                    </button>
                                  ) : (
                                    <div className="px-4 py-2 rounded-xl bg-white/5 text-white/50">
                                      Set to “Cancellation requested” to cancel
                                    </div>
                                  )}

                                  <div className="text-xs text-white/50 leading-relaxed">
                                    Final action charges the last 2 weeks, cancels recurring billing, and keeps access for 14 days.
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            
            ) : view === "stripe" ? (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold">Stripe Subscription Overview</h2>
                  <div className="text-sm text-white/70">
                    Total:{" "}
                    <span className="text-white font-semibold">{stripeSubs.length}</span>
                  </div>
                </div>

                <p className="mt-3 text-white/70">
                  View active subscriptions, failed payments and upcoming billing.
                </p>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/10 text-white/80">
                      <tr>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Plan</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Next Billing</th>
                        <th className="px-4 py-3 text-left">Stripe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stripeSubs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-white/60">
                            No Stripe subscriptions found.
                          </td>
                        </tr>
                      ) : (
                        stripeSubs.map((sub) => {
                          const nextBilling = sub.stripe_current_period_end
                            ? new Date(sub.stripe_current_period_end).toLocaleDateString("en-AU")
                            : "—";

                          return (
                            <tr
                              key={sub.id}
                              className="border-t border-white/10 text-white/85"
                            >
                              <td className="px-4 py-3">{sub.email ?? "—"}</td>
                              <td className="px-4 py-3">{planLabel(sub.membership_plan)}</td>
                              <td className="px-4 py-3">{sub.membership_status ?? "—"}</td>
                              <td className="px-4 py-3">{nextBilling}</td>
                              <td className="px-4 py-3">
                                {sub.stripe_customer_id ? (
                                  <a
                                    href={`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                                  >
                                    Open
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : view === "affiliates" ? (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold">
                    Affiliate Performance & Payout Tracking
                  </h2>
                  <div className="text-sm text-white/70">
                    Total:{" "}
                    <span className="text-white font-semibold">
                      {affiliateStats.totalAffiliates}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <GenerateAffiliateInviteCard />
                </div>

                <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                    <div className="text-sm text-white/60">Total affiliates</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {affiliateStats.totalAffiliates}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                    <div className="text-sm text-white/60">Total code uses</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {affiliateStats.totalCodeUses}
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      Avg {affiliateStats.averageUsesPerAffiliate.toFixed(1)} per affiliate
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                    <div className="text-sm text-white/60">Total credits owed</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatMoney(affiliateStats.totalCreditsOwedCents)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                    <div className="text-sm text-white/60">Top affiliate</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {affiliateStats.topAffiliate?.code ?? "—"}
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      {affiliateStats.topAffiliate
                        ? `${Number(affiliateStats.topAffiliate.used_count ?? 0)} uses`
                        : "No data yet"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid lg:grid-cols-2 xl:grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={affiliateSearch}
                    onChange={(e) => setAffiliateSearch(e.target.value)}
                    placeholder="Search by name, email or code"
                    className="bg-white text-black p-3 rounded-xl"
                  />

                  <select
                    value={affiliateDateRange}
                    onChange={(e) =>
                      setAffiliateDateRange(e.target.value as AffiliateDateRange)
                    }
                    className="bg-white text-black p-3 rounded-xl"
                  >
                    <option value="lifetime">Lifetime</option>
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>

                  <select
                    value={affiliateSort}
                    onChange={(e) => setAffiliateSort(e.target.value as AffiliateSort)}
                    className="bg-white text-black p-3 rounded-xl"
                  >
                    <option value="highest_unpaid">Highest unpaid balance</option>
                    <option value="most_uses">Most code uses</option>
                    <option value="most_visits">Most visits</option>
                    <option value="highest_accumulated_payouts">
                      Highest accumulated payouts
                    </option>
                    <option value="recently_active">Recently active</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>

                  <button
                    onClick={exportPayoutSummary}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                  >
                    Export payout summary
                  </button>

                  <button
                    onClick={exportUsageReport}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                  >
                    Export usage report
                  </button>
                </div>

                {affiliateDateRange === "custom" ? (
                  <div className="mt-3 grid md:grid-cols-2 gap-3 max-w-2xl">
                    <input
                      type="date"
                      value={affiliateCustomStart}
                      onChange={(e) => setAffiliateCustomStart(e.target.value)}
                      className="bg-white text-black p-3 rounded-xl"
                    />
                    <input
                      type="date"
                      value={affiliateCustomEnd}
                      onChange={(e) => setAffiliateCustomEnd(e.target.value)}
                      className="bg-white text-black p-3 rounded-xl"
                    />
                  </div>
                ) : null}

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                    <div className="text-sm text-white/60">Total affiliate visits</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {affiliateStats.totalVisits}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                    <div className="text-sm text-white/60">Accumulated payouts</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatMoney(affiliateStats.totalAccumulatedPayoutsCents)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/10">
                  <table className="w-full text-sm min-w-[1200px]">
                    <thead className="bg-white/10 text-white/80">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Name</th>
                        <th className="text-left px-4 py-3 font-semibold">Code</th>
                        <th className="text-left px-4 py-3 font-semibold">Email</th>
                        <th className="text-left px-4 py-3 font-semibold">Lifetime uses</th>
                        <th className="text-left px-4 py-3 font-semibold">Unpaid balance</th>
                        <th className="text-left px-4 py-3 font-semibold">Accumulated payouts</th>
                        <th className="text-left px-4 py-3 font-semibold">Last code use</th>
                        <th className="text-left px-4 py-3 font-semibold">Last paid</th>
                        <th className="text-left px-4 py-3 font-semibold">Visits</th>
                        <th className="text-left px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliateRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-6 text-white/60">
                            No affiliates found.
                          </td>
                        </tr>
                      ) : (
                        affiliateRows.map((affiliate) => {
                          const unpaid = Number(affiliate.credit_cents ?? 0);
                          const isPaying = payingAffiliateId === affiliate.user_id;

                          return (
                            <tr
                              key={affiliate.user_id}
                              className="border-t border-white/10 text-white/85"
                            >
                              <td className="px-4 py-3">
                                {getProfileName(affiliate.profiles) ?? "—"}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {affiliate.code ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {getProfileEmail(affiliate.profiles) ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {Number(affiliate.used_count ?? 0)}
                              </td>
                              <td className="px-4 py-3">{formatMoney(unpaid)}</td>
                              <td className="px-4 py-3">
                                {formatMoney(affiliate.accumulated_payout_cents ?? 0)}
                              </td>
                              <td className="px-4 py-3">
                                {fmtDateTime(affiliate.last_code_use_at ?? null)}
                              </td>
                              <td className="px-4 py-3">
                                {fmtDateTime(affiliate.last_paid_at)}
                              </td>
                              <td className="px-4 py-3">
                                {Number(affiliate.visits_count ?? 0)}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => markAffiliatePaid(affiliate.user_id)}
                                  disabled={isPaying || unpaid <= 0}
                                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold disabled:opacity-40"
                                >
                                  {isPaying ? "Paying..." : "Mark paid"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : view === "blocks" ? (
              <>
                <h2 className="text-xl font-semibold">Block Out Dates</h2>
                <p className="mt-2 text-white/70">
                  Prevent bookings on specific dates or time ranges.
                </p>
                <BlockOutManager bookingBlocks={bookingBlocks} />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold">Come Back! Emails</h2>
                  <div className="text-sm text-white/70">
                    Matching recipients:{" "}
                    <span className="text-white font-semibold">
                      {filteredComeBackRecipients.length}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-white/70">
                  Re-engage users based on their last confirmed booking.
                </p>

                <div className="mt-8 grid lg:grid-cols-4 gap-3">
                  <select
                    value={comeBackBucket}
                    onChange={(e) => setComeBackBucket(e.target.value as ComeBackBucket)}
                    className="bg-white text-black p-3 rounded-xl"
                  >
                    <option value="14_29">14–29 days inactive</option>
                    <option value="30_59">30–59 days inactive</option>
                    <option value="60_89">60–89 days inactive</option>
                    <option value="90_plus">90+ days inactive</option>
                  </select>

                  <select
                    defaultValue=""
                    onChange={(e) => loadComeBackTemplate(e.target.value)}
                    className="bg-white text-black p-3 rounded-xl"
                  >
                    <option value="">Load saved template</option>
                    {comeBackTemplates.map((template) => (
                      <option key={template.id} value={String(template.id)}>
                        {template.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={sendComeBackTest}
                    disabled={comeBackWorking !== null}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold disabled:opacity-40"
                  >
                    {comeBackWorking === "test" ? "Sending test..." : "Send test email"}
                  </button>

                  <button
                    onClick={saveComeBackTemplate}
                    disabled={comeBackWorking !== null}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold disabled:opacity-40"
                  >
                    {comeBackWorking === "save" ? "Saving..." : "Save template"}
                  </button>
                </div>

                <div className="mt-4 max-w-sm">
                  <select
                    value={comeBackEditorMode}
                    onChange={(e) =>
                      setComeBackEditorMode(e.target.value as ComeBackEditorMode)
                    }
                    className="bg-white text-black p-3 rounded-xl w-full"
                  >
                    <option value="prefill">Prefill mode</option>
                    <option value="html">HTML mode</option>
                  </select>
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    type="text"
                    value={comeBackSubject}
                    onChange={(e) => setComeBackSubject(e.target.value)}
                    placeholder="Email subject"
                    className="bg-white text-black p-3 rounded-xl"
                  />

                  <textarea
                    value={comeBackBody}
                    onChange={(e) => setComeBackBody(e.target.value)}
                    rows={10}
                    className="bg-white text-black p-3 rounded-xl"
                    placeholder="Email body..."
                  />

                  <div className="text-xs text-white/60">
                    Available placeholders: {"{{name}}"}, {"{{last_booking_date}}"},{" "}
                    {"{{days_since_last_booking}}"}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 items-center">
                  <button
                    onClick={toggleAllComeBackRecipients}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                  >
                    Select / unselect all
                  </button>

                  <button
                    onClick={() => copyComeBackEmailList(false)}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                  >
                    Copy group email list
                  </button>

                  <button
                    onClick={() => copyComeBackEmailList(true)}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                  >
                    Copy selected email list
                  </button>

                  <button
                    onClick={sendComeBackSelected}
                    disabled={comeBackWorking !== null || selectedComeBackIds.length === 0}
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold disabled:opacity-40"
                  >
                    {comeBackWorking === "send"
                      ? "Sending..."
                      : `Send to selected (${selectedComeBackIds.length})`}
                  </button>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/10">
                  <table className="w-full text-sm min-w-[1000px]">
                    <thead className="bg-white/10 text-white/80">
                      <tr>
                        <th className="px-4 py-3 text-left">Select</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Last Booking</th>
                        <th className="px-4 py-3 text-left">Days Since</th>
                        <th className="px-4 py-3 text-left">Membership</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComeBackRecipients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-white/60">
                            No recipients found for this inactivity bucket.
                          </td>
                        </tr>
                      ) : (
                        filteredComeBackRecipients.map((recipient) => (
                          <tr
                            key={recipient.id}
                            className="border-t border-white/10 text-white/85"
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedComeBackIds.includes(recipient.id)}
                                onChange={() => toggleComeBackRecipient(recipient.id)}
                              />
                            </td>
                            <td className="px-4 py-3">{recipient.name ?? "—"}</td>
                            <td className="px-4 py-3">{recipient.email}</td>
                            <td className="px-4 py-3">{fmtDate(recipient.last_booking_date)}</td>
                            <td className="px-4 py-3">{recipient.days_since_last_booking}</td>
                            <td className="px-4 py-3">{planLabel(recipient.membership_plan)}</td>
                            <td className="px-4 py-3">{recipient.membership_status ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function BlockOutManager({
  bookingBlocks,
}: {
  bookingBlocks: {
    id: number;
    block_date: string;
    is_full_day: boolean;
    start_time: string | null;
    end_time: string | null;
    reason: string | null;
  }[];
}) {
  const [date, setDate] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  const createBlock = async () => {
    if (!date) {
      alert("Please choose a date.");
      return;
    }

    setWorking(true);

    try {
      const res = await fetch("/api/admin/booking-blocks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_date: date,
          is_full_day: isFullDay,
          start_time: isFullDay ? null : startTime,
          end_time: isFullDay ? null : endTime,
          reason,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to create block");

      alert("Block created ✅");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Something went wrong");
    } finally {
      setWorking(false);
    }
  };

  const deleteBlock = async (id: number) => {
    if (!confirm("Delete this block?")) return;

    try {
      const res = await fetch("/api/admin/booking-blocks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block_id: id }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to delete block");

      alert("Block removed");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Something went wrong");
    }
  };

  return (
    <>
      <div className="mt-6 grid md:grid-cols-2 gap-4 max-w-3xl">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-white text-black p-3 rounded-xl"
        />

        <select
          value={isFullDay ? "full" : "timed"}
          onChange={(e) => setIsFullDay(e.target.value === "full")}
          className="bg-white text-black p-3 rounded-xl"
        >
          <option value="full">Full Day</option>
          <option value="timed">Timed Block</option>
        </select>

        {!isFullDay ? (
          <>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-white text-black p-3 rounded-xl"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-white text-black p-3 rounded-xl"
            />
          </>
        ) : null}

        <input
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="bg-white text-black p-3 rounded-xl md:col-span-2"
        />

        <button
          onClick={createBlock}
          disabled={working}
          className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold disabled:opacity-40 md:col-span-2"
        >
          {working ? "Creating…" : "Create Block"}
        </button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-black/10">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-white/80">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookingBlocks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-white/60">
                  No blocks yet.
                </td>
              </tr>
            ) : (
              bookingBlocks.map((block) => (
                <tr key={block.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{block.block_date}</td>
                  <td className="px-4 py-3">
                    {block.is_full_day ? "Full Day" : "Timed"}
                  </td>
                  <td className="px-4 py-3">
                    {block.is_full_day
                      ? "All Day"
                      : `${block.start_time} – ${block.end_time}`}
                  </td>
                  <td className="px-4 py-3">{block.reason ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BookingRowExpanded({
  booking,
  isExpanded,
  onToggle,
}: {
  booking: BookingRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [working, setWorking] = useState<null | "cancel" | "contact" | "reschedule">(null);
  const [message, setMessage] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState(booking.booking_date ?? "");
  const [rescheduleStartTime, setRescheduleStartTime] = useState(
    booking.start_time ? booking.start_time.slice(0, 5) : ""
  );

  const sendCancel = async () => {
    if (!confirm("Cancel this booking and email the client?")) return;

    setWorking("cancel");
    try {
      const res = await fetch("/api/admin/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to cancel booking");

      alert("Booking cancelled and client emailed ✅");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Something went wrong");
    } finally {
      setWorking(null);
    }
  };

  const sendContact = async () => {
    if (!message.trim()) {
      alert("Please enter a message first.");
      return;
    }

    setWorking("contact");
    try {
      const res = await fetch("/api/admin/bookings/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          message: message.trim(),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to send message");

      alert("Message sent to client ✅");
      setMessage("");
    } catch (e: any) {
      alert(e?.message || "Something went wrong");
    } finally {
      setWorking(null);
    }
  };

  const sendReschedule = async () => {
    if (!rescheduleDate || !rescheduleStartTime) {
      alert("Please choose a new date and time.");
      return;
    }

    setWorking("reschedule");
    try {
      const res = await fetch("/api/admin/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          booking_date: rescheduleDate,
          start_time: rescheduleStartTime,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to reschedule booking");

      alert("Booking rescheduled and client emailed ✅");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Something went wrong");
    } finally {
      setWorking(null);
    }
  };

  return (
    <>
      <tr
        className="border-t border-white/10 text-white/85 cursor-pointer hover:bg-white/5 transition"
        onClick={onToggle}
      >
        <td className="px-4 py-3">{fmtDate(booking.booking_date)}</td>
        <td className="px-4 py-3">
          {formatTime(booking.start_time)}
          {booking.end_time ? ` – ${formatTime(booking.end_time)}` : ""}
        </td>
        <td className="px-4 py-3">{booking.booking_type ?? "—"}</td>
        <td className="px-4 py-3">{booking.people_count ?? "—"}</td>
        <td className="px-4 py-3">{booking.status ?? "—"}</td>
        <td className="px-4 py-3">{getBookingEmail(booking) ?? "—"}</td>
        <td className="px-4 py-3">{booking.customer_phone ?? "—"}</td>
        <td className="px-4 py-3">{formatMoney(booking.total_amount_cents)}</td>
      </tr>

      {isExpanded ? (
        <tr className="border-t border-white/10 bg-white/5">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid gap-2 text-sm text-white/80">
              <div>
                <span className="text-white/60">Booking ID:</span>{" "}
                <span className="text-white">{String(booking.id)}</span>
              </div>
              <div>
                <span className="text-white/60">User ID:</span>{" "}
                <span className="text-white">{booking.user_id ?? "—"}</span>
              </div>
              <div>
                <span className="text-white/60">Duration:</span>{" "}
                <span className="text-white">{booking.duration_minutes ?? "—"} mins</span>
              </div>
              <div>
                <span className="text-white/60">Booking type:</span>{" "}
                <span className="text-white">{booking.booking_type ?? "—"}</span>
              </div>
              <div>
                <span className="text-white/60">Status:</span>{" "}
                <span className="text-white">{booking.status ?? "—"}</span>
              </div>
              <div>
                <span className="text-white/60">Email:</span>{" "}
               <span className="text-white">{getBookingEmail(booking) ?? "—"}</span>
              </div>
              <div>
                <span className="text-white/60">Phone:</span>{" "}
                <span className="text-white">{booking.customer_phone ?? "—"}</span>
              </div>
              <div>
                <span className="text-white/60">Amount:</span>{" "}
                <span className="text-white">{formatMoney(booking.total_amount_cents)}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={sendCancel}
                  disabled={working !== null}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 font-semibold disabled:opacity-50"
                >
                  {working === "cancel" ? "Cancelling…" : "Cancel booking"}
                </button>

                <button
                  onClick={sendReschedule}
                  disabled={working !== null}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold disabled:opacity-50"
                >
                  {working === "reschedule" ? "Rescheduling…" : "Reschedule booking"}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="bg-white text-black p-3 rounded-xl"
                />
                <input
                  type="time"
                  value={rescheduleStartTime}
                  onChange={(e) => setRescheduleStartTime(e.target.value)}
                  className="bg-white text-black p-3 rounded-xl"
                />
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message to client…"
                rows={4}
                className="w-full bg-white text-black p-3 rounded-xl"
              />

              <div>
                <button
                  onClick={sendContact}
                  disabled={working !== null}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold disabled:opacity-50"
                >
                  {working === "contact" ? "Sending…" : "Contact client"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
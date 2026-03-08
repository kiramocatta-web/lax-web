import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminDashboardClient from "@/components/AdminDashboardClient";

type AdminProfileRow = {
  id: string;
  role: string | null;
  is_admin: boolean | null;
  email: string | null;
  phone: string | null;
};

type MemberRow = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  membership_plan: string | null;
  membership_status: string | null;
  membership_expires_at: string | null;
  stripe_current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

type BookingBaseRow = {
  id: string | number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  booking_type: string | null;
  status: string | null;
  customer_phone: string | null;
  total_amount_cents: number | null;
  user_id: string | null;
};

type BookingProfileRow = {
  id: string;
  email: string | null;
  phone: string | null;
};

type BookingRow = {
  id: string | number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  booking_type: string | null;
  status: string | null;
  customer_phone: string | null;
  total_amount_cents: number | null;
  user_id: string | null;
  profiles:
    | {
        email: string | null;
        phone: string | null;
      }
    | null;
};

type AffiliateBaseRow = {
  user_id: string;
  code: string | null;
  used_count: number | null;
  credit_cents: number | null;
  visits_count: number | null;
  is_active: boolean | null;
  accumulated_payout_cents: number | null;
  last_paid_at: string | null;
  last_paid_amount_cents: number | null;
};

type AffiliateProfileRow = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
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
  last_code_use_at: string | null;
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

type AffiliateUsageRow = {
  affiliate_user_id: string | null;
  used_at: string | null;
};

type ComebackBookingRow = {
  user_id: string | null;
  customer_email: string | null;
  booking_date: string | null;
  status: string | null;
};

type ComebackProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  membership_plan: string | null;
  membership_status: string | null;
};

function logSupabaseError(label: string, error: unknown) {
  const e = error as
    | {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      }
    | null;

  console.error(`${label} failed`);
  console.error("message:", e?.message ?? null);
  console.error("details:", e?.details ?? null);
  console.error("hint:", e?.hint ?? null);
  console.error("code:", e?.code ?? null);
}

function daysSince(dateString: string) {
  const now = new Date();
  const start = new Date(`${dateString}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default async function AdminPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,is_admin,email,phone")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    if (profileError) {
      logSupabaseError("Admin profile query", profileError);
    }
    redirect("/profile");
  }

  const profile = profileData as AdminProfileRow;

  const isAdmin =
    Boolean(profile.is_admin) ||
    String(profile.role ?? "").toLowerCase() === "admin";

  if (!isAdmin) {
    redirect("/profile");
  }

  const { data: membersRaw, error: membersError } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "email",
        "phone",
        "role",
        "membership_plan",
        "membership_status",
        "membership_expires_at",
        "stripe_current_period_end",
        "stripe_customer_id",
        "stripe_subscription_id",
      ].join(",")
    )
    .neq("role", "affiliate")
    .not("membership_plan", "is", null)
    .order("email", { ascending: true });

  if (membersError) {
    logSupabaseError("Members query", membersError);
  }

  const membersData: MemberRow[] = (membersRaw ?? []).map((row: any) => ({
  id: String(row.id),
  email: row.email ?? null,
  phone: row.phone ?? null,
  role: row.role ?? null,
  membership_plan: row.membership_plan ?? null,
  membership_status: row.membership_status ?? null,
  membership_expires_at: row.membership_expires_at ?? null,
  stripe_current_period_end: row.stripe_current_period_end ?? null,
  stripe_customer_id: row.stripe_customer_id ?? null,
  stripe_subscription_id: row.stripe_subscription_id ?? null,
}));

  const { data: bookingsBaseRaw, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id,booking_date,start_time,end_time,duration_minutes,people_count,booking_type,status,customer_phone,total_amount_cents,user_id"
    )
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(100);

  if (bookingsError) {
    logSupabaseError("Bookings query", bookingsError);
  }

  const bookingsBaseData: BookingBaseRow[] = (bookingsBaseRaw ?? []) as BookingBaseRow[];

  const bookingUserIds = Array.from(
    new Set(
      bookingsBaseData
        .map((booking) => booking.user_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let bookingProfilesMap = new Map<string, BookingProfileRow>();

  if (bookingUserIds.length > 0) {
    const { data: bookingProfilesRaw, error: bookingProfilesError } =
      await supabase
        .from("profiles")
        .select("id,email,phone")
        .in("id", bookingUserIds);

    if (bookingProfilesError) {
      logSupabaseError("Booking profiles query", bookingProfilesError);
    } else {
      const bookingProfilesData = (bookingProfilesRaw ?? []) as BookingProfileRow[];

      bookingProfilesMap = new Map(
        bookingProfilesData.map((profileRow) => [profileRow.id, profileRow])
      );
    }
  }

  const { data: affiliatesBaseRaw, error: affiliatesError } = await supabase
    .from("affiliates")
    .select(
      "user_id,code,used_count,credit_cents,visits_count,is_active,accumulated_payout_cents,last_paid_at,last_paid_amount_cents"
    )
    .order("used_count", { ascending: false });

  if (affiliatesError) {
    logSupabaseError("Affiliates query", affiliatesError);
  }

  const affiliatesBaseData: AffiliateBaseRow[] = (affiliatesBaseRaw ?? []) as AffiliateBaseRow[];

  const affiliateUserIds = Array.from(
    new Set(
      affiliatesBaseData
        .map((affiliate) => affiliate.user_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let affiliateProfilesMap = new Map<string, AffiliateProfileRow>();

  if (affiliateUserIds.length > 0) {
    const { data: affiliateProfilesRaw, error: affiliateProfilesError } =
      await supabase
        .from("profiles")
        .select("id,email,phone,full_name")
        .in("id", affiliateUserIds);

    if (affiliateProfilesError) {
      logSupabaseError("Affiliate profiles query", affiliateProfilesError);
    } else {
      const affiliateProfilesData = (affiliateProfilesRaw ?? []) as AffiliateProfileRow[];

      affiliateProfilesMap = new Map(
        affiliateProfilesData.map((profileRow) => [profileRow.id, profileRow])
      );
    }
  }

  const { data: affiliateUsageRaw, error: affiliateUsageError } = await supabase
    .from("affiliate_code_uses")
    .select("affiliate_user_id,used_at")
    .order("used_at", { ascending: false });

  if (affiliateUsageError) {
    logSupabaseError("Affiliate usage query", affiliateUsageError);
  }

  const affiliateUsageData: AffiliateUsageRow[] = (affiliateUsageRaw ?? []) as AffiliateUsageRow[];

  const latestAffiliateUseMap = new Map<string, string>();

  for (const row of affiliateUsageData) {
    const affiliateUserId = String(row.affiliate_user_id ?? "");
    const usedAt = String(row.used_at ?? "");

    if (affiliateUserId && usedAt && !latestAffiliateUseMap.has(affiliateUserId)) {
      latestAffiliateUseMap.set(affiliateUserId, usedAt);
    }
  }

  const { data: bookingBlocksRaw, error: bookingBlocksError } = await supabase
    .from("booking_blocks")
    .select("id,block_date,is_full_day,start_time,end_time,reason,created_at")
    .order("block_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (bookingBlocksError) {
    logSupabaseError("Booking blocks query", bookingBlocksError);
  }

  const bookingBlocks: BookingBlockRow[] = (bookingBlocksRaw ?? []) as BookingBlockRow[];

  const { data: stripeSubsRaw, error: stripeSubsError } = await supabase
    .from("profiles")
    .select(
      "id,email,phone,membership_plan,membership_status,stripe_customer_id,stripe_subscription_id,stripe_current_period_end"
    )
    .not("stripe_subscription_id", "is", null)
    .order("stripe_current_period_end", { ascending: true });

  if (stripeSubsError) {
    logSupabaseError("Stripe subs query", stripeSubsError);
  }

  const stripeSubs: StripeSubRow[] = (stripeSubsRaw ?? []) as StripeSubRow[];

  const { data: comebackBookingsRaw, error: comebackBookingsError } = await supabase
    .from("bookings")
    .select("user_id,customer_email,booking_date,status")
    .eq("status", "confirmed")
    .not("booking_date", "is", null)
    .order("booking_date", { ascending: false });

  if (comebackBookingsError) {
    logSupabaseError("Come back bookings query", comebackBookingsError);
  }

  const comebackBookingsData: ComebackBookingRow[] = (comebackBookingsRaw ?? []) as ComebackBookingRow[];

  const comebackUserIds = Array.from(
    new Set(
      comebackBookingsData
        .map((row) => row.user_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let comebackProfilesMap = new Map<string, ComebackProfileRow>();

  if (comebackUserIds.length > 0) {
    const { data: comebackProfilesRaw, error: comebackProfilesError } =
      await supabase
        .from("profiles")
        .select("id,email,full_name,membership_plan,membership_status")
        .in("id", comebackUserIds);

    if (comebackProfilesError) {
      logSupabaseError("Come back profiles query", comebackProfilesError);
    } else {
      const comebackProfilesData = (comebackProfilesRaw ?? []) as ComebackProfileRow[];

      comebackProfilesMap = new Map(
        comebackProfilesData.map((row) => [row.id, row])
      );
    }
  }

  const comebackMap = new Map<string, ComeBackRecipientRow>();

  for (const row of comebackBookingsData) {
    const bookingDate = String(row.booking_date ?? "");
    const userId = row.user_id ?? null;
    const customerEmail = String(row.customer_email ?? "").trim();

    const profileRow = userId ? comebackProfilesMap.get(userId) : undefined;
    const email = profileRow?.email?.trim() || customerEmail;

    if (!bookingDate || !email) {
      continue;
    }

    const key = userId ? `user:${userId}` : `email:${email.toLowerCase()}`;

    if (comebackMap.has(key)) {
      continue;
    }

    comebackMap.set(key, {
      id: key,
      user_id: userId,
      email,
      name: profileRow?.full_name ?? null,
      last_booking_date: bookingDate,
      days_since_last_booking: daysSince(bookingDate),
      membership_plan: profileRow?.membership_plan ?? null,
      membership_status: profileRow?.membership_status ?? null,
    });
  }

  const { data: comebackTemplatesRaw, error: comebackTemplatesError } =
    await supabase
      .from("email_templates")
      .select("id,name,subject,body,created_at")
      .eq("category", "comeback")
      .order("created_at", { ascending: false });

  if (comebackTemplatesError) {
    logSupabaseError("Come back templates query", comebackTemplatesError);
  }

  const comeBackTemplates: EmailTemplateRow[] = (comebackTemplatesRaw ?? []) as EmailTemplateRow[];

  const now = Date.now();

  const activeMembers: MemberRow[] = membersData.filter((member) => {
    const status = String(member.membership_status ?? "").toLowerCase();

    const expiresAt = member.membership_expires_at
      ? new Date(member.membership_expires_at).getTime()
      : null;

    const stripeEndsAt = member.stripe_current_period_end
      ? new Date(member.stripe_current_period_end).getTime()
      : null;

    const hasFutureExpiry = expiresAt !== null && expiresAt > now;
    const hasFutureStripePeriod = stripeEndsAt !== null && stripeEndsAt > now;

    return (
      status === "active" ||
      status === "trialing" ||
      status === "cancellation_requested" ||
      (status === "cancelled" && hasFutureExpiry) ||
      hasFutureExpiry ||
      hasFutureStripePeriod
    );
  });

  const bookings: BookingRow[] = bookingsBaseData.map((booking) => {
    const matchedProfile = booking.user_id
      ? bookingProfilesMap.get(booking.user_id)
      : undefined;

    return {
      ...booking,
      profiles: matchedProfile
        ? {
            email: matchedProfile.email,
            phone: matchedProfile.phone,
          }
        : null,
    };
  });

  const affiliates: AffiliateRow[] = affiliatesBaseData.map((affiliate) => {
    const matchedProfile = affiliateProfilesMap.get(affiliate.user_id);

    return {
      ...affiliate,
      last_code_use_at: latestAffiliateUseMap.get(affiliate.user_id) ?? null,
      profiles: matchedProfile
        ? {
            email: matchedProfile.email,
            phone: matchedProfile.phone,
            name: matchedProfile.full_name,
          }
        : null,
    };
  });

  const comeBackRecipients = Array.from(comebackMap.values());

  return (
    <AdminDashboardClient
      adminEmail={profile.email ?? user.email ?? "—"}
      adminPhone={profile.phone ?? "—"}
      activeMembers={activeMembers}
      bookings={bookings}
      affiliates={affiliates}
      bookingBlocks={bookingBlocks}
      stripeSubs={stripeSubs}
      comeBackRecipients={comeBackRecipients}
      comeBackTemplates={comeBackTemplates}
    />
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Profile = {
  id: string;
  is_admin: boolean | null;
  role: string | null;
  membership_status: string | null;
  membership_expires_at: string | null;
};

export default function MembersGatePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    (async () => {
      // 1) Must be logged in
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session?.user) {
        router.replace("/membership");
        return;
      }

      // 2) Load profile (admin + role + membership status)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id,is_admin,role,membership_status,membership_expires_at")
        .eq("id", session.user.id)
        .single<Profile>();

      if (error || !profile) {
        router.replace("/membership");
        return;
      }

      const role = String(profile.role ?? "").toLowerCase();

      // ✅ Admin bypass
      if (profile.is_admin) {
        router.replace("/book");
        return;
      }

      // ✅ Affiliate bypass
      if (role === "affiliate") {
        router.replace("/book");
        return;
      }

      // 3) Membership rules (members only)
      const isActive = profile.membership_status === "active";

      const notExpired =
        !profile.membership_expires_at ||
        new Date(profile.membership_expires_at).getTime() > Date.now();

      if (isActive && notExpired) {
        router.replace("/book");
        return;
      }

      router.replace("/membership");
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center">
      <div className="text-white/80">Loading…</div>
    </div>
  );
}
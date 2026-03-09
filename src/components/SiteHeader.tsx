"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type ProfileRow = {
  role: string | null;
  membership_status: string | null;
  membership_plan: string | null;
};

export default function SiteHeader() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [memberHref, setMemberHref] = useState("/membership");
  const [profileHref, setProfileHref] = useState("/login");

  useEffect(() => {
    let mounted = true;

    async function loadHeaderLinks() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const userId = session?.user?.id ?? null;

        if (!userId) {
          setMemberHref("/membership");
          setProfileHref("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role,membership_status,membership_plan")
          .eq("id", userId)
          .maybeSingle<ProfileRow>();

        if (!mounted) return;

        if (error) {
          console.error("[SiteHeader] profile fetch error:", error);
          setMemberHref("/membership");
          setProfileHref("/profile");
          return;
        }

        const role = String(profile?.role ?? "").toLowerCase().trim();
        const status = String(profile?.membership_status ?? "").toLowerCase().trim();
        const plan = String(profile?.membership_plan ?? "").toLowerCase().trim();

        const isAffiliate = role === "affiliate";
        const isMember =
          status === "active" ||
          status === "trialing" ||
          status === "cancellation_requested" ||
          plan === "pass7" ||
          plan === "weekly";

        setMemberHref(isAffiliate || isMember ? "/book/members" : "/membership");
        setProfileHref("/profile");
      } catch (err) {
        console.error("[SiteHeader] loadHeaderLinks error:", err);
        if (mounted) {
          setMemberHref("/membership");
          setProfileHref("/login");
        }
      }
    }

    loadHeaderLinks();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadHeaderLinks();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-home.png"
            alt="Lax N Lounge"
            width={160}
            height={50}
            className="h-auto w-[120px] sm:w-[145px]"
            priority
          />
        </Link>

        <nav className="flex items-center gap-4 text-sm text-white sm:gap-6 sm:text-base">
          <Link href={memberHref} className="transition hover:text-white/70">
            MEMBER
          </Link>

          <Link href="/book/single" className="transition hover:text-white/70">
            SINGLE
          </Link>

          <Link href={profileHref} className="transition hover:text-white/70">
            PROFILE
          </Link>
        </nav>
      </div>
    </header>
  );
}
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
  const [loading, setLoading] = useState(true);

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
          setLoading(false);
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
          setLoading(false);
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
      } finally {
        if (mounted) {
          setLoading(false);
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/lax-logo.png"
            alt="Lax N Lounge"
            width={140}
            height={40}
            className="h-auto w-[120px] sm:w-[140px]"
            priority
          />
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base text-white">
          <Link href="/" className="transition hover:text-white/70">
            Home
          </Link>

          <Link href={memberHref} className="transition hover:text-white/70">
            Member
          </Link>

          <Link href="/book/single" className="transition hover:text-white/70">
            Single
          </Link>

          <Link href={loading ? "/login" : profileHref} className="transition hover:text-white/70">
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
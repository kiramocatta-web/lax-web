"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { usePathname } from "next/navigation";
import Image from "next/image";

type ProfileRow = {
  membership_plan: string | null;
};

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [memberHref, setMemberHref] = useState("/membership");
  const [singleHref, setSingleHref] = useState("/book/single");
  const [profileHref, setProfileHref] = useState("/profile");

  useEffect(() => {
    let mounted = true;

    async function loadHeaderState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setMemberHref("/membership");
        setSingleHref("/book/single");
        setProfileHref("/profile");
        return;
      }

      setSingleHref("/book/single");
      setProfileHref("/profile");

      const { data: profile } = await supabase
        .from("profiles")
        .select("membership_plan")
        .eq("id", session.user.id)
        .maybeSingle<ProfileRow>();

      if (!mounted) return;

      const isMember = !!profile?.membership_plan;
      setMemberHref(isMember ? "/book/members" : "/membership");
    }

    loadHeaderState();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <header className="relative z-50 w-full bg-emerald-950">
      <div className="mx-auto flex h-24 max-w-7xl items-center gap-3 px-4 sm:px-8">
        <a href="/" className="shrink-0">
          <Image
            src="/logo-home.png"
            alt="Lax N Lounge"
            width={170}
            height={90}
            priority
            className="h-auto w-[88px] sm:w-[110px] md:w-[140px]"
          />
        </a>

        <nav className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max items-center justify-end gap-4 whitespace-nowrap text-sm font-light uppercase tracking-[0.08em] text-white sm:gap-6 sm:text-base md:gap-10 md:text-xl">
            <a href={memberHref} className="shrink-0 hover:text-white/75">
              MEMBER
            </a>

            <a href={singleHref} className="shrink-0 hover:text-white/75">
              SINGLE
            </a>

            <a href={profileHref} className="shrink-0 hover:text-white/75">
              PROFILE
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
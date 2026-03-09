"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

type ProfileRow = {
  membership_plan: string | null;
};

export default function HomePageHeader() {
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
  const [profileHref, setProfileHref] = useState("/login");

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
        setProfileHref("/login");
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-black backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 sm:px-8">
        <a href="/" className="shrink-0">
          <Image
            src="/logo-home.png"
            alt="Lax N Lounge"
            width={170}
            height={90}
            priority
            className="h-auto w-[120px] sm:w-[150px]"
          />
        </a>

        <nav className="flex items-center gap-6 text-xl font-light uppercase tracking-[0.08em] text-white sm:gap-10">
          <a href={memberHref} className="hover:text-white/75">
            MEMBER
          </a>

          <a href={singleHref} className="hover:text-white/75">
            SINGLE
          </a>

          <a href={profileHref} className="hover:text-white/75">
            PROFILE
          </a>
        </nav>
      </div>
    </header>
  );
}
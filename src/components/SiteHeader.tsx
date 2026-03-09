"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { usePathname } from "next/navigation";
import Image from "next/image";

type ProfileRow = {
  role: string | null;
  membership_plan: string | null;
};

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [loggedIn, setLoggedIn] = useState(false);
  const [bookingHref, setBookingHref] = useState("/book/single");

  useEffect(() => {
    let mounted = true;

    async function loadHeaderState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setLoggedIn(false);
        setBookingHref("/book/single");
        return;
      }

      setLoggedIn(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("membership_plan")
        .eq("id", session.user.id)
        .maybeSingle<ProfileRow>();

      if (!mounted) return;

      const isMember = !!profile?.membership_plan;
      setBookingHref(isMember ? "/book/members" : "/book/single");
    }

    loadHeaderState();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <header
      className={[
        isHome
          ? "absolute top-0 left-0 right-0 z-50"
          : "relative z-50",
        "w-full bg-emerald-950/90 backdrop-blur"
      ].join(" ")}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 sm:px-8">
        <a href="/" className="shrink-0">
          <Image
            src="/logo-header.png"
            alt="Lax N Lounge"
            width={150}
            height={70}
            priority
            className="h-auto w-[120px] sm:w-[150px]"
          />
        </a>

        <nav className="flex items-center gap-6 text-lg font-light uppercase tracking-[0.08em] text-white sm:gap-10 sm:text-xl">
          <a href="/members" className="hover:text-white/75">
            Member
          </a>
          <a href={bookingHref} className="hover:text-white/75">
            Single
          </a>
          <a href={loggedIn ? "/profile" : "/login"} className="hover:text-white/75">
            Profile
          </a>
        </nav>
      </div>
    </header>
  );
}
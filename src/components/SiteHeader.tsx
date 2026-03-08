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
  const [scrolled, setScrolled] = useState(false);

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
        .select("role,membership_plan")
        .eq("id", session.user.id)
        .maybeSingle<ProfileRow>();

      const role = String(profile?.role ?? "").toLowerCase();
      const membershipPlan = String(profile?.membership_plan ?? "").toLowerCase();

      const isAffiliate = role === "affiliate";
      const isMember = ["weekly", "pass7"].includes(membershipPlan);

      setBookingHref(isAffiliate || isMember ? "/book" : "/book/single");
    }

    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }

    loadHeaderState();
    handleScroll();
    window.addEventListener("scroll", handleScroll);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadHeaderState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [supabase]);

  return (
    <header
      className={[
        isHome
          ? "fixed top-0 left-0 right-0 z-50"
          : "sticky top-0 z-50",
        "transition-all duration-300",
        isHome
          ? scrolled
            ? "bg-black/25 backdrop-blur-md border-b border-white/10"
            : "bg-black/10 border-b border-transparent"
          : "bg-emerald-950 border-b border-white/10",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 sm:px-8">
        <a href="/" className="flex items-center">
          <Image
            src="/logo-home.png"
            alt="Lax N Lounge"
            width={220}
            height={100}
            priority
            className="h-10 w-auto sm:h-12 md:h-14"
          />
        </a>

        <nav className="hidden md:flex items-center gap-50 text-sm uppercase tracking-[0.12em] text-white/90">
          <a href={bookingHref} className="transition hover:text-white">
            Book
          </a>
          <a href="/profile" className="transition hover:text-white">
            Profile
          </a>
        </nav>

        {!loggedIn ? (
          <a
            href="/login"
            className="hidden md:flex items-center text-sm uppercase tracking-[0.12em] text-white/90"
          >
            Log in
          </a>
        ) : (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="hidden md:flex items-center text-sm uppercase tracking-[0.12em] text-white/90"
          >
            Log out
          </button>
        )}
      </div>
    </header>
  );
}
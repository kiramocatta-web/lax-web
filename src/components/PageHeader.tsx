"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

export default function PageHeader() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadHeaderState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setLoggedIn(!!session?.user);
    }

    loadHeaderState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadHeaderState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1b1512]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center">
          <Image
            src="/logo-home.png"
            alt="Lax N Lounge"
            width={220}
            height={100}
            priority
            className="h-12 w-auto sm:h-14 md:h-16"
          />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-[0.12em] text-white/90">
          <a href="/book" className="transition hover:text-white">
            Book
          </a>
          <a href="/profile" className="transition hover:text-white">
            Profile
          </a>
        </nav>

        {!loggedIn ? (
          <a
            href="/login"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Log in
          </a>
        ) : (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Log out
          </button>
        )}
      </div>
    </header>
  );
}
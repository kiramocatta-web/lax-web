"use client";

import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 text-3xl">
            ✓
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Thank You
            </h1>

          <div className="mt-8 grid gap-3">
            <Link
              href="/profile"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 text-center text-lg font-semibold text-white transition hover:bg-emerald-500"
            >
              Go to profile
            </Link>

            <Link
              href="/book"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-5 py-4 text-center font-semibold text-white transition hover:bg-white/20"
            >
              Book again
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
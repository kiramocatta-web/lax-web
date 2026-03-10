"use client";

import { useEffect } from "react";

export default function BookingThankYouPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/lax-thank-you.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-semibold">
            Thank you.
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/90">
            Your session awaits.
          </p>
        </div>
      </div>
    </div>
  );
}

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
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/lax-thank-you.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Thank you
          </h1>

          <p className="mt-4 text-lg text-white/90 sm:text-xl">
            Your session awaits.
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";

export default function MembershipSuccessPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/book";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-4xl sm:text-5xl font-semibold">
          Membership Confirmed
        </h1>

        <p className="mt-4 text-lg text-white/80">
          Redirecting to bookings portal...
        </p>
      </div>
    </div>
  );
}
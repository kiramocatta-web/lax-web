"use client";

import { useEffect } from "react";

export default function MembershipThankYouPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/book";
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold">
          Thank you for purchasing a membership!
        </h1>
        
      </div>
    </div>
  );
}

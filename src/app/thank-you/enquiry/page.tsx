"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function EnquiryThankYouPageContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (from === "cancel") {
        window.location.href = "/profile";
      } else {
        window.location.href = "/";
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [from]);

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold">Thank you</h1>

        <p className="mt-4 text-lg text-white/80">
          {from === "cancel"
            ? "Your cancellation request has been sent. Our team will review it shortly."
            : "Your enquiry has been sent. The team will get back to you shortly."}
        </p>

        <p className="mt-6 text-sm text-white/60">Redirecting shortly...</p>
      </div>
    </div>
  );
}

export default function EnquiryThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center px-6">
          <div className="max-w-xl text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold">Thank you</h1>
            <p className="mt-6 text-sm text-white/60">Loading...</p>
          </div>
        </div>
      }
    >
      <EnquiryThankYouPageContent />
    </Suspense>
  );
}
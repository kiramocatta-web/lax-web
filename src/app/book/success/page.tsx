import { Suspense } from "react";
import BookSuccessClient from "./BookSuccessClient";

export default function BookSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-emerald-950 text-white">
          <div className="max-w-xl mx-auto px-6 py-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold">
              Confirming Booking...
            </h1>
          </div>
        </div>
      }
    >
      <BookSuccessClient />
    </Suspense>
  );
}
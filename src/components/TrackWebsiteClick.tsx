"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getVisitorId() {
  const key = "lax_visitor_id";
  let existing = localStorage.getItem(key);

  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(key, created);
  return created;
}

export default function TrackWebsiteClick() {
  const pathname = usePathname();

  useEffect(() => {
    async function track() {
      try {
        const visitorId = getVisitorId();

        await fetch("/api/track-click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-track-secret": process.env.NEXT_PUBLIC_TRACKING_SECRET ?? "",
          },
          body: JSON.stringify({
            path: pathname,
            visitor_id: visitorId,
          }),
        });
      } catch (err) {
        console.error("Track click failed:", err);
      }
    }

    track();
  }, [pathname]);

  return null;
}
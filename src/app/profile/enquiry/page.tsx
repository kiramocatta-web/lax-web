"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ProfileEnquiryPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [message, setMessage] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setLoggedEmail(data.session?.user?.email ?? "");
    })();
  }, [supabase]);

  const canSend = Boolean(message.trim());

  const send = async () => {
    if (!canSend) return;

    setSending(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          anonymous: false,
          email: loggedEmail,
          page: window.location.pathname,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to send");
      }

      setMessage("");
      setShowMessageModal(true);
    } catch (e: any) {
      alert(e?.message || "Error sending message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-xl mx-auto px-6 py-10 pb-24">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-white">
            Send us a message
          </h1>

          <p className="mt-2 text-center text-white/70">
            Need help? Send a quick message to the team.
          </p>
        </div>

        <div className="mt-6 bg-white/10 rounded-2xl p-5">
          <div className="mt-4">
            <label className="text-sm text-white/70">Message</label>

            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 w-full bg-white text-black p-3 rounded-xl"
              placeholder="Tell us what you need help with..."
            />
          </div>

          <button
            onClick={send}
            disabled={!canSend || sending}
            className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 transition text-white py-4 rounded-2xl text-lg font-semibold disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>

          <p className="mt-3 text-xs text-white/60">
            Sending as{" "}
            <span className="text-white/80">{loggedEmail || "—"}</span>
          </p>
        </div>
      </div>

      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-emerald-950 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold text-white">
              Message Sent
            </h2>

            <p className="mt-4 text-white/80 leading-relaxed">
              Can&apos;t wait to get in touch with you!
            </p>

            <button
              onClick={() => {
                setShowMessageModal(false);
                window.location.href = "/thank-you/enquiry";
              }}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 px-5 py-3 text-sm font-semibold text-white transition"
            >
              × Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
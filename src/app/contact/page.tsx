"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ContactPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [email, setEmail] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setLoggedEmail(data.session?.user?.email ?? "");
    })();
  }, [supabase]);

  const effectiveEmail = loggedEmail || email.trim();

  const canSend = (() => {
    if (!message.trim()) return false;
    if (anonymous) return true;
    return Boolean(effectiveEmail);
  })();

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
          anonymous,
          email: anonymous ? "" : effectiveEmail,
          page: window.location.pathname,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to send");
      }

      setMessage("");
      setEmail("");
      window.location.href = "/thank-you/enquiry";
    } catch (e: any) {
      alert(e?.message || "Error sending message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex flex-col">
      <main className="flex-1">
        <div className="max-w-xl mx-auto px-6 py-10 pb-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Contact us</h1>
            <p className="mt-2 text-white/70 max-w-md mx-auto">
              Have a question, idea, or feedback? Send us a message.
            </p>
          </div>

          <div className="mt-6 bg-white/10 rounded-2xl p-5">
            {!loggedEmail && !anonymous && (
              <div>
                <label className="text-sm text-white/70">Your email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full bg-white text-black p-3 rounded-xl"
                  placeholder="you@email.com"
                />
              </div>
            )}

            <div className={(!loggedEmail && !anonymous) ? "mt-4" : ""}>
              <label className="text-sm text-white/70">What’s on your mind?</label>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full bg-white text-black p-3 rounded-xl"
                placeholder="Tell us what you’re thinking…"
              />
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              Send anonymously
            </label>

            <button
              onClick={send}
              disabled={!canSend || sending}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 transition text-white py-4 rounded-2xl text-lg font-semibold disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send message →"}
            </button>

            {!anonymous && (
              <p className="mt-3 text-xs text-white/60">
                Sending as{" "}
                <span className="text-white/80">
                  {loggedEmail ? loggedEmail : email || "—"}
                </span>
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 relative z-10 mt-auto border-t border-white/10 bg-black/20 backdrop-blur">
                <div className="max-w-3xl mx-auto px-6 py-4 flex flex-wrap justify-center text-center gap-x-6 gap-y-2 text-sm text-white/70">
                  <a className="hover:text-white" href="/contact">
                    Contact Us
                  </a>
                  <a className="hover:text-white" href="/privacy">
                    Privacy Policy
                  </a>
                  <a className="hover:text-white" href="/disclaimer">
                    Disclaimer
                  </a>
                  <a className="hover:text-white" href="/terms">
                    Terms & Conditions
                  </a>
                  <a className="hover:text-white" href="/cancellation">
                    Cancellation Policy
                  </a>
                  <a className="hover:text-white" href="/health-waiver">
                    Health Waiver
                  </a>
                </div>
              </footer>
    </div>
  );
}
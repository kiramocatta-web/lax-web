"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";

function normalizeCode(input: string) {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export default function AffiliateSignupPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [desiredCode, setDesiredCode] = useState("");
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const codePreview = useMemo(() => normalizeCode(desiredCode), [desiredCode]);

  const submit = async () => {
    setErr("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCode = normalizeCode(desiredCode);

    if (!token) {
      setErr("Invalid invite link.");
      return;
    }

    if (!cleanEmail) {
      setErr("Email is required.");
      return;
    }

    if (!password || password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    if (!cleanCode || cleanCode.length < 3) {
      setErr("Code must be at least 3 characters.");
      return;
    }

    if (cleanCode.length > 20) {
      setErr("Code is too long (max 20).");
      return;
    }

    if (!acceptedAgreement) {
      setErr("You must agree to the affiliate agreement.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/affiliate/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email: cleanEmail,
          password,
          phone: cleanPhone,
          desired_code: cleanCode,
          accepted_affiliate_agreement: acceptedAgreement,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Signup failed");
      }

      router.push("/login?affiliate=created");
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <TopNav />

      <main className="flex-1">
        <div className="max-w-xl mx-auto px-6 py-10 pb-24">
          <h1 className="text-3xl font-semibold">Affiliate Sign Up</h1>

          <p className="mt-2 text-white/70">
            Create your affiliate account and choose your code.
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-5 space-y-4">
            <div>
              <label className="text-sm text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white p-3 text-black"
                placeholder="name@email.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white p-3 text-black"
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white p-3 text-black"
                placeholder="04xx xxx xxx"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">
                Desired affiliate code
              </label>
              <input
                value={desiredCode}
                onChange={(e) => setDesiredCode(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white p-3 text-black uppercase"
                placeholder="e.g. KINGKIRA"
                autoCapitalize="characters"
                autoCorrect="off"
              />

              <div className="mt-2 text-xs text-white/60">
                Preview:{" "}
                <span className="font-semibold text-white">
                  {codePreview || "—"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <label className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
                <input
                  type="checkbox"
                  checked={acceptedAgreement}
                  onChange={(e) => setAcceptedAgreement(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20"
                />

                <span>
                  I have read and agree to the{" "}
                  <a
                    href="/affiliate-agreement"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-white underline underline-offset-2 hover:text-white/80"
                  >
                    Affiliate Agreement
                  </a>
                  .
                </span>
              </label>
            </div>

            {err ? <div className="text-sm text-red-300">{err}</div> : null}

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 py-4 text-lg font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create affiliate account"}
            </button>

            <p className="text-center text-xs text-white/50">
              This page is private. Only people with the invite link can access
              it.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
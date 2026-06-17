"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmail } from "./actions";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);
  const [guestPending, setGuestPending] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/workspace";

  const handleGuestAccess = async () => {
    setGuestPending(true);
    setGuestError(null);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (res.ok) {
        window.location.href = redirectTo;
      } else {
        setGuestError("Failed to initiate guest session.");
      }
    } catch (err) {
      console.error(err);
      setGuestError("An error occurred during guest authentication.");
    } finally {
      setGuestPending(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-8 select-none">
      <div className="w-full max-w-md double-border">
        <div className="double-border-inner space-y-6">
          {/* Logo / Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display-xl text-3xl text-carbon uppercase tracking-wider">
              Sign In
            </h1>
            <p className="font-metadata text-[10px] text-secondary">
              Sign in to manage your documents and credits
            </p>
          </div>

          <hr className="border-carbon/15" />

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="redirect" value={redirectTo} />
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="font-metadata text-[10px] text-secondary uppercase block"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="john@example.com"
                className="w-full p-2.5 bg-white border border-carbon font-metadata text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="font-metadata text-[10px] text-secondary uppercase block"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full p-2.5 bg-white border border-carbon font-metadata text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {state?.error && (
              <div className="p-3 bg-error-container/20 border border-error/20 text-error font-metadata text-xs rounded-sm">
                {state.error}
              </div>
            )}

            {guestError && (
              <div className="p-3 bg-error-container/20 border border-error/20 text-error font-metadata text-xs rounded-sm">
                {guestError}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || guestPending}
              className="w-full py-3 bg-carbon text-surface font-label-bold text-xs uppercase hover:bg-primary transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <span>{isPending ? "Signing in..." : "Sign In"}</span>
              {!isPending && (
                <span className="material-symbols-outlined text-[16px]">
                  login
                </span>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-carbon/10"></div>
              <span className="flex-shrink mx-4 text-secondary text-[9px] uppercase font-metadata">or</span>
              <div className="flex-grow border-t border-carbon/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGuestAccess}
              disabled={isPending || guestPending}
              className="w-full py-3 border border-carbon text-carbon font-label-bold text-xs uppercase hover:bg-surface-container-high transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <span>{guestPending ? "Accessing..." : "Continue as Guest"}</span>
              {!guestPending && (
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          <hr className="border-carbon/15" />

          {/* Footer Toggle Link */}
          <div className="text-center font-metadata text-[10px] uppercase text-secondary space-y-2">
            <div>
              New to MORPEE?{" "}
              <Link
                href="/auth/sign-up"
                className="text-primary font-bold hover:underline"
              >
                Register
              </Link>
            </div>
            <div>
              <Link href="/" className="hover:underline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

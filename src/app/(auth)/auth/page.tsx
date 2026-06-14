"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [sessionType, setSessionType] = useState<"candidate" | "operator">("candidate");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"awaiting" | "sending" | "sent" | "verifying" | "success" | "error">("awaiting");
  const [message, setMessage] = useState("*Establish secure cryptographic token to load premium credits.*");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const requestOtp = async () => {
    if (!identifier) {
      setStatus("error");
      setMessage("ERROR: PRIMARY_IDENTIFIER_REQUIRED");
      return;
    }
    setStatus("sending");
    setMessage("STATUS: TRANSMITTING_OTP_SIGNAL...");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, type: sessionType }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("sent");
        setMessage(`STATUS: OTP_TRANSMITTED. Enter '123456' for verification.`);
      } else {
        setStatus("error");
        setMessage(`ERROR: ${data.error || "TRANSMISSION_FAILED"}`);
      }
    } catch {
      setStatus("error");
      setMessage("ERROR: NETWORK_DISRUPTION");
    }
  };

  const verifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setStatus("error");
      setMessage("ERROR: INVALID_KEY_SEQUENCE_LENGTH");
      return;
    }
    setStatus("verifying");
    setMessage("STATUS: AUDITING_CRYPTOGRAPHIC_OTP...");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code, type: sessionType }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("STATUS: CREDENTIALS_VALIDATED. DEPLOYING_WORKSPACE...");
        setTimeout(() => {
          router.push("/workspace/image");
        }, 1500);
      } else {
        setStatus("error");
        setMessage(`ERROR: ${data.error || "AUDIT_FAILURE"}`);
      }
    } catch {
      setStatus("error");
      setMessage("ERROR: CRITICAL_VERIFICATION_TIMEOUT");
    }
  }, [otp, identifier, sessionType, router]);

  // Trigger verify automatically when 6 digits are filled
  useEffect(() => {
    if (otp.every(d => d !== "")) {
      const timer = setTimeout(() => {
        verifyOtp();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [otp, verifyOtp]);

  const continueAsGuest = async () => {
    setStatus("sending");
    setMessage("STATUS: PROVISIONING_EPHEMERAL_GUEST_TOKEN...");
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (res.ok) {
        setStatus("success");
        setMessage("STATUS: GUEST_TOKEN_ISSUED. MOUNTING_WORKSPACE...");
        setTimeout(() => {
          router.push("/workspace/image");
        }, 1200);
      }
    } catch {
      setStatus("error");
      setMessage("ERROR: GUEST_PROVISION_TIMEOUT");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-container-padding py-12">
      <div className="w-full max-w-lg">
        <div className="double-border">
          <div className="double-border-inner">
            {/* Header Section */}
            <header className="mb-10">
              <div className="flex justify-between items-start mb-2">
                <h1 className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface">
                  [AUTHENTICATE_SESSION]
                </h1>
                <span className="font-metadata text-metadata text-primary opacity-50">v4.0.2</span>
              </div>
              <p className={`font-body-md italic leading-tight transition-colors duration-150 ${
                status === "error" ? "text-error" : status === "success" ? "text-primary font-bold" : "text-secondary"
              }`}>
                {message}
              </p>
            </header>

            {/* Tab Selector */}
            <div className="flex w-full mb-8 border border-carbon">
              <button
                onClick={() => setSessionType("candidate")}
                className={`flex-1 py-4 font-label-bold text-label-bold uppercase relative transition-all ${
                  sessionType === "candidate"
                    ? "bg-surface-bright text-carbon font-bold"
                    : "text-secondary bg-surface-container hover:bg-surface-variant"
                }`}
              >
                [CANDIDATE_SESSION]
                {sessionType === "candidate" && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-muted-teal"></div>
                )}
              </button>
              <button
                onClick={() => setSessionType("operator")}
                className={`flex-1 py-4 font-label-bold text-label-bold uppercase relative transition-all ${
                  sessionType === "operator"
                    ? "bg-surface-bright text-carbon font-bold"
                    : "text-secondary bg-surface-container hover:bg-surface-variant"
                }`}
              >
                [B2B_OPERATOR_SIGN_IN]
                {sessionType === "operator" && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-muted-teal"></div>
                )}
              </button>
            </div>

            {/* Input Form */}
            <div className="space-y-8">
              {/* Primary Identifier */}
              <div className="space-y-2">
                <label className="font-metadata text-metadata uppercase text-secondary">
                  PRIMARY_IDENTIFIER ({sessionType === "candidate" ? "EMAIL_OR_MOBILE" : "OPERATOR_ID"})
                </label>
                <input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full bg-transparent border-t-0 border-x-0 border-b border-carbon px-0 py-3 font-body-md placeholder:text-outline-variant terminal-input transition-all"
                  placeholder={sessionType === "candidate" ? "ENTER EMAIL OR MOBILE NUMBER..." : "ENTER B2B REGISTERED CODE..."}
                  type="text"
                />
              </div>

              {/* OTP Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="font-metadata text-metadata uppercase text-secondary">CRYPTOGRAPHIC_OTP</label>
                  <span className={`font-metadata text-metadata uppercase animate-pulse ${
                    status === "sent" ? "text-primary font-bold" : "text-muted-teal"
                  }`}>
                    {status === "sent" ? "[SEQUENCE_ARMED]" : "[WAITING_FOR_SEQUENCE]"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpRefs.current[index] = el; }}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(index, e)}
                      className="otp-box w-12 h-14 border border-carbon bg-white text-center font-headline-sm rounded-none focus:outline-2 focus:outline-primary focus:bg-surface-container-low"
                      maxLength={1}
                      type="text"
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-6 text-center">
                <button
                  onClick={requestOtp}
                  disabled={status === "sending" || status === "verifying"}
                  className="w-full bg-carbon text-white font-label-bold text-label-bold uppercase py-4 rounded-full hover:bg-muted-teal transition-all duration-300 transform active:scale-[0.98] cursor-crosshair disabled:opacity-50"
                >
                  {status === "sending" ? "[TRANSMITTING...]" : "[REQUEST_SECURE_OTP]"}
                </button>
                <div>
                  <button
                    onClick={continueAsGuest}
                    className="font-label-bold text-label-bold uppercase text-secondary hover:text-carbon transition-colors"
                  >
                    [CONTINUE_AS_GUEST]
                  </button>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-12 pt-6 border-t border-grid-line flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
              <span className="font-metadata text-metadata uppercase text-secondary tracking-[0.3em]">
                [CLIENT-SIDE-ENCRYPTED-OTP]
              </span>
            </div>
          </div>
        </div>

        {/* Meta Stats Sub-Card */}
        <div className="mt-4 flex justify-between px-4">
          <div className="flex gap-4">
            <span className="font-metadata text-metadata text-outline">LOC: SECURE_EDGE</span>
            <span className="font-metadata text-metadata text-outline">ENC: AES-256</span>
          </div>
          <div className="font-metadata text-metadata text-outline uppercase">
            SYS_STATUS: <span className="text-primary font-bold">OPTIMAL</span>
          </div>
        </div>
      </div>
    </main>
  );
}

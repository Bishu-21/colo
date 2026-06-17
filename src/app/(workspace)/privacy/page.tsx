"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[4xl] mx-auto min-h-screen bg-white border-x border-outline">
      <div className="p-8 space-y-6">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            Privacy Policy
          </h1>
          <p className="font-body-md text-secondary italic">
            Last Updated: June 16, 2026
          </p>
        </div>

        <div className="space-y-4 font-body-md text-on-surface-variant text-sm leading-relaxed">
          <p>
            At MORPEE, privacy is not a feature—it is our core foundation. This Privacy Policy details how we handle user data and documents.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            1. Zero-Upload Document Policy
          </h3>
          <p>
            MORPEE uses a secure hybrid architecture. When you upload a passport photograph, signature scan, or certificate PDF for resizing or compression:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The files are loaded into your browser and sent over an encrypted HTTPS connection to our processing servers.</li>
            <li>Processing (resizing, metadata stripping, PDF downsampling, edge detection, perspective warping) is executed on our secure servers using authenticated sessions.</li>
            <li>Processed files are held only in volatile server memory during the operation and are not written to persistent storage. Your originals remain on your device.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            2. Information We Collect
          </h3>
          <p>
            To facilitate user accounts, subscription access, and payments, we collect the following minimum credentials:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Identifiers</strong>: Your registered Email address or Mobile number during OTP login.</li>
            <li><strong>Billing & Transactions</strong>: Razorpay transaction IDs, billing amounts, plan packages, and billing dates.</li>
            <li><strong>Telemetry</strong>: Basic performance analytics, such as WebAssembly support status, browser agents, and error tracking, to optimize execution across target devices.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            3. Use of Cookies
          </h3>
          <p>
            We use secure JWT session cookies (`session`) to maintain user authentication and track credit balances in the browser. 
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The cookies are marked `HttpOnly` and `SameSite=Lax` to prevent client-side script interception (XSS).</li>
            <li>You can clear cookies in your browser settings at any time, which will clear your active session.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            4. Data Sharing and Third Parties
          </h3>
          <p>
            We do not sell, trade, or distribute your email addresses, mobile numbers, or transaction logs to any third-party marketing companies. We coordinate only with verified services to run our app:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Razorpay</strong>: Used as our payment gateway to securely manage billing checkout and credit orders. Your payment details are encrypted directly through Razorpay API connections.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            5. Security Measures
          </h3>
          <p>
            We secure your session tokens and payment validation chains using cryptographic ciphers (SHA-256 HMAC and AES-GCM). The transaction ledger links entries sequentially with cryptographic hash chains to prevent ledger tampering.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            6. Contact Us
          </h3>
          <p>
            If you have questions regarding this Privacy Policy or wish to inspect your registered account credits, please reach out to us at <strong>support@compresseduploads.in</strong>.
          </p>
        </div>

        <div className="pt-8 border-t border-outline-variant mt-12 flex justify-between items-center font-metadata text-metadata">
          <Link href="/" className="text-primary hover:underline font-semibold">[Back to Home]</Link>
          <span>Privacy Shield: Active</span>
        </div>
      </div>
    </main>
  );
}

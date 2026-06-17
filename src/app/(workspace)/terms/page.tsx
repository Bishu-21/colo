"use client";

import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[4xl] mx-auto min-h-screen bg-white border-x border-outline">
      <div className="p-8 space-y-6">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            Terms & Conditions
          </h1>
          <p className="font-body-md text-secondary italic">
            Last Updated: June 16, 2026
          </p>
        </div>

        <div className="space-y-4 font-body-md text-on-surface-variant text-sm leading-relaxed">
          <p>
            Welcome to MORPEE Document Engine (&quot;MORPEE&quot;). These Terms and Conditions govern your access and use of our platform, including our resizers, compressors, and browser-local document processing suites.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            1. Description of Services
          </h3>
          <p>
            MORPEE provides hybrid document processing solutions, including photograph resizing, signature cropping, and PDF file compression, designed to meet the strict upload standards of government application portals. Document processing takes place locally in your browser memory (RAM) utilizing WebAssembly (Wasm) and IndexedDB, while identity verification and ledger logging are synchronized server-side.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            2. User Accounts and Credits
          </h3>
          <p>
            To use premium services, users purchase credits. Credits are stored persistently in our server database linked to your registered Email or Mobile Number. 
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Credits are non-transferable and may not be exchanged for physical currency.</li>
            <li>One credit is deducted per successful premium processing action (e.g., Magic Eraser, batch OCR, multi-page scan compilations).</li>
            <li>You are responsible for keeping your secure OTP code confidential and maintaining your account session details.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            3. Privacy and Local Processing
          </h3>
          <p>
            MORPEE respects user privacy. Your uploads (Aadhaar cards, PAN cards, marks, photographs) are processed locally on your physical machine. We do not transmit, harvest, or store your documents or raw images on our server. However, B2B transaction records, credit balances, and basic telemetry logs are synchronized server-side to coordinate B2B billing and compliance ledger audits.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            4. User Obligations
          </h3>
          <p>
            By using our services, you agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Attempt to bypass, hack, or reverse-engineer the credit verification systems, signature HMAC algorithms, or JWT sessions.</li>
            <li>Use the services to process illegal, forged, or unauthorized documents.</li>
            <li>Forge or alter payment receipts or Razorpay payment identifiers.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            5. Limitation of Liability
          </h3>
          <p>
            MORPEE does not guarantee that government portals will accept your compressed documents, as portal requirements can change without notice. You are responsible for inspecting your generated JPEGs/PDFs for visual quality and text legibility prior to submission. MORPEE is not liable for any rejected applications, lost deadlines, or admission failures.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            6. Governing Law
          </h3>
          <p>
            These terms are governed by the laws of India. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the courts of West Bengal, India.
          </p>
        </div>

        <div className="pt-8 border-t border-outline-variant mt-12 flex justify-between items-center font-metadata text-metadata">
          <Link href="/" className="text-primary hover:underline font-semibold">[Back to Home]</Link>
          <span>MORPEE Security Audit: Passed</span>
        </div>
      </div>
    </main>
  );
}

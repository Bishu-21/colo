"use client";

import React from "react";
import Link from "next/link";

export default function RefundPage() {
  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[4xl] mx-auto min-h-screen bg-white border-x border-outline">
      <div className="p-8 space-y-6">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            Refund & Cancellation Policy
          </h1>
          <p className="font-body-md text-secondary italic">
            Last Updated: June 16, 2026
          </p>
        </div>

        <div className="space-y-4 font-body-md text-on-surface-variant text-sm leading-relaxed">
          <p>
            Thank you for purchasing premium credit packs on MORPEE Document Engine. Please read our refund and cancellation policies carefully.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            1. Credit Pack Purchases
          </h3>
          <p>
            MORPEE operates a credit-based B2B model (e.g. for cyber cafe operators and CSCs). Credits are added to your account immediately upon successful payment verification. Because credits are digital tokens of consumption available for immediate use, credit pack purchases are generally final.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            2. Refund Eligibility
          </h3>
          <p>
            We offer refunds under the following specific circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Double Charging</strong>: If you are charged twice for the same transaction due to a network disruption, please share your Razorpay payment ID and order ID. The duplicate transaction will be refunded in full.</li>
            <li><strong>Technical Failures</strong>: If your payment was captured successfully but credits were not allocated to your account (and our support team is unable to credit them manually within 48 hours), you are eligible for a full refund of that purchase.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            3. Ineligibility for Refunds
          </h3>
          <p>
            Refunds will not be issued if:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You have already used the allocated credits to process, compress, or OCR documents.</li>
            <li>Your government exam application is rejected by UPSC, SSC, or NTA due to blurred scans or incorrect preset selections. It is the user&apos;s responsibility to inspect file outputs before submitting them.</li>
            <li>You clear your browser cookie store and lose guest credits (which are stored locally and not linked to a persistent account). Please register using a valid email or mobile number before purchasing credit packs.</li>
          </ul>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            4. Refund Request Process
          </h3>
          <p>
            To request a refund, email our support team at <strong>support@compresseduploads.in</strong> within <strong>7 days</strong> of your transaction. Please include:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your registered primary identifier (Email or Mobile number).</li>
            <li>Razorpay transaction ID and Order ID.</li>
            <li>Receipt and details of the technical issue encountered.</li>
          </ul>
          <p>
            Once approved, refunds are processed automatically and will be credited to your original payment method (bank account, credit card, or UPI) within <strong>5 to 7 working days</strong>, in compliance with bank settlement cycles.
          </p>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-6">
            5. Cancellation Policy
          </h3>
          <p>
            You can cancel your account at any time. Upon account cancellation, any remaining unused credit balance will be deleted and is non-refundable. Since there are no recurring monthly subscriptions (billing is strictly one-time pay-as-you-go credit packs), there are no cancellation fees.
          </p>
        </div>

        <div className="pt-8 border-t border-outline-variant mt-12 flex justify-between items-center font-metadata text-metadata">
          <Link href="/" className="text-primary hover:underline font-semibold">[Back to Home]</Link>
          <span>Refund Processing Time: 5-7 Days</span>
        </div>
      </div>
    </main>
  );
}

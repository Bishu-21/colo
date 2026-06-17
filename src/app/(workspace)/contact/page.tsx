"use client";

import React from "react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[4xl] mx-auto min-h-screen bg-white border-x border-outline">
      <div className="p-8 space-y-6">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            Contact Us
          </h1>
          <p className="font-body-md text-secondary italic">
            Get in touch with the MORPEE support team for billing, credit orders, or API inquiries.
          </p>
        </div>

        <div className="space-y-8 font-body-md text-on-surface-variant text-sm leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1">
                Business Details
              </h3>
              <div className="space-y-2 text-xs uppercase font-metadata">
                <div>
                  <span className="text-secondary block">Brand Name</span>
                  <span className="text-carbon font-bold text-sm font-label-bold">MORPEE Document Engine</span>
                </div>
                <div className="pt-2">
                  <span className="text-secondary block">Operating Entity</span>
                  <span className="text-carbon font-bold">Bishal Sarkar (Sole Proprietorship)</span>
                </div>
                <div className="pt-2">
                  <span className="text-secondary block">Registered Address</span>
                  <span className="text-carbon font-bold">
                    Salt Lake Sector V, Kolkata,
                    <br />
                    West Bengal, 700091, India
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1">
                Support Channels
              </h3>
              <div className="space-y-2 text-xs uppercase font-metadata">
                <div>
                  <span className="text-secondary block">Email Support</span>
                  <a href="mailto:support@compresseduploads.in" className="text-primary font-bold text-sm lowercase font-label-bold hover:underline">
                    support@compresseduploads.in
                  </a>
                </div>
                <div className="pt-2">
                  <span className="text-secondary block">Contact Number</span>
                  <span className="text-carbon font-bold text-sm font-label-bold">+91 82402 12345</span>
                </div>
                <div className="pt-2">
                  <span className="text-secondary block">Response Timeline</span>
                  <span className="text-carbon font-bold">Under 12 Hours (24/7 Ticketing)</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="font-label-bold text-base text-carbon uppercase border-b border-grid-line pb-1 mt-8">
            Online Support Tickets
          </h3>
          <p>
            For instant queries regarding document errors, UPSC presets, or credit refunds, you can also log a support ticket directly from our <Link href="/support" className="text-primary font-bold hover:underline">[Support Center]</Link> page. Please include your transaction reference IDs for fast resolution.
          </p>
        </div>

        <div className="pt-8 border-t border-outline-variant mt-12 flex justify-between items-center font-metadata text-metadata">
          <Link href="/" className="text-primary hover:underline font-semibold">[Back to Home]</Link>
          <span>Support Coverage: National (India)</span>
        </div>
      </div>
    </main>
  );
}

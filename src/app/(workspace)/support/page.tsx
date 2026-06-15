"use client";

import React, { useState } from "react";

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: "Why did the government portal reject my optimized JPEG photo?",
    a: "Government exam portals like UPSC and SSC check files against binary constraints. If an image is stretched during compression, or if its aspect ratio deviates by even a single pixel from the requested parameters (e.g. 550x550px for UPSC), the portal scripts flag an automated error. Select our official presets to force exact resolution bounds and prevent portal rejection.",
  },
  {
    q: "How does 100% Client-Side Wasm processing protect my privacy?",
    a: "Under standard online compressors, files are uploaded to cloud servers, risking exposure of sensitive documents like Aadhaar cards or certificates. COLO optimizes files directly in your browser's RAM memory using WebAssembly (Wasm). No document bytes ever touch our servers.",
  },
  {
    q: "What is Legibility-preserving PDF Downsampling?",
    a: "Standard compression algorithms blur small text characters, making degree marks and certificates illegible. COLO rasterizes PDF layers page-by-page at exactly 150 DPI and preserves outline vectors to ensure that micro-text (like dates and marksheet cells) remains readable.",
  },
];

export default function SupportPage() {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");

  const submitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketBody) {
      alert("Please fill in both the Subject and Details fields.");
      return;
    }
    alert("Support Ticket Submitted: A support representative will review your request shortly.");
    setTicketSubject("");
    setTicketBody("");
  };

  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[1440px] mx-auto grid grid-cols-12 gap-0 border-x border-outline min-h-screen bg-white">
      {/* FAQ Accordion List (7 Columns) */}
      <section className="col-span-12 lg:col-span-7 p-8 flex flex-col gap-8 border-r border-outline">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            Support & Help Center
          </h1>
          <p className="font-body-md text-secondary italic">
            Troubleshooting telemetry logs and portal submission guidelines.
          </p>
        </div>

        <div className="space-y-8">
          <h3 className="font-label-bold text-label-bold uppercase text-carbon border-b border-grid-line pb-2">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="border border-carbon p-6 hover:bg-surface-container-low transition-all">
                <h4 className="font-label-bold text-label-bold uppercase text-primary mb-2">
                  Q: {faq.q}
                </h4>
                <p className="font-body-md text-secondary leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PWA Offline Support Info Card */}
        <div className="border border-carbon bg-[#f8f9fa] p-6 mt-6 rounded shadow-inner">
          <h3 className="font-label-bold text-label-bold uppercase text-carbon border-b border-grid-line pb-2 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">install_desktop</span>
            PWA Offline Integration Guide
          </h3>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mb-4">
            COLO is built as a Progressive Web App (PWA). You can install it on your device and optimize all your photographs, signatures, and certificates completely offline without an internet connection.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-metadata text-[11px] leading-relaxed">
            <div className="border border-carbon/10 p-3 bg-white">
              <span className="font-bold text-primary block uppercase mb-1">Service Workers</span>
              Background scripts intercept network requests, loading core files directly from your local browser Cache API instead of fetching them from the web.
            </div>
            <div className="border border-carbon/10 p-3 bg-white">
              <span className="font-bold text-primary block uppercase mb-1">Web App Manifest</span>
              A JSON file (`manifest.json`) defining the app’s name, theme colors, and icons. This enables desktop/mobile installation.
            </div>
            <div className="border border-carbon/10 p-3 bg-white">
              <span className="font-bold text-primary block uppercase mb-1">Local Data Storage</span>
              IndexedDB and client memory buffers securely store resizer metadata locally until processing completes.
            </div>
            <div className="border border-carbon/10 p-3 bg-white">
              <span className="font-bold text-primary block uppercase mb-1">Installation Steps</span>
              <span className="font-semibold block mt-0.5 text-secondary">
                Chrome / Edge: Click &quot;Add to Home Screen&quot; or the Install icon in your URL bar.
              </span>
              <span className="font-semibold block mt-0.5 text-secondary">
                Safari (iOS): Tap &quot;Share&quot; and select &quot;Add to Home Screen&quot;.
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-carbon/10 flex justify-between items-center text-[10px] font-metadata">
            <span>PWA Status: Registered & Active</span>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              [MDN PWA Docs]
            </a>
          </div>
        </div>
      </section>

      {/* Ticket Creator (5 Columns) */}
      <aside className="col-span-12 lg:col-span-5 p-8 flex flex-col justify-between bg-surface-container-low h-full">
        <div>
          <h3 className="font-headline-sm text-headline-sm uppercase border-b border-carbon pb-2 mb-6">
            Create Support Ticket
          </h3>
          
          <form onSubmit={submitTicket} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase">Subject</label>
              <input
                value={ticketSubject}
                onChange={e => setTicketSubject(e.target.value)}
                className="w-full bg-white border border-carbon p-3 font-body-md focus:outline-none focus:border-primary rounded-none"
                placeholder="Briefly state portal issue (e.g. UPSC Photo Resize)..."
                type="text"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase">Details</label>
              <textarea
                value={ticketBody}
                onChange={e => setTicketBody(e.target.value)}
                rows={6}
                className="w-full bg-white border border-carbon p-3 font-body-md focus:outline-none focus:border-primary rounded-none resize-none"
                placeholder="Include error codes, portal name, or specific sizing constraints..."
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-4 bg-carbon text-white font-label-bold text-label-bold uppercase rounded-full hover:bg-muted-teal transition-all"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>

        <div className="pt-8 border-t border-outline-variant mt-12">
          <p className="font-metadata text-[10px] text-outline leading-relaxed">
            Support contact: support@compresseduploads.com
            <br />
            Response latency: &lt; 12 Hours
            <br />
            Secure connection: SSL/HTTPS encrypted
          </p>
        </div>
      </aside>
    </main>
  );
}

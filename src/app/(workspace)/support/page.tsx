"use client";

import React, { useState } from "react";

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: "Why did the government portal reject my optimized JPEG photo?",
    a: "Government exam portals like UPSC and SSC check files against binary constraints. If an image is stretched during compression, or if its aspect ratio deviates by even a single pixel from the requested parameters (e.g. 550x550px for UPSC), the portal scripts flag an automated error. Select our official UPSC preset to force exact resolution bounds and prevent portal rejection.",
  },
  {
    q: "How does 100% Client-Side Wasm processing protect my privacy?",
    a: "Under standard online compressors, files are uploaded to cloud servers, risking exposure of sensitive documents like Aadhaar cards or certificates. Pre-Flight Compiler compiles and downsamples files directly in your browser's RAM memory using WebAssembly (Wasm). No document bytes ever touch our servers.",
  },
  {
    q: "What is Legibility-preserving PDF Downsampling?",
    a: "Standard compression algorithms blur small text characters, making degree marks and certificates illegible. Pre-Flight Compiler rasterizes PDF layers page-by-page at exactly 150 DPI and preserves outline vectors to ensure that micro-text (like dates and marksheet cells) remains readable.",
  },
  {
    q: "How does the Double-Entry Cryptographic Ledger work?",
    a: "For credit allocations and operator bills, we record each transaction in an append-only, chained ledger log. Each transaction contains a SHA-256 hash incorporating the previous log block's hash. This prevents transaction forgery, double-billing, or credit tampering.",
  },
];

export default function SupportPage() {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");

  const submitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketBody) {
      alert("ERROR: Subject and Body inputs are required.");
      return;
    }
    alert("SUPPORT_CORE: Staging ticket created. Support agent will review logs in 12h.");
    setTicketSubject("");
    setTicketBody("");
  };

  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[1440px] mx-auto grid grid-cols-12 gap-0 border-x border-outline min-h-screen bg-white">
      {/* FAQ Accordion List (7 Columns) */}
      <section className="col-span-12 lg:col-span-7 p-8 flex flex-col gap-10 border-r border-outline">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            [SUPPORT_HELP_CENTER]
          </h1>
          <p className="font-body-md text-secondary italic">
            *Troubleshooting telemetry logs and portal submission guidelines.*
          </p>
        </div>

        <div className="space-y-8">
          <h3 className="font-label-bold text-label-bold uppercase text-carbon border-b border-grid-line pb-2">
            System FAQs & Telemetry
          </h3>

          <div className="space-y-6">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="border border-carbon p-6 hover:bg-surface-container-low transition-all">
                <h4 className="font-label-bold text-label-bold uppercase text-primary mb-3">
                  Q: {faq.q}
                </h4>
                <p className="font-body-md text-secondary leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ticket Creator (5 Columns) */}
      <aside className="col-span-12 lg:col-span-5 p-8 flex flex-col justify-between bg-surface-container-low h-full">
        <div>
          <h3 className="font-headline-sm text-headline-sm uppercase border-b border-carbon pb-2 mb-6">
            [CREATE_SERVICE_TICKET]
          </h3>
          
          <form onSubmit={submitTicket} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase">TICKET_SUBJECT</label>
              <input
                value={ticketSubject}
                onChange={e => setTicketSubject(e.target.value)}
                className="w-full bg-white border border-carbon p-3 font-body-md focus:outline-none focus:border-primary rounded-none"
                placeholder="Briefly state portal issue (e.g. UPSC Photo Resize)..."
                type="text"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase">TICKET_DETAILS</label>
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
                className="w-full py-4 bg-carbon text-white font-label-bold text-label-bold uppercase rounded-full hover:bg-muted-teal transition-all cursor-crosshair"
              >
                [SUBMIT_TICKET_SEQUENCE]
              </button>
            </div>
          </form>
        </div>

        <div className="pt-8 border-t border-outline-variant mt-12">
          <p className="font-metadata text-[10px] text-outline leading-relaxed">
            CORE_CONTACT: SUPPORT@SYSTEM_ERR_OAAS.NODE
            <br />
            RESPONSE_LATENCY: &lt; 12 Hours
            <br />
            TEL_STATUS: SECURE_LINE_OPEN
          </p>
        </div>
      </aside>
    </main>
  );
}

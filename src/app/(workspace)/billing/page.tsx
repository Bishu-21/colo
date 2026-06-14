"use client";

import React, { useState } from "react";
import Script from "next/script";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    description: string;
  };
}

interface RazorpayInstance {
  on: (event: string, callback: (res: RazorpayErrorResponse) => void) => void;
  open: () => void;
}

interface CustomWindow extends Window {
  Razorpay?: new (options: unknown) => RazorpayInstance;
}

interface Plan {
  id: string;
  ticketId: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  role: string;
}

const PLANS: Plan[] = [
  {
    id: "candidate",
    ticketId: "001",
    name: "Candidate Pass (Single Season)",
    price: 49,
    duration: "[VALID_FOR_30_DAYS]",
    features: [
      "4 Core Document Sets Optimized",
      "AI Legibility Verification Check",
      "Cloud Locker Backup for 30 Days",
    ],
    role: "candidate",
  },
  {
    id: "csc",
    ticketId: "002",
    name: "CSC Operator Subscription (Monthly)",
    price: 499,
    duration: "[FOR_CYBER_CAFES_AND_CSCS]",
    features: [
      "Unlimited Batch Queue Processing",
      "Candidate ZIP Folder Auto-Mapping",
      "Direct Local Disk Folder Exports",
    ],
    role: "operator",
  },
  {
    id: "enterprise",
    ticketId: "003",
    name: "Enterprise API SDK (Pay-As-You-Go)",
    price: 999, // Setup credit package fee
    duration: "[FOR_EDTECH_AND_TEST_PREP_PORTALS]",
    features: [
      "White-labeled Embed Widget",
      "Serverless High-Volume Webhooks",
      "99.9% Uptime SLA Verification",
    ],
    role: "enterprise",
  },
];

export default function BillingHub() {
  const [selectedPlanId, setSelectedPlanId] = useState("csc");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1];

  const basePrice = selectedPlan.price;
  const gst = Math.round(basePrice * 0.18 * 100) / 100;
  const total = Math.round((basePrice + gst) * 100) / 100;

  const handleRazorpayPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // 1. Create order on the server
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, amount: total }),
      });
      const orderData = await res.json();

      if (!res.ok) throw new Error(orderData.error || "Order creation failed");

      // 2. Configure Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mock_keys_123",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Pre-Flight Compiler",
        description: selectedPlan.name,
        order_id: orderData.orderId,
        handler: async function (response: RazorpayResponse) {
          // Verify payment on the server
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: selectedPlanId,
              amount: total,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            alert("SECURE NODE REPORT: PAYMENT VERIFIED. CREDITS ALLOCATED.");
            window.location.href = "/workspace/image";
          } else {
            alert(`ERROR: ${verifyData.error || "SIGNATURE_AUDIT_FAILED"}`);
          }
        },
        prefill: {
          email: "candidate@secure.node",
          contact: "9999999999",
        },
        theme: {
          color: "#30645d", // Primary Teal
        },
      };

      // 3. Launch Razorpay Checkout Modal
      const customWindow = window as unknown as CustomWindow;
      if (!customWindow.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }
      const rzp = new customWindow.Razorpay(options);
      rzp.on("payment.failed", function (response: RazorpayErrorResponse) {
        alert(`TRANSACTION_FAILED: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      const error = err as Error;
      console.error(error);
      alert(`Razorpay Sandbox Alert: ${error.message || "Failed to initialize gateway"}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main className="flex-grow pt-20 pb-16 px-container-padding">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-carbon mt-8">
          {/* Plan Columns */}
          {PLANS.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <section
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`md:col-span-3 border-r border-carbon p-8 flex flex-col justify-between group transition-colors duration-150 cursor-crosshair relative ${
                  isSelected ? "bg-surface-container-low" : "bg-white hover:bg-surface-container-low"
                }`}
              >
                {/* Visual Accent bar for Recommended CSC plan */}
                {plan.id === "csc" && (
                  <>
                    <div className="absolute inset-0 border-x-4 border-muted-teal pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-muted-teal"></div>
                  </>
                )}

                <div>
                  <span className="font-metadata text-metadata text-secondary block mb-4">
                    [TICKET_ID: {plan.ticketId}]
                  </span>
                  <h2 className="font-headline-sm text-headline-sm uppercase mb-6">{plan.name}</h2>
                  <div className="mb-6">
                    <span className="font-display-xl text-5xl md:text-7xl block">
                      ₹{plan.id === "enterprise" ? "0.40" : plan.price}
                    </span>
                    <span className="font-metadata text-metadata text-secondary block mt-2">{plan.duration}</span>
                  </div>
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary font-bold">check_box</span>
                        <span className="font-label-bold text-label-bold uppercase">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  className={`w-full py-4 rounded-full font-label-bold text-label-bold uppercase border transition-all ${
                    isSelected ? "bg-carbon text-white" : "border-carbon hover:bg-carbon hover:text-white"
                  }`}
                >
                  {isSelected ? "[SELECTED_PLAN]" : "[SELECT_PLAN]"}
                </button>
              </section>
            );
          })}

          {/* Sidebar Invoice summary */}
          <aside className="md:col-span-3 p-8 bg-surface-container h-full flex flex-col justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm uppercase mb-4 border-b border-carbon pb-2">
                [INVOICE_SUMMARY]
              </h3>
              <div className="space-y-4 font-body-md text-body-md">
                <div className="flex justify-between">
                  <span className="text-secondary">PLAN:</span>
                  <span className="text-right font-bold uppercase">{selectedPlan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">BASE_PRICE:</span>
                  <span>₹{basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">GST (18%):</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="border-t border-carbon pt-4 flex justify-between font-bold text-headline-sm">
                  <span>TOTAL:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="bg-white/40 p-4 border border-outline-variant flex items-center justify-between">
                <span className="font-metadata text-metadata text-secondary">GATEWAY</span>
                <span className="font-label-bold text-[10px] tracking-widest text-carbon">RAZORPAY_SECURE</span>
              </div>
              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessingPayment}
                className="w-full bg-primary text-white py-6 rounded-full font-label-bold text-label-bold uppercase flex items-center justify-center gap-3 hover:bg-muted-teal disabled:opacity-50 transition-all group cursor-crosshair"
              >
                <span className="material-symbols-outlined">lock</span>
                {isProcessingPayment ? "[AUTHORIZING...]" : "[SECURELY_PAY_WITH_RAZORPAY]"}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
              <p className="font-metadata text-metadata text-center text-secondary-fixed-dim leading-tight">
                TRANSACTION_ENCRYPTED: AES-256-GCM
                <br />
                PAYMENT_GATEWAY: SECURE_NODE_ALPHA
              </p>
            </div>
          </aside>
        </div>

        {/* Dynamic Telemetry Info Block */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-0 border-l border-t border-carbon">
          <div className="border-r border-b border-carbon p-6 flex flex-col gap-2 bg-white">
            <span className="font-metadata text-metadata text-secondary">SYSTEM_TELEMETRY</span>
            <span className="font-headline-sm text-headline-sm">402/OK</span>
          </div>
          <div className="border-r border-b border-carbon p-6 flex flex-col gap-2 bg-white">
            <span className="font-metadata text-metadata text-secondary">LATENCY_CORE</span>
            <span className="font-headline-sm text-headline-sm">12ms</span>
          </div>
          <div className="border-r border-b border-carbon p-6 flex flex-col gap-2 bg-white">
            <span className="font-metadata text-metadata text-secondary">ACTIVE_NODES</span>
            <span className="font-headline-sm text-headline-sm">LOCAL_DB_ON</span>
          </div>
          <div className="border-r border-b border-carbon p-6 flex flex-col gap-2 overflow-hidden bg-white">
            <span className="font-metadata text-metadata text-secondary">LIVE_FLIGHT_FEED</span>
            <div className="flex gap-2 animate-pulse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="font-metadata text-metadata text-primary uppercase">SYNC_READY</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

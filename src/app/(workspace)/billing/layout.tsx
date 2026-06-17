import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Billing & Plans",
  description: "Upgrade your account to access unlimited government scans, Magic Eraser, and high-DPI document compilations.",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

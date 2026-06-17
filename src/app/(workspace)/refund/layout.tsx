import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Read our refund policy for document credits, subscriptions, and pass purchases.",
};

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

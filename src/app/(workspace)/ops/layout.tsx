import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Operator Panel",
  description: "Monitor client-side CPU cores, local memory allocations, WASM compile times, and sandbox storage utilization.",
};

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

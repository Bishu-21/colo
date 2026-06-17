import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Support",
  description: "Get assistance with document compression, government uploads, and billing issues.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

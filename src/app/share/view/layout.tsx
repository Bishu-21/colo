import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Secure Decryption Node",
  description: "Decrypt and download password-protected, zero-knowledge shared files locally and securely.",
};

export default function ShareViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

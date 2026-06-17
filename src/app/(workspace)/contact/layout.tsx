import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the MORPEE team for enterprise licensing, B2B support, or custom portal integration needs.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

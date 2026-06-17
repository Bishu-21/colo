import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read our terms of service, outlining secure client-side document processing standards and usage guidelines.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

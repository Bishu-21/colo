import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Optimize and compress your passport photographs, signature scans, and certificate PDFs to exact government standards.",
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Developer API Hub",
  description: "Integrate MORPEE's secure document compression and optimization API into your custom candidate registration flows.",
};

export default function ApiHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

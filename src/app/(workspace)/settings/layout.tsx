import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure encryption levels, RAM wipe options, and MFA credentials for secure local document optimization.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

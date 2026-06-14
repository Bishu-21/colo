import React from "react";
import { AppShell } from "@/components/ui/AppShell";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}

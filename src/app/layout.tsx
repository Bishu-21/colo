import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PRE-FLIGHT COMPILER | Government Portal Optimizer",
  description: "Zero-Trust local image and PDF compression optimized for strict portal requirements (UPSC, SSC).",
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${playfairDisplay.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-body-md text-on-surface">
        {children}
      </body>
    </html>
  );
}

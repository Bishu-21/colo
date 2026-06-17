import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "morpee - UPSC, SSC, & Govt Portal Document Optimizer",
    template: "%s | MORPEE"
  },
  description: "Compress, resize, and digitize passport photographs, signatures, and certificates to exact government portal specifications (UPSC, SSC, NTA). Secure server-side verification, local processing & storage hybrid.",
  keywords: [
    "UPSC photo resizer",
    "SSC signature resizer",
    "government portal document compressor",
    "hybrid pdf compressor",
    "Aadhaar card scanner",
    "secure hybrid ocr",
    "local-first pdf editor",
    "secure document compressor"
  ],
  metadataBase: new URL("https://morpee.secure.node"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "morpee - UPSC, SSC, & Govt Portal Document Optimizer",
    description: "Compress, resize, and digitize passport photographs, signatures, and certificates to exact government portal specifications. Secure server-side verification, local processing & storage hybrid.",
    url: "https://morpee.secure.node",
    siteName: "MORPEE",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/screenshot-desktop.png",
        width: 1200,
        height: 630,
        alt: "MORPEE - Secure Hybrid Document Compiler"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "morpee - UPSC, SSC, & Govt Portal Document Optimizer",
    description: "Compress, resize, and digitize documents with hybrid local/server optimization under portal limits.",
    images: ["/screenshot-desktop.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased font-body-md text-on-surface">
        {children}
      </body>
    </html>
  );
}

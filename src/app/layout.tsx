import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://shipsafe.dev'),
  title: "ShipSafe — Passive Security Hygiene Auditor for AI-Built Web Apps",
  description: "Instant 10-second passive security audit for web apps built with Cursor, v0, Bolt, and modern AI tools. Generates letter grades and copy-paste AI fix prompts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased selection:bg-white selection:text-black`}
      >
        {/* Global Cinema-Grade Film Grain Texture Overlay */}
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

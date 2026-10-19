import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Premier Solutions",
    template: "%s · Premier Solutions",
  },
  description:
    "Premier Solutions tools — Warmer Kiwi Homes eligibility checks and Premier Field site visit mapping for insulation business development.",
  applicationName: "Premier Field",
  appleWebApp: {
    capable: true,
    title: "Premier Field",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

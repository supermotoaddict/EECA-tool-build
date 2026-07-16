import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const sans = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Warmer Kiwi Homes Eligibility Check",
  description:
    "Check if your New Zealand home may qualify for a Warmer Kiwi Homes insulation and heating grant, including NZDep funding band and existing EECA claims.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#03005c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ" className={`${sans.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}

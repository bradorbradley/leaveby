import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";

import "@/app/globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["SOFT", "opsz"], style: ["normal", "italic"] });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Leave By",
  description: "Never miss a flight again. Leave By tells you exactly when to leave for the airport.",
  applicationName: "Leave By",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Leave By" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F3EEE5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${instrument.variable} min-h-dvh bg-ground font-sans text-ink antialiased`}>{children}</body>
    </html>
  );
}

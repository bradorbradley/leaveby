import type { Metadata, Viewport } from "next";
import { Figtree, Gabarito } from "next/font/google";

import "@/app/globals.css";

const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "900"] });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Leave By",
  description: "Tell us your flight. We tell you when to walk out the door.",
  applicationName: "Leave By",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Leave By" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF6EF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${gabarito.variable} ${figtree.variable} min-h-dvh bg-ground font-sans text-ink antialiased`}>{children}</body>
    </html>
  );
}

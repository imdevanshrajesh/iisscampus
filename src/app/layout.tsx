import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "IISSCampus",
    template: "%s · IISSCampus",
  },
  description: siteConfig.description,
  applicationName: "Campus",
  icons: { icon: "/brand/iiss-mark.webp", apple: "/brand/iiss-mark.webp" },
  openGraph: {
    type: "website",
    siteName: "IISSCampus",
    locale: "en_AE",
    title: "IISSCampus",
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${display.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

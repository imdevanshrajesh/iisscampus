import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { resolveCouncilLogoUrl } from "@/components/brand/council-logo";
import { siteConfig } from "@/lib/config";
import { getSiteBrand } from "@/lib/data/queries";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSiteBrand();
  const icon = resolveCouncilLogoUrl(brand.councilLogoUrl);
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s · ${siteConfig.shortName}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.shortName,
    icons: { icon, apple: icon },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_AE",
      title: siteConfig.name,
      description: siteConfig.description,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${display.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

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
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.shortName,
  icons: { icon: "/brand/iiss-mark.webp", apple: "/brand/iiss-mark.webp" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_AE",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

const introScript = `(function(){try{if(location.pathname==="/"){document.documentElement.dataset.intro="play"}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${display.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

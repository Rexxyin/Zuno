import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toast";
import Preloader from "@/components/Preloader";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://zunoplan.vercel.app",
  ),

  title: {
    default: "Zuno — Find Plans. Join Instantly.",
    template: "%s | Zuno",
  },

  description:
    "Discover real people, real plans. Join instantly and just show up.",

  applicationName: "Zuno",

  keywords: [
    "group plans",
    "events near me",
    "things to do",
    "meet people",
    "travel groups India",
    "weekend plans",
  ],

  manifest: "/manifest.json",

  openGraph: {
    title: "Find Plans. Join Instantly.",
    description: "Scroll real plans. Join instantly. Show up.",
    url: "/",
    siteName: "Zuno",
    images: [
      {
        url: "/og-image.png", // make sure this exists
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Find Plans. Join Instantly.",
    description: "Scroll real plans. Join instantly. Show up.",
    images: ["/og-image.png"],
  },
};

/**
 * ✅ ROOT LAYOUT
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ iOS PWA Fix */}
        <meta name="apple-mobile-web-app-title" content="Zuno" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className={poppins.className}>
        <Preloader />

        <main className="min-h-screen">{children}</main>

        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "karigai",
    template: "%s · karigai",
  },
  description:
    "Wellness intelligence for women. Personalised fitness, nutrition, cycle tracking, and daily guidance.",
  icons: {
    icon: [{ url: "/karigai-logo.png", type: "image/png" }],
    apple: [{ url: "/karigai-logo.png", type: "image/png" }],
    shortcut: "/karigai-logo.png",
  },
  openGraph: {
    title: "karigai",
    description: "Wellness intelligence for women.",
    images: [{ url: "/karigai-logo.png" }],
    siteName: "karigai",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}>
      <head>
        <link rel="icon" href="/karigai-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/karigai-logo.png" />
        <link rel="shortcut icon" href="/karigai-logo.png" />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

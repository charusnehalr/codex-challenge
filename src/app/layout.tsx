import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
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

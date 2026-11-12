import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted to avoid intermittent Netlify/CI failures from next/font/google
// (Google sometimes returns extensionless font URLs that crash the Next font loader).
const cormorant = localFont({
  src: "./fonts/cormorant-garamond.woff2",
  variable: "--font-cormorant",
  weight: "400 700",
  display: "swap",
});

const sourceSans = localFont({
  src: "./fonts/source-sans-3.woff2",
  variable: "--font-source-sans",
  weight: "300 700",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains-mono",
  weight: "400 500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TennisCoach AI - Your Personal Tennis Coach",
  description: "Get personalized tennis coaching for technique, tactics, fitness, and more.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${sourceSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

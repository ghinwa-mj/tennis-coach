import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

// Self-hosted to avoid intermittent Netlify/CI failures from next/font/google
// (Google sometimes returns extensionless font URLs that crash the loader).
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.GOOGLE_MAPS_API_KEY = '${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}';
              window.initGoogleMaps = function() {
                console.log('Google Maps API loaded successfully');
                window.googleMapsLoaded = true;
                window.dispatchEvent(new Event('google-maps-loaded'));
              };
            `,
          }}
        />
        <Script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}&libraries=places&callback=initGoogleMaps`}
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

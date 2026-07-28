import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "FORENSIQ — Digital Forensics Investigation Platform",
    template: "%s · FORENSIQ",
  },
  description:
    "FORENSIQ is a complete digital forensics investigation platform — device acquisition, 4-stage evidence scanning, 18-category analysis, and chain-of-custody delivery with SHA-256 integrity. Bcrypt-secured, single-admin, court-ready exports.",
  keywords: [
    "FORENSIQ",
    "digital forensics",
    "forensic investigation platform",
    "evidence acquisition",
    "device acquisition",
    "chain of custody",
    "evidence recovery",
    "SHA-256 integrity",
    "UFED XML export",
    "forensic analysis",
    "mobile forensics",
    "deleted file recovery",
    "evidence management",
    "investigation software",
  ],
  authors: [{ name: "FORENSIQ", url: "http://localhost:3000" }],
  creator: "FORENSIQ",
  publisher: "FORENSIQ",
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    siteName: "FORENSIQ",
    title: "FORENSIQ — Digital Forensics Investigation Platform",
    description:
      "Complete digital forensics platform: device acquisition, 4-stage scanning, 18-category evidence analysis, chain-of-custody delivery. Bcrypt-secured, court-ready.",
    images: [
      {
        url: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
        width: 1200,
        height: 630,
        alt: "FORENSIQ Digital Forensics Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FORENSIQ — Digital Forensics Investigation Platform",
    description:
      "Complete digital forensics platform: acquisition, scanning, analysis, chain-of-custody delivery.",
    images: ["https://z-cdn.chatglm.cn/z-ai/static/logo.svg"],
  },
  alternates: {
    canonical: "http://localhost:3000",
  },
  category: "technology",
};

export const viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* JSON-LD structured data for search engine indexing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "FORENSIQ",
              applicationCategory: "SecurityApplication",
              operatingSystem: "Web",
              description:
                "Digital forensics investigation platform for device acquisition, evidence scanning, analysis, and chain-of-custody delivery.",
              offers: [
                {
                  "@type": "Offer",
                  name: "Standard",
                  price: "2400",
                  priceCurrency: "USD",
                  description: "Up to 5 users, unlimited cases, JSON & CSV export",
                },
                {
                  "@type": "Offer",
                  name: "Professional",
                  price: "6000",
                  priceCurrency: "USD",
                  description: "Up to 15 users, UFED XML & PDF report export, advanced mode",
                },
                {
                  "@type": "Offer",
                  name: "Enterprise",
                  price: "18000",
                  priceCurrency: "USD",
                  description: "Up to 50 users, API access, dedicated support",
                },
              ],
              featureList: [
                "5 device acquisition methods (logical, file_system, physical, cloud, manual)",
                "4-stage scanning pipeline (analysis, discovery, parsing, carving)",
                "18 evidence categories with confidence scoring",
                "SHA-256 / SHA-512 integrity hashing",
                "Chain-of-custody audit log with tamper-evident checksums",
                "Export to JSON, CSV, UFED XML, PDF report",
                "Bcrypt password authentication",
                "Single-admin enforcement",
              ],
              publisher: {
                "@type": "Organization",
                name: "FORENSIQ",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

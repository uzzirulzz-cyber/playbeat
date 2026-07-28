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
  title: "FORENSIQ — Digital Forensics Platform",
  description:
    "FORENSIQ is a digital forensics investigation platform for device acquisition, evidence scanning, analysis, and chain-of-custody delivery.",
  keywords: [
    "FORENSIQ",
    "digital forensics",
    "evidence",
    "acquisition",
    "chain of custody",
    "investigation",
  ],
  authors: [{ name: "FORENSIQ" }],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

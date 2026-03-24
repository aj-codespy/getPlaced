import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BackgroundAmbience } from "@/components/layout/background-ambience";
import { GoogleAnalytics } from "@next/third-parties/google";

const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "getPlaced — AI Resume Builder | ATS-Optimized Resumes",
    template: "%s | getPlaced",
  },
  description: "Build tailored, ATS-optimized resumes in under 30 seconds. Premium LaTeX templates, LinkedIn audit, resume scoring, and role-specific optimization for every application.",
  keywords: ["resume builder", "AI resume", "ATS optimized", "job application", "career tools", "LinkedIn audit", "resume score", "getPlaced"],
  authors: [{ name: "getPlaced" }],
  openGraph: {
    title: "getPlaced — AI Resume Builder",
    description: "Build role-specific, ATS-optimized resumes in seconds with premium templates, LinkedIn audit, and resume scoring.",
    url: "https://getplaced.in",
    siteName: "getPlaced",
    type: "website",
    images: [{ url: "https://getplaced.in/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "getPlaced — AI Resume Builder",
    description: "Build role-specific, ATS-optimized resumes in seconds with premium templates, LinkedIn audit, and resume scoring.",
    images: ["https://getplaced.in/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        <BackgroundAmbience />
        <Providers>
          {children}
        </Providers>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast/toast-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Clipper - Turn Long Videos into Viral Shorts",
  description:
    "Automatically identify, clip, and publish the best moments from your videos using AI. Optimized for YouTube Shorts, TikTok, and Instagram Reels.",
  keywords: ["ai", "video", "clipper", "shorts", "tiktok", "youtube"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "AI Clipper - Turn Long Videos into Viral Shorts",
    description: "AI-powered video clipping for creators. Find viral moments automatically.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

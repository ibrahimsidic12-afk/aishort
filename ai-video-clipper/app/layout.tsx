import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Video Clipper - Turn Long Videos into Viral Shorts",
  description:
    "Automatically identify, clip, and publish the best moments from your videos using AI. Optimized for YouTube Shorts, TikTok, and Instagram Reels.",
  keywords: ["ai", "video", "clipper", "shorts", "tiktok", "youtube"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

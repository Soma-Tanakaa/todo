import type { Metadata, Viewport } from "next";
import { SWRegister } from "@/components/SWRegister";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "進捗帖",
  description: "毎朝開いて、今日やるべきことが一目でわかるタスク管理",
  appleWebApp: {
    capable: true,
    title: "進捗帖",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="mx-auto min-h-dvh max-w-lg bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
          {children}
        </div>
        <Toaster />
        <SWRegister />
      </body>
    </html>
  );
}

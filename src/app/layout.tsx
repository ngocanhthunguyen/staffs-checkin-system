import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { COMPANY_NAME } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${COMPANY_NAME} - ลงเวลาเข้า-ออกงาน / Staff Check-In`,
  description: "ระบบลงเวลาเข้า-ออกงาน Canaaustralasia / Canaaustralasia Staff Attendance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: COMPANY_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900 min-h-dvh`}>
        {children}
      </body>
    </html>
  );
}

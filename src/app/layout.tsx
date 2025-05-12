import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientSideLayout from "@/components/Layout/ClientSideLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flecha Extreme - ERP",
  description: "Sistema de gestión para Flecha Extreme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-page text-page`}
      >
        <ClientSideLayout>{children}</ClientSideLayout>
      </body>
    </html>
  );
}

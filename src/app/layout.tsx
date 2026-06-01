import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import ClientSideLayout from "@/components/Layout/ClientSideLayout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flecha Extreme - ERP",
  description: "Sistema de gestión para Flecha Extreme",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable}`}>
      <body className="antialiased bg-page text-page">
        <ClientSideLayout>{children}</ClientSideLayout>
      </body>
    </html>
  );
}

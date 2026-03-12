import type { Metadata } from "next";
import ClientSideLayout from "@/components/Layout/ClientSideLayout";
import "./globals.css";

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
    <html lang="es">
      <body className="antialiased bg-page text-page">
        <ClientSideLayout>{children}</ClientSideLayout>
      </body>
    </html>
  );
}

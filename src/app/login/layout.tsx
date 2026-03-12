import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión - Flecha Extreme",
  description: "Página de inicio de sesión para el sistema de gestión Flecha Extreme",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 

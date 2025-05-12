'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { UserProvider, useUserContext } from "@/context/UserContext";

// Componente protegido que verifica la autenticación
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  
  const isLoginPage = pathname === "/login";
  
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [loading, user, router, pathname]);

  // Si estamos en la página de login, no mostrar pantalla de carga
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // Solo mostrar cargando en otras páginas, no en login
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

// Componente principal que provee el contexto de usuario
export default function ClientSideLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </UserProvider>
  );
} 
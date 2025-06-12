'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { UserProvider, useUserContext } from "@/context/UserContext";

// Componente protegido que verifica la autenticación
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className={`flex-1 overflow-auto p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {children}
      </main>
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
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserProvider, useUserContext } from "@/context/UserContext";
import { SurfSpinner } from "@/shared/components";
import AppShellV2 from "./v2/AppShellV2";

// Componente protegido que verifica la autenticación
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicTransitRoute = pathname === "/login" || pathname === "/";
  
  useEffect(() => {
    if (!loading && !user && !isPublicTransitRoute) {
      router.push("/login");
    }
  }, [loading, user, router, isPublicTransitRoute]);

  // Rutas públicas/transición no usan shell
  if (isPublicTransitRoute) {
    return <>{children}</>;
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen-safe bg-background">
        <SurfSpinner size="xl" showText={true} text="Cargando aplicación..." />
      </div>
    );
  }

  return <AppShellV2>{children}</AppShellV2>;
}

// Componente principal que provee el contexto de usuario
export default function ClientSideLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </UserProvider>
  );
} 

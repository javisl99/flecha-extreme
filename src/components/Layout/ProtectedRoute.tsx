'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { usuario, loading } = useUserData();

  useEffect(() => {
    if (!loading) {
      // Si no hay roles permitidos, la ruta está disponible para todos
      if (!allowedRoles) return;

      // Si el usuario no está autenticado o no tiene un rol permitido, redirigir al dashboard
      if (!usuario || !allowedRoles.includes(usuario.rol)) {
        router.push('/dashboard');
      }
    }
  }, [loading, usuario, allowedRoles, router]);

  // Mostrar nada mientras se carga
  if (loading) {
    return null;
  }

  // Si no hay roles permitidos o el usuario tiene un rol permitido, mostrar el contenido
  if (!allowedRoles || (usuario && allowedRoles.includes(usuario.rol))) {
    return <>{children}</>;
  }

  // Si el usuario no tiene un rol permitido, no mostrar nada
  return null;
} 
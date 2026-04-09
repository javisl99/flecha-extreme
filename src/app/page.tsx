'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';
import { SurfSpinner } from '@/shared/components';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useUserContext();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/dashboard');
      return;
    }
    router.replace('/login');
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen-safe items-center justify-center bg-surface">
      <SurfSpinner size="lg" showText text="Redirigiendo..." />
    </div>
  );
}

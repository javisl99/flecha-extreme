'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import SidebarV2 from './SidebarV2';

interface AppShellV2Props {
  children: React.ReactNode;
}

export default function AppShellV2({ children }: AppShellV2Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('app-lock-scroll', isSidebarOpen);

    return () => {
      document.body.classList.remove('app-lock-scroll');
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen-safe bg-surface text-on-surface lg:[--sidebar-width:16rem]">
      <SidebarV2 isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="min-h-screen-safe lg:pl-[var(--sidebar-width)]">
        <header className="app-safe-top sticky top-0 z-30 border-b border-outline-variant/20 bg-surface-container-lowest/95 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-low text-on-surface transition hover:border-primary/25 hover:text-primary"
            >
              <span className="sr-only">Abrir navegación</span>
              <Bars3Icon className="h-6 w-6" />
            </button>

            <Image
              src="/cropped-lgo.png"
              alt="Flecha Extreme"
              width={132}
              height={42}
              priority
              className="h-auto w-auto max-w-[132px]"
            />

            <div className="h-11 w-11" aria-hidden="true" />
          </div>
        </header>

        <main className="min-h-screen-safe">{children}</main>
      </div>
    </div>
  );
}

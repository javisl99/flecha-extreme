'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  XMarkIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  UsersIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  CalculatorIcon,
  IdentificationIcon,
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';

type DatabaseRole = 'admin' | 'fl-admin' | 'fl-empleado';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  roles?: DatabaseRole[];
};

interface SidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { name: 'Actividades', href: '/actividades', icon: CalendarDaysIcon },
  { name: 'Clientes', href: '/clientes', icon: UsersIcon },
  { name: 'Pagos', href: '/pagos', icon: CreditCardIcon },
  { name: 'Parking', href: '/parking', icon: MapPinIcon },
  { name: 'Tienda', href: '/tienda', icon: BuildingStorefrontIcon },
  { name: 'Documentos', href: '/documentos', icon: DocumentTextIcon },
  { name: 'Contabilidad', href: '/contabilidad', icon: CalculatorIcon, roles: ['admin', 'fl-admin'] },
  { name: 'Empleados', href: '/empleados', icon: IdentificationIcon, roles: ['admin', 'fl-admin'] },
  { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
];

const isItemActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export default function SidebarV2({ isOpen, onClose }: SidebarV2Props) {
  const pathname = usePathname();
  const { logout, user } = useUserContext();
  const { usuario, loading: usuarioLoading } = useUserData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSidebarSkeleton, setShowSidebarSkeleton] = useState(true);
  const sidebarSkeletonStartedAtRef = useRef<number | null>(null);
  const sidebarSkeletonTimerRef = useRef<number | null>(null);
  const wasUserLoadingRef = useRef(false);

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes((usuario?.rol || 'fl-empleado') as DatabaseRole);
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  const initials = usuario?.nombre?.slice(0, 1)?.toUpperCase() || 'F';

  useEffect(() => {
    const MIN_SKELETON_MS = 800;

    if (sidebarSkeletonTimerRef.current !== null) {
      window.clearTimeout(sidebarSkeletonTimerRef.current);
      sidebarSkeletonTimerRef.current = null;
    }

    if (usuarioLoading) {
      if (!wasUserLoadingRef.current) {
        sidebarSkeletonStartedAtRef.current = Date.now();
      }

      wasUserLoadingRef.current = true;
      setShowSidebarSkeleton(true);
      return;
    }

    wasUserLoadingRef.current = false;

    if (!showSidebarSkeleton) {
      sidebarSkeletonStartedAtRef.current = null;
      return;
    }

    const startedAt = sidebarSkeletonStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(MIN_SKELETON_MS - elapsed, 0);

    if (remaining > 0) {
      sidebarSkeletonTimerRef.current = window.setTimeout(() => {
        setShowSidebarSkeleton(false);
        sidebarSkeletonStartedAtRef.current = null;
        sidebarSkeletonTimerRef.current = null;
      }, remaining);
    } else {
      setShowSidebarSkeleton(false);
      sidebarSkeletonStartedAtRef.current = null;
    }

    return () => {
      if (sidebarSkeletonTimerRef.current !== null) {
        window.clearTimeout(sidebarSkeletonTimerRef.current);
        sidebarSkeletonTimerRef.current = null;
      }
    };
  }, [showSidebarSkeleton, usuarioLoading]);

  const SkeletonLine = ({ className = '' }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className="sidebar-skeleton-shimmer absolute inset-y-0 left-0 w-1/2" />
    </div>
  );

  const renderSkeleton = () => (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative px-5 pb-6 pt-5 lg:px-6 lg:pb-8 lg:pt-6">
          <div className="flex flex-col items-center text-center">
            <SkeletonLine className="h-14 w-40 rounded-2xl" />
            <SkeletonLine className="mt-3 h-3 w-32" />
          </div>
        </div>

        <nav className="space-y-1 pr-3 lg:pr-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-5 py-3 lg:px-6">
              <SkeletonLine className="h-5 w-5 shrink-0 rounded-md" />
              <SkeletonLine className="h-4 w-24" />
            </div>
          ))}
        </nav>
      </div>

      <div className="px-4 pb-5 pt-4 lg:px-5 lg:pb-6 lg:pt-5">
        <div className="rounded-xl bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-10 w-10 rounded-full" />
            <div className="min-w-0 flex-1">
              <SkeletonLine className="h-4 w-28" />
              <SkeletonLine className="mt-2 h-3 w-20" />
            </div>
          </div>
        </div>

        <SkeletonLine className="mt-4 h-12 w-full rounded-xl" />
      </div>
    </>
  );

  return (
    <>
      <style jsx global>{`
        @keyframes sidebar-skeleton-shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }

        .sidebar-skeleton-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.12) 45%,
            rgba(255, 255, 255, 0.24) 50%,
            rgba(255, 255, 255, 0.12) 55%,
            transparent 100%
          );
          animation: sidebar-skeleton-shimmer 1.2s ease-in-out infinite;
        }
      `}</style>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`app-safe-bottom fixed inset-y-0 left-0 z-50 flex h-screen w-[min(18rem,86vw)] flex-col justify-between sidebar-gradient text-white shadow-sidebar-ambient transition-transform duration-300 ease-fluid lg:w-[var(--sidebar-width)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {showSidebarSkeleton ? (
          renderSkeleton()
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="relative px-5 pb-6 pt-5 lg:px-6 lg:pb-8 lg:pt-6">
                <div className="flex flex-col items-center text-center">
                  <Image
                    src="/cropped-lgo.png"
                    alt="Flecha Extreme"
                    width={170}
                    height={58}
                    priority
                    className="h-auto w-auto max-w-[150px] sm:max-w-[170px]"
                  />
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
                    ERP FLECHA EXTREME
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/15 lg:hidden"
                >
                  <span className="sr-only">Cerrar navegación</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1 pr-3 lg:pr-4">
                {filteredNavigation.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center gap-3 px-5 py-3 text-[13px] font-semibold transition-all duration-300 ease-fluid lg:px-6 ${
                        active
                          ? 'rounded-r-full border-l-4 border-accent bg-white/10 text-accent'
                          : 'text-white/75 hover:translate-x-1 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="px-4 pb-5 pt-4 lg:px-5 lg:pb-6 lg:pt-5">
              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-[15px] font-black text-primary-dark">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Flecha Extreme'}
                    </p>
                    <p className="truncate text-xs text-white/65">{usuario?.displayRol || 'ERP Admin'}</p>
                  </div>
                </div>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

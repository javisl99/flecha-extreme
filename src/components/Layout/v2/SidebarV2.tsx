'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
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

export default function SidebarV2() {
  const pathname = usePathname();
  const { logout, user } = useUserContext();
  const { usuario } = useUserData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    }
  };

  const initials = usuario?.nombre?.slice(0, 1)?.toUpperCase() || 'F';

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col justify-between sidebar-gradient text-white shadow-sidebar-ambient">
      <div>
        <div className="px-6 pb-8 pt-6">
          <div className="flex items-center gap-3">
            <Image
              src="/cropped-lgo.png"
              alt="Flecha Extreme"
              width={170}
              height={58}
              priority
              className="h-auto w-auto max-w-[170px]"
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">ERP Cockpit</p>
        </div>

        <nav className="space-y-1 pr-4">
          {filteredNavigation.map((item) => {
            const active = isItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-6 py-3 text-[13px] font-semibold transition-all duration-300 ease-fluid ${
                  active
                    ? 'rounded-r-full border-l-4 border-accent text-accent bg-white/10'
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

      <div className="px-5 pb-6 pt-5">
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
            className="mt-4 flex w-full items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        )}
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';

// Componentes de iconos SVG
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ReservasIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClientesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PagosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const DocumentosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ContabilidadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EmpleadosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ConfiguracionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ParkingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5,22H19a3,3,0,0,0,3-3V5a3,3,0,0,0-3-3H5A3,3,0,0,0,2,5V19A3,3,0,0,0,5,22ZM4,5A1,1,0,0,1,5,4H19a1,1,0,0,1,1,1V19a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1ZM9,18a1,1,0,0,0,1-1V14h2a4,4,0,0,0,0-8H9A1,1,0,0,0,8,7V17A1,1,0,0,0,9,18ZM10,8h2a2,2,0,0,1,0,4H10Z" />
  </svg>
);

// Icono de cesta de compra (shopping basket)
const TiendaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l1 9a2 2 0 002 2h8a2 2 0 002-2l1-9M9 11V7a3 3 0 116 0v4M3 11h18" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const BetaBadge = () => (
  <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-white text-primary-dark rounded-full">
    Beta
  </span>
);

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'Reservas', href: '/reservas', icon: ReservasIcon },
  { name: 'Clientes', href: '/clientes', icon: ClientesIcon, isBeta: true },
  { name: 'Pagos', href: '/pagos', icon: PagosIcon, isBeta: true },
  { name: 'Parking', href: '/parking', icon: ParkingIcon, isBeta: true },
  { name: 'Tienda', href: '/tienda', icon: TiendaIcon, isBeta: true },
  { name: 'Documentos', href: '/documentos', icon: DocumentosIcon, isBeta: true },
  { name: 'Contabilidad', href: '/contabilidad', icon: ContabilidadIcon, roles: ['admin', 'fl-admin'] },
  { name: 'Empleados', href: '/empleados', icon: EmpleadosIcon, roles: ['admin', 'fl-admin'], isBeta: true },
  { name: 'Configuración', href: '/configuracion', icon: ConfiguracionIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useUserContext();
  const { usuario } = useUserData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Filtrar las opciones de navegación según el rol del usuario
  const filteredNavigation = navigation.filter(item => {
    // Si no hay restricción de roles, la opción está disponible para todos
    if (!item.roles) return true;
    // Si hay restricción de roles, verificar si el usuario tiene el rol permitido
    return item.roles.includes(usuario?.rol || '');
  });
  
  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-white/30 z-20 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed md:static w-64 bg-primary-dark text-white flex flex-col h-screen z-30 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-primary-light">
          <div className="text-xl font-bold flex flex-col items-center flex-1">
            <Image
              src="/cropped-lgo.png"
              alt="Flecha Extreme Logo"
              width={150}
              height={50}
              priority
            />
          </div>
          <button 
            onClick={onToggle}
            className="md:hidden p-2 rounded-lg hover:bg-primary transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-accent-light'
                        : 'hover:bg-primary hover:text-accent'
                    }`}
                    onClick={() => {
                      // En móvil, cerrar el sidebar al hacer clic en un enlace
                      if (window.innerWidth < 768) {
                        onToggle();
                      }
                    }}
                  >
                    <span className="mr-3">
                      <item.icon />
                    </span>
                    {item.name}
                    {item.isBeta && <BetaBadge />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-primary-light">
          <div className="flex items-center text-sm mb-4">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-2">
              {usuario?.nombre ? (
                <span className="text-primary-dark font-bold">
                  {usuario.nombre.substring(0, 1).toUpperCase()}
                </span>
              ) : (
                <span className="text-primary-dark font-bold">FE</span>
              )}
            </div>
            <div>
              <p className="font-medium">
                {usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Flecha Extreme'}
              </p>
              <p className="text-xs text-gray-300">{usuario?.displayRol || 'ERP Admin'}</p>
            </div>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-4 py-2 rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              <span className="mr-3">
                <LogoutIcon />
              </span>
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </button>
          )}
        </div>
      </div>
    </>
  );
} 
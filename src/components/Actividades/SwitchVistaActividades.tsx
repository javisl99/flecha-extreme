'use client';

import { useState } from 'react';

export type VistaActividadesTipo = 'lista' | 'calendario';

interface SwitchVistaActividadesProps {
  vistaActual: VistaActividadesTipo;
  onVistaChange: (vista: VistaActividadesTipo) => void;
}

export default function SwitchVistaActividades({ vistaActual, onVistaChange }: SwitchVistaActividadesProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    const nuevaVista = vistaActual === 'lista' ? 'calendario' : 'lista';
    
    // Pequeño delay para la animación
    setTimeout(() => {
      onVistaChange(nuevaVista);
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
        <div className="flex items-center space-x-1">
          {/* Botón Lista */}
          <button
            onClick={() => vistaActual !== 'lista' && onVistaChange('lista')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              vistaActual === 'lista'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isAnimating ? 'opacity-50' : ''} cursor-pointer`}
            disabled={isAnimating}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Lista</span>
            </div>
          </button>

          {/* Separador */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* Botón Calendario */}
          <button
            onClick={() => vistaActual !== 'calendario' && onVistaChange('calendario')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              vistaActual === 'calendario'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isAnimating ? 'opacity-50' : ''} cursor-pointer`}
            disabled={isAnimating}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Calendario</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

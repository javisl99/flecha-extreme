'use client';

import { useState } from 'react';

export type VistaTipo = 'tienda' | 'pedidos';

interface SwitchVistaProps {
  vistaActual: VistaTipo;
  onVistaChange: (vista: VistaTipo) => void;
}

export default function SwitchVista({ vistaActual, onVistaChange }: SwitchVistaProps) {
  const [isAnimating] = useState(false);

  // const _handleToggle = () => {
  //   setIsAnimating(true);
  //   const nuevaVista = vistaActual === 'tienda' ? 'pedidos' : 'tienda';
  //   
  //   // Pequeño delay para la animación
  //   setTimeout(() => {
  //     onVistaChange(nuevaVista);
  //     setIsAnimating(false);
  //   }, 150);
  // };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
        <div className="flex items-center space-x-1">
          {/* Botón Tienda */}
          <button
            onClick={() => vistaActual !== 'tienda' && onVistaChange('tienda')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              vistaActual === 'tienda'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isAnimating ? 'opacity-50' : ''} cursor-pointer`}
            disabled={isAnimating}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Tienda</span>
            </div>
          </button>

          {/* Separador */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* Botón Pedidos */}
          <button
            onClick={() => vistaActual !== 'pedidos' && onVistaChange('pedidos')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              vistaActual === 'pedidos'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isAnimating ? 'opacity-50' : ''} cursor-pointer`}
            disabled={isAnimating}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Pedidos</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

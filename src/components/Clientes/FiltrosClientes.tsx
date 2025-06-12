import { useState, useEffect } from 'react';
import { UserIcon, EnvelopeIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline';

export interface FiltrosClienteState {
  nombre: string;
  apellidos: string;
  email: string;
  movil: string;
  dni: string;
}

interface FiltrosClientesProps {
  onFiltrosChange: (filtros: FiltrosClienteState) => void;
}

export function FiltrosClientes({ onFiltrosChange }: FiltrosClientesProps) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  
  const [filtros, setFiltros] = useState<FiltrosClienteState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: ''
  });

  // Usar useEffect para notificar al padre de los cambios
  useEffect(() => {
    onFiltrosChange(filtros);
  }, [filtros, onFiltrosChange]);

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo: keyof FiltrosClienteState, valor: string) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      [campo]: valor
    }));
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const filtrosVacios: FiltrosClienteState = {
      nombre: '',
      apellidos: '',
      email: '',
      movil: '',
      dni: ''
    };
    
    setFiltros(filtrosVacios);
  };

  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
        <h3 className="font-medium text-lg dark:text-white">Filtros</h3>
        <button 
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {filtrosAbiertos ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {filtrosAbiertos && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por Nombre */}
            <div>
              <label htmlFor="filtro-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <div className="relative">
                <UserIcon className={inputIconClass} />
                <input
                  id="filtro-nombre"
                  type="text"
                  value={filtros.nombre}
                  onChange={(e) => handleFiltroChange('nombre', e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Apellidos */}
            <div>
              <label htmlFor="filtro-apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellidos
              </label>
              <div className="relative">
                <UserIcon className={inputIconClass} />
                <input
                  id="filtro-apellidos"
                  type="text"
                  value={filtros.apellidos}
                  onChange={(e) => handleFiltroChange('apellidos', e.target.value)}
                  placeholder="Buscar por apellidos..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Email */}
            <div>
              <label htmlFor="filtro-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className={inputIconClass} />
                <input
                  id="filtro-email"
                  type="text"
                  value={filtros.email}
                  onChange={(e) => handleFiltroChange('email', e.target.value)}
                  placeholder="Buscar por email..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Móvil */}
            <div>
              <label htmlFor="filtro-movil" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Móvil
              </label>
              <div className="relative">
                <PhoneIcon className={inputIconClass} />
                <input
                  id="filtro-movil"
                  type="text"
                  value={filtros.movil}
                  onChange={(e) => handleFiltroChange('movil', e.target.value)}
                  placeholder="Buscar por móvil..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por DNI */}
            <div>
              <label htmlFor="filtro-dni" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DNI
              </label>
              <div className="relative">
                <IdentificationIcon className={inputIconClass} />
                <input
                  id="filtro-dni"
                  type="text"
                  value={filtros.dni}
                  onChange={(e) => handleFiltroChange('dni', e.target.value)}
                  placeholder="Buscar por DNI..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chips de filtros activos */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {filtros.nombre && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Nombre: {filtros.nombre}</span>
            <button 
              onClick={() => handleFiltroChange('nombre', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.apellidos && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Apellidos: {filtros.apellidos}</span>
            <button 
              onClick={() => handleFiltroChange('apellidos', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.email && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Email: {filtros.email}</span>
            <button 
              onClick={() => handleFiltroChange('email', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.movil && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Móvil: {filtros.movil}</span>
            <button 
              onClick={() => handleFiltroChange('movil', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.dni && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>DNI: {filtros.dni}</span>
            <button 
              onClick={() => handleFiltroChange('dni', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {(filtros.nombre || filtros.apellidos || filtros.email || filtros.movil || filtros.dni) && (
          <button 
            onClick={limpiarFiltros}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Limpiar todos
          </button>
        )}
      </div>
    </div>
  );
} 
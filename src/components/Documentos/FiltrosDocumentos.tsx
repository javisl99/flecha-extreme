import { useState } from 'react';
import { DocumentIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

export interface FiltrosDocumentoState {
  nombre: string;
  descripcion: string;
  usuario: string;
  fechaDesde: string;
  fechaHasta: string;
}

interface FiltrosDocumentosProps {
  onFiltrosChange: (filtros: FiltrosDocumentoState) => void;
}

export function FiltrosDocumentos({ onFiltrosChange }: FiltrosDocumentosProps) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  
  const [filtros, setFiltros] = useState<FiltrosDocumentoState>({
    nombre: '',
    descripcion: '',
    usuario: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo: keyof FiltrosDocumentoState, valor: string) => {
    setFiltros(prevFiltros => {
      const nuevosFiltros = {
        ...prevFiltros,
        [campo]: valor
      };
      
      onFiltrosChange(nuevosFiltros);
      return nuevosFiltros;
    });
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const filtrosVacios: FiltrosDocumentoState = {
      nombre: '',
      descripcion: '',
      usuario: '',
      fechaDesde: '',
      fechaHasta: ''
    };
    
    setFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div 
        onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
        className="p-4 flex items-center justify-between border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        <h3 className="font-medium text-lg dark:text-white">Filtros</h3>
        <div className="text-gray-500 dark:text-gray-400">
          {filtrosAbiertos ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      
      {filtrosAbiertos && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por Nombre */}
            <div>
              <label htmlFor="filtro-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del documento
              </label>
              <div className="relative">
                <DocumentIcon className={inputIconClass} />
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

            {/* Filtro por Descripción */}
            <div>
              <label htmlFor="filtro-descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <div className="relative">
                <DocumentIcon className={inputIconClass} />
                <input
                  id="filtro-descripcion"
                  type="text"
                  value={filtros.descripcion}
                  onChange={(e) => handleFiltroChange('descripcion', e.target.value)}
                  placeholder="Buscar en descripción..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Usuario */}
            <div>
              <label htmlFor="filtro-usuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario
              </label>
              <div className="relative">
                <UserIcon className={inputIconClass} />
                <input
                  id="filtro-usuario"
                  type="text"
                  value={filtros.usuario}
                  onChange={(e) => handleFiltroChange('usuario', e.target.value)}
                  placeholder="Buscar por usuario..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Fecha desde */}
            <div>
              <label htmlFor="filtro-fecha-desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha desde
              </label>
              <div className="relative">
                <CalendarIcon className={inputIconClass} />
                <input
                  id="filtro-fecha-desde"
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Fecha hasta */}
            <div>
              <label htmlFor="filtro-fecha-hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha hasta
              </label>
              <div className="relative">
                <CalendarIcon className={inputIconClass} />
                <input
                  id="filtro-fecha-hasta"
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
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

        {filtros.descripcion && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Descripción: {filtros.descripcion}</span>
            <button 
              onClick={() => handleFiltroChange('descripcion', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.usuario && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Usuario: {filtros.usuario}</span>
            <button 
              onClick={() => handleFiltroChange('usuario', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {(filtros.fechaDesde || filtros.fechaHasta) && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>
              Fecha: 
              {filtros.fechaDesde ? ` desde ${new Date(filtros.fechaDesde).toLocaleDateString('es-ES')}` : ''}
              {filtros.fechaHasta ? ` hasta ${new Date(filtros.fechaHasta).toLocaleDateString('es-ES')}` : ''}
            </span>
            <button 
              onClick={() => {
                handleFiltroChange('fechaDesde', '');
                handleFiltroChange('fechaHasta', '');
              }}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {(filtros.nombre || filtros.descripcion || filtros.usuario || filtros.fechaDesde || filtros.fechaHasta) && (
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
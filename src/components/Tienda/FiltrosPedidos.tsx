import { useState } from 'react';
import { UserIcon, DocumentTextIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Pedido } from '@/hooks/usePedidos';

export interface FiltrosPedidoState {
  cliente: string;
  estado: string;
  fecha_desde: string;
  fecha_hasta: string;
  concepto: string;
}

interface FiltrosPedidosProps {
  onFiltrosChange: (filtros: FiltrosPedidoState) => void;
}

export function FiltrosPedidos({ onFiltrosChange }: FiltrosPedidosProps) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  
  const [filtros, setFiltros] = useState<FiltrosPedidoState>({
    cliente: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    concepto: ''
  });

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo: keyof FiltrosPedidoState, valor: string) => {
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
    const filtrosVacios: FiltrosPedidoState = {
      cliente: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      concepto: ''
    };
    
    setFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400";

  const estadosDisponibles: Record<string, string> = {
    'pagado': 'Pagado',
    'pendiente': 'Pendiente',
    'cancelado': 'Cancelado',
    'en_proceso': 'En Proceso'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div 
        onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
        className="p-4 flex items-center justify-between border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        <h3 className="font-medium text-lg dark:text-white">Filtros de Pedidos</h3>
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
            {/* Filtro por Cliente */}
            <div>
              <label htmlFor="filtro-cliente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <div className="relative">
                <UserIcon className={inputIconClass} />
                <input
                  id="filtro-cliente"
                  type="text"
                  value={filtros.cliente}
                  onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                  placeholder="Buscar por cliente..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label htmlFor="filtro-estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <div className="relative">
                <CheckCircleIcon className={inputIconClass} />
                <select
                  id="filtro-estado"
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(estadosDisponibles).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro por Fecha Desde */}
            <div>
              <label htmlFor="filtro-fecha-desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Desde
              </label>
              <div className="relative">
                <CalendarIcon className={inputIconClass} />
                <input
                  id="filtro-fecha-desde"
                  type="date"
                  value={filtros.fecha_desde}
                  onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Fecha Hasta */}
            <div>
              <label htmlFor="filtro-fecha-hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Hasta
              </label>
              <div className="relative">
                <CalendarIcon className={inputIconClass} />
                <input
                  id="filtro-fecha-hasta"
                  type="date"
                  value={filtros.fecha_hasta}
                  onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Concepto */}
            <div>
              <label htmlFor="filtro-concepto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Concepto
              </label>
              <div className="relative">
                <DocumentTextIcon className={inputIconClass} />
                <input
                  id="filtro-concepto"
                  type="text"
                  value={filtros.concepto}
                  onChange={(e) => handleFiltroChange('concepto', e.target.value)}
                  placeholder="Buscar por concepto..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chips de filtros activos */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {filtros.cliente && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Cliente: {filtros.cliente}</span>
            <button 
              onClick={() => handleFiltroChange('cliente', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.estado && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Estado: {estadosDisponibles[filtros.estado]}</span>
            <button 
              onClick={() => handleFiltroChange('estado', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.fecha_desde && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Desde: {filtros.fecha_desde}</span>
            <button 
              onClick={() => handleFiltroChange('fecha_desde', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.fecha_hasta && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Hasta: {filtros.fecha_hasta}</span>
            <button 
              onClick={() => handleFiltroChange('fecha_hasta', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {filtros.concepto && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Concepto: {filtros.concepto}</span>
            <button 
              onClick={() => handleFiltroChange('concepto', '')}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {(filtros.cliente || filtros.estado || filtros.fecha_desde || filtros.fecha_hasta || filtros.concepto) && (
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

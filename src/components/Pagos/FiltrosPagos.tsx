import { useState } from 'react';
import { UserIcon, DocumentTextIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Pago } from '@/hooks/usePagos';

export interface FiltrosPagoState {
  cliente: string;
  origen_tipo: string;
  concepto: string;
  metodo: string;
  estado: string;
}

interface FiltrosPagosProps {
  onFiltrosChange: (filtros: FiltrosPagoState) => void;
}

export function FiltrosPagos({ onFiltrosChange }: FiltrosPagosProps) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  
  const [filtros, setFiltros] = useState<FiltrosPagoState>({
    cliente: '',
    origen_tipo: '',
    concepto: '',
    metodo: '',
    estado: ''
  });

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo: keyof FiltrosPagoState, valor: string) => {
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
    const filtrosVacios: FiltrosPagoState = {
      cliente: '',
      origen_tipo: '',
      concepto: '',
      metodo: '',
      estado: ''
    };
    
    setFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400";

  const metodosDisponibles: Record<Pago['metodo'], string> = {
    'efectivo': 'Efectivo',
    'tpv': 'Tarjeta',
    'tpv_online': 'Tarjeta Online',
    'bizum_alfonso': 'Bizum Alfonso',
    'bizum_robe': 'Bizum Robe',
    'bizum_alba': 'Bizum Alba',
    'bizum_maria': 'Bizum María',
    'bizum_jm': 'Bizum JM',
    'angeles': 'Ángeles'
  };

  const origenesDisponibles: Record<Pago['origen_tipo'], string> = {
    'parking': 'Parking',
    'pedido': 'Pedido',
    'reserva': 'Reserva',
    'actividad': 'Actividad'
  };

  const estadosDisponibles: Record<Pago['estado'], string> = {
    'completado': 'Completado',
    'pendiente': 'Pendiente',
    'cancelado': 'Cancelado'
  };

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

            {/* Filtro por Origen */}
            <div>
              <label htmlFor="filtro-origen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Origen
              </label>
              <div className="relative">
                <DocumentTextIcon className={inputIconClass} />
                <select
                  id="filtro-origen"
                  value={filtros.origen_tipo}
                  onChange={(e) => handleFiltroChange('origen_tipo', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                >
                  <option value="">Todos los orígenes</option>
                  {Object.entries(origenesDisponibles).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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

            {/* Filtro por Método de Pago */}
            <div>
              <label htmlFor="filtro-metodo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Método de pago
              </label>
              <div className="relative">
                <CreditCardIcon className={inputIconClass} />
                <select
                  id="filtro-metodo"
                  value={filtros.metodo}
                  onChange={(e) => handleFiltroChange('metodo', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                >
                  <option value="">Todos los métodos</option>
                  {Object.entries(metodosDisponibles).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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

        {filtros.origen_tipo && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Origen: {origenesDisponibles[filtros.origen_tipo as Pago['origen_tipo']]}</span>
            <button 
              onClick={() => handleFiltroChange('origen_tipo', '')}
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

        {filtros.metodo && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Método: {metodosDisponibles[filtros.metodo as Pago['metodo']]}</span>
            <button 
              onClick={() => handleFiltroChange('metodo', '')}
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
            <span>Estado: {estadosDisponibles[filtros.estado as Pago['estado']]}</span>
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

        {(filtros.cliente || filtros.origen_tipo || filtros.concepto || filtros.metodo || filtros.estado) && (
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
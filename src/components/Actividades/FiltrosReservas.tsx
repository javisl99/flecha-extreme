'use client';

import { useState } from 'react';

export interface FiltrosReservaState {
  cliente: string;
  actividad: string;
  estado: string;
  empresa: string;
  fechaDesde: string;
  fechaHasta: string;
}

interface FiltrosReservasProps {
  onFiltrosChange: (filtros: FiltrosReservaState) => void;
}

export default function FiltrosReservas({ onFiltrosChange }: FiltrosReservasProps) {
  const [filtros, setFiltros] = useState<FiltrosReservaState>({
    cliente: '',
    actividad: '',
    estado: '',
    empresa: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  const handleFiltroChange = (campo: keyof FiltrosReservaState, valor: string) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      cliente: '',
      actividad: '',
      estado: '',
      empresa: '',
      fechaDesde: '',
      fechaHasta: ''
    };
    setFiltros(filtrosLimpios);
    onFiltrosChange(filtrosLimpios);
  };

  return (
    <div className="space-y-4 p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Filtros principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cliente
          </label>
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={filtros.cliente}
            onChange={(e) => handleFiltroChange('cliente', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Actividad
          </label>
          <input
            type="text"
            placeholder="Buscar actividad..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={filtros.actividad}
            onChange={(e) => handleFiltroChange('actividad', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={filtros.estado}
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Empresa
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={filtros.empresa}
            onChange={(e) => handleFiltroChange('empresa', e.target.value)}
          >
            <option value="">Todas</option>
            <option value="Flecha Extreme">Flecha Extreme</option>
            <option value="Rober">Rober</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Desde
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={filtros.fechaDesde}
            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Hasta
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={filtros.fechaHasta}
            onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
          />
        </div>
      </div>

      {/* Botón limpiar filtros */}
      <div className="flex justify-end">
        <button
          onClick={limpiarFiltros}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}

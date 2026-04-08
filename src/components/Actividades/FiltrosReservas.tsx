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

  const inputClassName =
    'h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline';

  return (
    <div className="rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-low px-6 py-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <div>
        <label className={labelClassName}>
          Cliente
        </label>
        <input
          type="text"
          placeholder="Buscar cliente..."
          className={inputClassName}
          value={filtros.cliente}
          onChange={(e) => handleFiltroChange('cliente', e.target.value)}
        />
      </div>

      <div>
        <label className={labelClassName}>
          Actividad
        </label>
        <input
          type="text"
          placeholder="Buscar actividad..."
          className={inputClassName}
          value={filtros.actividad}
          onChange={(e) => handleFiltroChange('actividad', e.target.value)}
        />
      </div>

      <div>
        <label className={labelClassName}>
          Estado
        </label>
        <select
          className={inputClassName}
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
        <label className={labelClassName}>
          Empresa
        </label>
        <select
          className={inputClassName}
          value={filtros.empresa}
          onChange={(e) => handleFiltroChange('empresa', e.target.value)}
        >
          <option value="">Todas</option>
          <option value="Flecha Extreme">Flecha Extreme</option>
          <option value="Rober">Rober</option>
        </select>
      </div>

      <div>
        <label className={labelClassName}>
          Fecha Desde
        </label>
        <input
          type="date"
          className={inputClassName}
          value={filtros.fechaDesde}
          onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
        />
      </div>

      <div>
        <label className={labelClassName}>
          Fecha Hasta
        </label>
        <input
          type="date"
          className={inputClassName}
          value={filtros.fechaHasta}
          onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
        />
      </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={limpiarFiltros}
          className="rounded-full border border-outline-variant/45 bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}

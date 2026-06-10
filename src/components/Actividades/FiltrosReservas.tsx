'use client';

import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

  const inputClassName =
    'h-11 w-full rounded-full border border-primary/10 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';

  const dateInputClassName = `${inputClassName} activities-date-input`;

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline';

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-auto sm:justify-start ${
          isOpen
            ? 'border-primary/25 bg-primary text-white shadow-md shadow-primary/15'
            : 'border-outline-variant/35 bg-white text-on-surface-variant hover:border-primary/25 hover:text-primary'
        }`}
      >
        <FunnelIcon className="h-4 w-4" />
        <span>Filtros</span>
        {activeFiltersCount > 0 ? (
          <span
            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-black ${
              isOpen ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
            }`}
          >
            {activeFiltersCount}
          </span>
        ) : null}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 rounded-[1.25rem] border border-outline-variant/20 bg-white p-4 shadow-[0_22px_50px_rgba(15,23,42,0.14)] sm:left-auto sm:right-0 sm:w-[min(92vw,44rem)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-outline">Filtros del listado</p>
              <p className="mt-1 text-sm text-on-surface-variant">Refina cliente, actividad, estado, empresa y fechas sin quitar protagonismo a la lista.</p>
            </div>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="min-h-10 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              Limpiar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                className={dateInputClassName}
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
                className={dateInputClassName}
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

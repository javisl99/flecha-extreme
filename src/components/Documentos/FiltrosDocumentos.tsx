import { useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  QueueListIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

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
  const [filtros, setFiltros] = useState<FiltrosDocumentoState>({
    nombre: '',
    descripcion: '',
    usuario: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  useEffect(() => {
    onFiltrosChange(filtros);
  }, [filtros, onFiltrosChange]);

  const handleFiltroChange = (campo: keyof FiltrosDocumentoState, valor: string) => {
    setFiltros((prevFiltros) => {
      return {
        ...prevFiltros,
        [campo]: valor,
      };
    });
  };

  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      descripcion: '',
      usuario: '',
      fechaDesde: '',
      fechaHasta: '',
    });
  };

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline';
  const inputClassName =
    'h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const inputWithIconClassName = `${inputClassName} pl-10`;
  const iconClassName = 'pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline';

  return (
    <div className="rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label htmlFor="filtro-documentos-nombre" className={labelClassName}>
            Nombre
          </label>
          <div className="relative">
            <DocumentTextIcon className={iconClassName} />
            <input
              id="filtro-documentos-nombre"
              type="text"
              value={filtros.nombre}
              onChange={(e) => handleFiltroChange('nombre', e.target.value)}
              placeholder="Nombre del documento..."
              className={inputWithIconClassName}
            />
          </div>
        </div>
        <div>
          <label htmlFor="filtro-documentos-descripcion" className={labelClassName}>
            Descripción
          </label>
          <div className="relative">
            <QueueListIcon className={iconClassName} />
            <input
              id="filtro-documentos-descripcion"
              type="text"
              value={filtros.descripcion}
              onChange={(e) => handleFiltroChange('descripcion', e.target.value)}
              placeholder="Buscar en descripción..."
              className={inputWithIconClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-documentos-usuario" className={labelClassName}>
            Usuario
          </label>
          <div className="relative">
            <UserIcon className={iconClassName} />
            <input
              id="filtro-documentos-usuario"
              type="text"
              value={filtros.usuario}
              onChange={(e) => handleFiltroChange('usuario', e.target.value)}
              placeholder="Buscar por usuario..."
              className={inputWithIconClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-documentos-fecha-desde" className={labelClassName}>
            Fecha desde
          </label>
          <div className="relative">
            <CalendarDaysIcon className={iconClassName} />
            <input
              id="filtro-documentos-fecha-desde"
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className={inputWithIconClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-documentos-fecha-hasta" className={labelClassName}>
            Fecha hasta
          </label>
          <div className="relative">
            <CalendarDaysIcon className={iconClassName} />
            <input
              id="filtro-documentos-fecha-hasta"
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className={inputWithIconClassName}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={limpiarFiltros}
          className="min-h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-auto"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}

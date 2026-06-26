import { useEffect, useRef, useState } from 'react';
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FunnelIcon,
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
  title?: string;
  subtitle?: string;
}

export function FiltrosDocumentos({ onFiltrosChange, title, subtitle }: FiltrosDocumentosProps) {
  const [filtros, setFiltros] = useState<FiltrosDocumentoState>({
    nombre: '',
    descripcion: '',
    usuario: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onFiltrosChange(filtros);
  }, [filtros, onFiltrosChange]);

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
    'h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 cursor-pointer';
  const inputWithIconClassName = `${inputClassName} pl-10`;
  const iconClassName = 'pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline';
  const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

  return (
    <div ref={containerRef} className="w-full">
      {title || subtitle ? (
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {title ? (
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-outline">
                {title}
              </p>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-on-surface-variant">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-auto sm:justify-start ${
              isOpen
                ? 'border-primary/25 bg-primary text-white shadow-md shadow-primary/15'
                : 'border-outline-variant/35 bg-white text-on-surface-variant hover:border-primary/25 hover:text-primary'
            } cursor-pointer`}
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
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-auto sm:justify-start ${
            isOpen
              ? 'border-primary/25 bg-primary text-white shadow-md shadow-primary/15'
              : 'border-outline-variant/35 bg-white text-on-surface-variant hover:border-primary/25 hover:text-primary'
          } cursor-pointer`}
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
      )}

      {isOpen ? (
        <div className="mt-3 rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5">
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
              className="min-h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-auto cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

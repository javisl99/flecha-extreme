import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { EnvelopeIcon, IdentificationIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

export interface FiltrosClienteState {
  nombre: string;
  apellidos: string;
  email: string;
  movil: string;
  dni: string;
}

interface FiltrosClientesProps {
  onFiltrosChange: (filtros: FiltrosClienteState) => void;
  title?: string;
  subtitle?: string;
}

export function FiltrosClientes({ onFiltrosChange, title, subtitle }: FiltrosClientesProps) {
  const [filtros, setFiltros] = useState<FiltrosClienteState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: '',
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

  const handleFiltroChange = (campo: keyof FiltrosClienteState, valor: string) => {
    setFiltros((prevFiltros) => ({
      ...prevFiltros,
      [campo]: valor,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      apellidos: '',
      email: '',
      movil: '',
      dni: '',
    });
  };

  const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

  const inputClassName =
    'h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const iconClassName = 'pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline';
  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline';

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
      )}

      {isOpen ? (
        <div className="mt-3 rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label htmlFor="filtro-nombre" className={labelClassName}>
                Nombre
              </label>
              <div className="relative">
                <UserIcon className={iconClassName} />
                <input
                  id="filtro-nombre"
                  type="text"
                  value={filtros.nombre}
                  onChange={(e) => handleFiltroChange('nombre', e.target.value)}
                  placeholder="Nombre..."
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="filtro-apellidos" className={labelClassName}>
                Apellidos
              </label>
              <div className="relative">
                <UserIcon className={iconClassName} />
                <input
                  id="filtro-apellidos"
                  type="text"
                  value={filtros.apellidos}
                  onChange={(e) => handleFiltroChange('apellidos', e.target.value)}
                  placeholder="Apellidos..."
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="filtro-email" className={labelClassName}>
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className={iconClassName} />
                <input
                  id="filtro-email"
                  type="text"
                  value={filtros.email}
                  onChange={(e) => handleFiltroChange('email', e.target.value)}
                  placeholder="Email..."
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="filtro-movil" className={labelClassName}>
                Móvil
              </label>
              <div className="relative">
                <PhoneIcon className={iconClassName} />
                <input
                  id="filtro-movil"
                  type="text"
                  value={filtros.movil}
                  onChange={(e) => handleFiltroChange('movil', e.target.value)}
                  placeholder="Móvil..."
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="filtro-dni" className={labelClassName}>
                DNI
              </label>
              <div className="relative">
                <IdentificationIcon className={iconClassName} />
                <input
                  id="filtro-dni"
                  type="text"
                  value={filtros.dni}
                  onChange={(e) => handleFiltroChange('dni', e.target.value)}
                  placeholder="DNI..."
                  className={inputClassName}
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

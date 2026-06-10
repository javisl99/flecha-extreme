import { useEffect, useRef, useState } from 'react';
import {
  ChevronDownIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  FunnelIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
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
  title?: string;
  subtitle?: string;
}

export function FiltrosPagos({ onFiltrosChange, title, subtitle }: FiltrosPagosProps) {
  const [filtros, setFiltros] = useState<FiltrosPagoState>({
    cliente: '',
    origen_tipo: '',
    concepto: '',
    metodo: '',
    estado: ''
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const handleFiltroChange = (campo: keyof FiltrosPagoState, valor: string) => {
    setFiltros((prevFiltros) => {
      const nuevosFiltros = {
        ...prevFiltros,
        [campo]: valor
      };

      onFiltrosChange(nuevosFiltros);
      return nuevosFiltros;
    });
  };

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

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline';
  const inputClassName =
    'h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 cursor-pointer';
  const inputWithIconClassName = `${inputClassName} pl-10`;
  const inputIconClass = 'pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline';

  const metodosDisponibles: Record<Pago['metodo'], string> = {
    efectivo: 'Efectivo',
    tpv: 'Tarjeta',
    tpv_online: 'Tarjeta Online',
    transferencia: 'Transferencia',
    bizum_alfonso: 'Bizum Alfonso',
    bizum_robe: 'Bizum Robe',
    bizum_alba: 'Bizum Alba',
    bizum_maria: 'Bizum María',
    bizum_jm: 'Bizum JM',
    angeles: 'Ángeles'
  };

  const origenesDisponibles: Record<Pago['origen_tipo'], string> = {
    parking: 'Parking',
    pedido: 'Pedido',
    reserva: 'Reserva',
    actividad: 'Actividad'
  };

  const estadosDisponibles: Record<Pago['estado'], string> = {
    completado: 'Completado',
    pendiente: 'Pendiente',
    cancelado: 'Cancelado'
  };

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
              <label htmlFor="filtro-pagos-cliente" className={labelClassName}>
                Cliente
              </label>
              <div className="relative">
                <UserIcon className={inputIconClass} />
                <input
                  id="filtro-pagos-cliente"
                  type="text"
                  value={filtros.cliente}
                  onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                  placeholder="Buscar cliente..."
                  className={inputWithIconClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="filtro-pagos-origen" className={labelClassName}>
                Origen
              </label>
              <div className="relative">
                <DocumentTextIcon className={inputIconClass} />
                <select
                  id="filtro-pagos-origen"
                  value={filtros.origen_tipo}
                  onChange={(e) => handleFiltroChange('origen_tipo', e.target.value)}
                  className={`${inputWithIconClassName} cursor-pointer`}
                >
                  <option value="">Todos</option>
                  {Object.entries(origenesDisponibles).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="filtro-pagos-concepto" className={labelClassName}>
                Concepto
              </label>
              <div className="relative">
                <DocumentTextIcon className={inputIconClass} />
                <input
                  id="filtro-pagos-concepto"
                  type="text"
                  value={filtros.concepto}
                  onChange={(e) => handleFiltroChange('concepto', e.target.value)}
                  placeholder="Buscar concepto..."
                  className={inputWithIconClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="filtro-pagos-metodo" className={labelClassName}>
                Método
              </label>
              <div className="relative">
                <CreditCardIcon className={inputIconClass} />
                <select
                  id="filtro-pagos-metodo"
                  value={filtros.metodo}
                  onChange={(e) => handleFiltroChange('metodo', e.target.value)}
                  className={`${inputWithIconClassName} cursor-pointer`}
                >
                  <option value="">Todos</option>
                  {Object.entries(metodosDisponibles).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="filtro-pagos-estado" className={labelClassName}>
                Estado
              </label>
              <div className="relative">
                <CheckCircleIcon className={inputIconClass} />
                <select
                  id="filtro-pagos-estado"
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  className={`${inputWithIconClassName} cursor-pointer`}
                >
                  <option value="">Todos</option>
                  {Object.entries(estadosDisponibles).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
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

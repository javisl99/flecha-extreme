import { useState } from 'react';
import { CalendarIcon, CheckCircleIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';

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
  const [filtros, setFiltros] = useState<FiltrosPedidoState>({
    cliente: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    concepto: '',
  });

  const handleFiltroChange = (campo: keyof FiltrosPedidoState, valor: string) => {
    setFiltros((prevFiltros) => {
      const nuevosFiltros = {
        ...prevFiltros,
        [campo]: valor,
      };

      onFiltrosChange(nuevosFiltros);
      return nuevosFiltros;
    });
  };

  const limpiarFiltros = () => {
    const filtrosVacios: FiltrosPedidoState = {
      cliente: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      concepto: '',
    };

    setFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  const estadosDisponibles: Record<string, string> = {
    pagado: 'Pagado',
    pendiente: 'Pendiente',
    cancelado: 'Cancelado',
    en_proceso: 'En proceso',
  };

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline';
  const inputClassName =
    'h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const inputWithIconClassName = `${inputClassName} pl-10`;
  const inputIconClassName = 'pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline';

  return (
    <section className="rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-low px-6 py-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label htmlFor="filtro-pedidos-cliente" className={labelClassName}>
            Cliente
          </label>
          <div className="relative">
            <UserIcon className={inputIconClassName} />
            <input
              id="filtro-pedidos-cliente"
              type="text"
              value={filtros.cliente}
              onChange={(e) => handleFiltroChange('cliente', e.target.value)}
              placeholder="Buscar cliente..."
              className={inputWithIconClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-pedidos-estado" className={labelClassName}>
            Estado
          </label>
          <div className="relative">
            <CheckCircleIcon className={inputIconClassName} />
            <select
              id="filtro-pedidos-estado"
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

        <div>
          <label htmlFor="filtro-pedidos-fecha-desde" className={labelClassName}>
            Fecha desde
          </label>
          <div className="relative">
            <CalendarIcon className={inputIconClassName} />
            <input
              id="filtro-pedidos-fecha-desde"
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
              className={inputWithIconClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-pedidos-fecha-hasta" className={labelClassName}>
            Fecha hasta
          </label>
          <div className="relative">
            <CalendarIcon className={inputIconClassName} />
            <input
              id="filtro-pedidos-fecha-hasta"
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
              className={inputWithIconClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-pedidos-concepto" className={labelClassName}>
            Concepto
          </label>
          <div className="relative">
            <DocumentTextIcon className={inputIconClassName} />
            <input
              id="filtro-pedidos-concepto"
              type="text"
              value={filtros.concepto}
              onChange={(e) => handleFiltroChange('concepto', e.target.value)}
              placeholder="Buscar concepto..."
              className={inputWithIconClassName}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={limpiarFiltros}
          className="rounded-full border border-outline-variant/45 bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        >
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

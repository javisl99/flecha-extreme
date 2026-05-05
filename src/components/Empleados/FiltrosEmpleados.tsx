import { useEffect, useState } from 'react';
import { EnvelopeIcon, IdentificationIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

export interface FiltrosEmpleadoState {
  nombre: string;
  apellidos: string;
  email: string;
  movil: string;
  dni: string;
}

interface FiltrosEmpleadosProps {
  onFiltrosChange: (filtros: FiltrosEmpleadoState) => void;
}

export function FiltrosEmpleados({ onFiltrosChange }: FiltrosEmpleadosProps) {
  const [filtros, setFiltros] = useState<FiltrosEmpleadoState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: '',
  });

  useEffect(() => {
    onFiltrosChange(filtros);
  }, [filtros, onFiltrosChange]);

  const handleFiltroChange = (campo: keyof FiltrosEmpleadoState, valor: string) => {
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

  const inputClassName =
    'h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const iconClassName = 'pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline';
  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline';

  return (
    <div className="rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-low px-4 py-4 sm:px-6 sm:py-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label htmlFor="filtro-empleado-nombre" className={labelClassName}>
            Nombre
          </label>
          <div className="relative">
            <UserIcon className={iconClassName} />
            <input
              id="filtro-empleado-nombre"
              type="text"
              value={filtros.nombre}
              onChange={(e) => handleFiltroChange('nombre', e.target.value)}
              placeholder="Nombre..."
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-empleado-apellidos" className={labelClassName}>
            Apellidos
          </label>
          <div className="relative">
            <UserIcon className={iconClassName} />
            <input
              id="filtro-empleado-apellidos"
              type="text"
              value={filtros.apellidos}
              onChange={(e) => handleFiltroChange('apellidos', e.target.value)}
              placeholder="Apellidos..."
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-empleado-email" className={labelClassName}>
            Email
          </label>
          <div className="relative">
            <EnvelopeIcon className={iconClassName} />
            <input
              id="filtro-empleado-email"
              type="text"
              value={filtros.email}
              onChange={(e) => handleFiltroChange('email', e.target.value)}
              placeholder="Email..."
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-empleado-movil" className={labelClassName}>
            Móvil
          </label>
          <div className="relative">
            <PhoneIcon className={iconClassName} />
            <input
              id="filtro-empleado-movil"
              type="text"
              value={filtros.movil}
              onChange={(e) => handleFiltroChange('movil', e.target.value)}
              placeholder="Móvil..."
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-empleado-dni" className={labelClassName}>
            DNI
          </label>
          <div className="relative">
            <IdentificationIcon className={iconClassName} />
            <input
              id="filtro-empleado-dni"
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
          className="min-h-11 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-auto"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}

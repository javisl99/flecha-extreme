'use client';

export type VistaEmpleadosTipo = 'horarios' | 'empleados';

interface SwitchVistaEmpleadosProps {
  vistaActual: VistaEmpleadosTipo;
  onVistaChange: (vista: VistaEmpleadosTipo) => void;
}

export default function SwitchVistaEmpleados({ vistaActual, onVistaChange }: SwitchVistaEmpleadosProps) {
  const buttonBaseClass =
    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer';

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-1.5 shadow-sm">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => vistaActual !== 'horarios' && onVistaChange('horarios')}
          className={`${buttonBaseClass} ${
            vistaActual === 'horarios'
              ? 'primary-gradient text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Horarios
        </button>

        <button
          type="button"
          onClick={() => vistaActual !== 'empleados' && onVistaChange('empleados')}
          className={`${buttonBaseClass} ${
            vistaActual === 'empleados'
              ? 'primary-gradient text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-2a3 3 0 00-3-3H10a3 3 0 00-3 3v2m10 0H7m10-10a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Empleados
        </button>
      </div>
    </div>
  );
}

'use client';

export type VistaTipo = 'tienda' | 'pedidos';

interface SwitchVistaProps {
  vistaActual: VistaTipo;
  onVistaChange: (vista: VistaTipo) => void;
}

export default function SwitchVista({ vistaActual, onVistaChange }: SwitchVistaProps) {
  const buttonBaseClass =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="rounded-full border border-outline-variant/40 bg-surface-container-low p-1 shadow-sm">
      <div className="flex items-center gap-1">
        <button
          onClick={() => vistaActual !== 'tienda' && onVistaChange('tienda')}
          className={`${buttonBaseClass} ${
            vistaActual === 'tienda'
              ? 'primary-gradient text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
          } cursor-pointer`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Tienda
        </button>

        <button
          onClick={() => vistaActual !== 'pedidos' && onVistaChange('pedidos')}
          className={`${buttonBaseClass} ${
            vistaActual === 'pedidos'
              ? 'primary-gradient text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
          } cursor-pointer`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Pedidos
        </button>
      </div>
    </div>
  );
}

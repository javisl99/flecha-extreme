'use client';

export type VistaActividadesTipo = 'lista' | 'calendario';

interface SwitchVistaActividadesProps {
  vistaActual: VistaActividadesTipo;
  onVistaChange: (vista: VistaActividadesTipo) => void;
  onCambioALista?: () => void;
}

export default function SwitchVistaActividades({ vistaActual, onVistaChange, onCambioALista }: SwitchVistaActividadesProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => vistaActual !== 'calendario' && onVistaChange('calendario')}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          vistaActual === 'calendario'
            ? 'primary-gradient text-white shadow-md shadow-primary/20'
            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
        } cursor-pointer`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Calendario
      </button>

      <button
        type="button"
        onClick={() => {
          if (vistaActual !== 'lista') {
            onVistaChange('lista');
            onCambioALista?.();
          }
        }}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          vistaActual === 'lista'
            ? 'primary-gradient text-white shadow-md shadow-primary/20'
            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
        } cursor-pointer`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Lista
      </button>
    </div>
  );
}

'use client';

import { ReactNode } from 'react';

export type VistaContabilidadTipo =
  | 'movimientos'
  | 'cuentas'
  | 'efe'
  | 'bizum'
  | 'configuracion';

interface SwitchVistaContabilidadProps {
  vistaActual: VistaContabilidadTipo;
  onVistaChange: (vista: VistaContabilidadTipo) => void;
}

const VISTAS: Array<{
  id: VistaContabilidadTipo;
  label: string;
  icon: ReactNode;
}> = [
  {
    id: 'movimientos',
    label: 'Movimientos',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    ),
  },
  {
    id: 'cuentas',
    label: 'Cuentas',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7h18M6 12h12M9 17h6"
        />
      </svg>
    ),
  },
  {
    id: 'efe',
    label: 'EFE',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-10c1.7 0 3.152.529 3.75 1.272M12 8V6m0 12v-2m-3.75-1.272C8.848 15.471 10.3 16 12 16"
        />
      </svg>
    ),
  },
  {
    id: 'bizum',
    label: 'Bizum',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a5 5 0 00-10 0v2m-2 0h14l-1 10H6L5 9z"
        />
      </svg>
    ),
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317a1 1 0 011.35-.936l1.058.423a1 1 0 00.848 0l1.058-.423a1 1 0 011.35.936l.144 1.17a1 1 0 00.587.793l1.017.508a1 1 0 01.45 1.342l-.47 1.057a1 1 0 000 .814l.47 1.057a1 1 0 01-.45 1.342l-1.017.508a1 1 0 00-.587.793l-.144 1.17a1 1 0 01-1.35.936l-1.058-.423a1 1 0 00-.848 0l-1.058.423a1 1 0 01-1.35-.936l-.144-1.17a1 1 0 00-.587-.793l-1.017-.508a1 1 0 01-.45-1.342l.47-1.057a1 1 0 000-.814l-.47-1.057a1 1 0 01.45-1.342l1.017-.508a1 1 0 00.587-.793l.144-1.17z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export default function SwitchVistaContabilidad({
  vistaActual,
  onVistaChange,
}: SwitchVistaContabilidadProps) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full items-center gap-1 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-1.5 shadow-sm sm:min-w-0">
        {VISTAS.map((vista) => (
          <button
            key={vista.id}
            type="button"
            onClick={() => vistaActual !== vista.id && onVistaChange(vista.id)}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:flex-none ${
              vistaActual === vista.id
                ? 'primary-gradient text-white shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
            }`}
          >
            {vista.icon}
            <span>{vista.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

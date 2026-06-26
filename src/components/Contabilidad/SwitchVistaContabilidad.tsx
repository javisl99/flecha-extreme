'use client';

import { ReactNode } from 'react';
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  ClockIcon,
  Cog6ToothIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

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
    icon: <ListBulletIcon className="h-4 w-4" />,
  },
  {
    id: 'cuentas',
    label: 'Cuentas',
    icon: <BuildingLibraryIcon className="h-4 w-4" />,
  },
  {
    id: 'efe',
    label: 'EFE',
    icon: <BanknotesIcon className="h-4 w-4" />,
  },
  {
    id: 'bizum',
    label: 'Bizum',
    icon: <ClockIcon className="h-4 w-4" />,
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: <Cog6ToothIcon className="h-4 w-4" />,
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
            } cursor-pointer`}
          >
            {vista.icon}
            <span>{vista.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ContabilidadAccionesMenuProps {
  disabled?: boolean;
  onNuevaAportacion: () => void;
  onNuevoGasto: () => void;
  onNuevoTraspaso: () => void;
}

const menuItemClassName =
  'flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-container-high cursor-pointer';

export default function ContabilidadAccionesMenu({
  disabled = false,
  onNuevaAportacion,
  onNuevoGasto,
  onNuevoTraspaso,
}: ContabilidadAccionesMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="primary-gradient flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary-light/10 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto cursor-pointer"
      >
        <PlusIcon className="h-4 w-4" />
        Acciones
        <ChevronDownIcon className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-full min-w-[16rem] rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-xl sm:w-auto">
          <button
            type="button"
            className={menuItemClassName}
            onClick={() => handleSelect(onNuevaAportacion)}
          >
            <PlusIcon className="h-4 w-4 text-primary" />
            Nueva aportación
          </button>
          <button
            type="button"
            className={menuItemClassName}
            onClick={() => handleSelect(onNuevoGasto)}
          >
            <PlusIcon className="h-4 w-4 text-primary" />
            Nuevo gasto
          </button>
          <button
            type="button"
            className={menuItemClassName}
            onClick={() => handleSelect(onNuevoTraspaso)}
          >
            <PlusIcon className="h-4 w-4 text-primary" />
            Nuevo traspaso
          </button>
        </div>
      ) : null}
    </div>
  );
}

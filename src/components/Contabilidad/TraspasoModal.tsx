'use client';

import { Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import { CuentaContable } from '@/shared/types';
import { accountLabel } from '@/lib/contabilidad';

export type TraspasoFormState = {
  id: string | null;
  fechaOperacion: string;
  desdeCuentaId: string;
  haciaCuentaId: string;
  importeTotal: string;
  comentario: string;
};

interface TraspasoModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  form: TraspasoFormState;
  setForm: Dispatch<SetStateAction<TraspasoFormState>>;
  cuentas: CuentaContable[];
  saving: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export default function TraspasoModalV2({
  isOpen,
  onClose,
  form,
  setForm,
  cuentas,
  saving,
  onSubmit,
  onReset,
}: TraspasoModalV2Props) {
  if (!isOpen) return null;

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const inputClassName =
    'h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const title = form.id ? 'Editar traspaso' : 'Nuevo traspaso';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl">
        <div className="primary-gradient flex items-center justify-between px-6 py-4">
          <h3 className="font-headline text-xl font-extrabold tracking-tight text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md text-white/80 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Fecha</span>
              <input
                type="date"
                className={inputClassName}
                value={form.fechaOperacion}
                onChange={(e) => setForm((prev) => ({ ...prev, fechaOperacion: e.target.value }))}
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Desde</span>
              <select
                className={inputClassName}
                value={form.desdeCuentaId}
                onChange={(e) => setForm((prev) => ({ ...prev, desdeCuentaId: e.target.value }))}
                disabled={saving}
              >
                <option value="">Selecciona una cuenta</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {accountLabel(cuenta)}
                    {!cuenta.activo ? ' · Inactiva' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Hacia</span>
              <select
                className={inputClassName}
                value={form.haciaCuentaId}
                onChange={(e) => setForm((prev) => ({ ...prev, haciaCuentaId: e.target.value }))}
                disabled={saving}
              >
                <option value="">Selecciona una cuenta</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {accountLabel(cuenta)}
                    {!cuenta.activo ? ' · Inactiva' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Importe</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClassName}
                value={form.importeTotal}
                onChange={(e) => setForm((prev) => ({ ...prev, importeTotal: e.target.value }))}
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Comentario</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                value={form.comentario}
                onChange={(e) => setForm((prev) => ({ ...prev, comentario: e.target.value }))}
                disabled={saving}
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/20 pt-5">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
            >
              Cerrar
            </Button>
            {form.id ? (
              <Button
                variant="outline"
                type="button"
                onClick={onReset}
                disabled={saving}
                className="rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              >
                Limpiar edición
              </Button>
            ) : null}
            <Button
              variant="primary"
              type="button"
              loading={saving}
              onClick={onSubmit}
              className="primary-gradient rounded-full border border-primary-light/10 px-5 text-white shadow-lg shadow-primary/20 hover:brightness-110"
            >
              {form.id ? 'Actualizar traspaso' : 'Registrar traspaso'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

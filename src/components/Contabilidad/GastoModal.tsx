'use client';

import { Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import { DetalleGastoFormulario } from '@/hooks/useContabilidad';
import { CajaContable } from '@/shared/types';
import { CAJAS_CONTABLES, TIPOS_GASTO_CONTABLES } from '@/lib/contabilidad';

export type GastoFormState = {
  id: string | null;
  fechaOperacion: string;
  caja: CajaContable;
  concepto: string;
  comentario: string;
  detalle: DetalleGastoFormulario;
  archivo: File | null;
  nombreDocumento: string;
  descripcionDocumento: string;
};

interface GastoModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  form: GastoFormState;
  setForm: Dispatch<SetStateAction<GastoFormState>>;
  totalGastoFormulario: number;
  saving: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export default function GastoModalV2({
  isOpen,
  onClose,
  form,
  setForm,
  totalGastoFormulario,
  saving,
  onSubmit,
  onReset,
}: GastoModalV2Props) {
  if (!isOpen) return null;

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const inputClassName =
    'h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const textareaClassName =
    'w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const title = form.id ? 'Editar gasto' : 'Nuevo gasto';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90svh] w-full max-w-5xl overflow-hidden rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest shadow-xl sm:rounded-2xl">
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

        <div className="max-h-[calc(90svh-5rem)] space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Fecha registro</span>
              <input
                type="date"
                className={inputClassName}
                value={form.fechaOperacion}
                onChange={(e) => setForm((prev) => ({ ...prev, fechaOperacion: e.target.value }))}
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Caja</span>
              <select
                className={inputClassName}
                value={form.caja}
                onChange={(e) => setForm((prev) => ({ ...prev, caja: e.target.value as CajaContable }))}
                disabled={saving}
              >
                {CAJAS_CONTABLES.map((caja) => (
                  <option key={caja.value} value={caja.value}>
                    {caja.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-on-surface md:col-span-2">
              <span className={labelClassName}>Concepto</span>
              <input
                type="text"
                className={inputClassName}
                value={form.concepto}
                onChange={(e) => setForm((prev) => ({ ...prev, concepto: e.target.value }))}
                placeholder="Ej: Factura combustible marzo"
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Tipo gasto</span>
              <select
                className={inputClassName}
                value={form.detalle.tipo_gasto}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, tipo_gasto: e.target.value as DetalleGastoFormulario['tipo_gasto'] },
                  }))
                }
                disabled={saving}
              >
                {TIPOS_GASTO_CONTABLES.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Deducible</span>
              <select
                className={inputClassName}
                value={form.detalle.deducible}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, deducible: e.target.value as DetalleGastoFormulario['deducible'] },
                  }))
                }
                disabled={saving}
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="preguntar">Preguntar</option>
              </select>
            </label>

            <label className="text-sm text-on-surface md:col-span-2">
              <span className={labelClassName}>Descripción gasto</span>
              <input
                type="text"
                className={inputClassName}
                value={form.detalle.descripcion}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, descripcion: e.target.value },
                  }))
                }
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Proveedor</span>
              <input
                type="text"
                className={inputClassName}
                value={form.detalle.proveedor}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, proveedor: e.target.value },
                  }))
                }
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Núm. factura</span>
              <input
                type="text"
                className={inputClassName}
                value={form.detalle.num_factura || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, num_factura: e.target.value },
                  }))
                }
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Fecha factura</span>
              <input
                type="date"
                className={inputClassName}
                value={form.detalle.fecha_factura}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, fecha_factura: e.target.value },
                  }))
                }
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Base imponible</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClassName}
                value={form.detalle.base_imponible}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, base_imponible: Number(e.target.value) || 0 },
                  }))
                }
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>IVA %</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClassName}
                value={form.detalle.iva_pct}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, iva_pct: Number(e.target.value) || 0 },
                  }))
                }
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Total imponible</span>
              <input
                type="text"
                readOnly
                className="h-11 w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 text-sm font-semibold text-on-surface"
                value={`${totalGastoFormulario.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
              />
            </label>

            <label className="text-sm text-on-surface md:col-span-2">
              <span className={labelClassName}>Comentario gasto</span>
              <textarea
                rows={2}
                className={textareaClassName}
                value={form.detalle.comentario || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    detalle: { ...prev.detalle, comentario: e.target.value },
                  }))
                }
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface md:col-span-2">
              <span className={labelClassName}>Comentario interno del movimiento</span>
              <textarea
                rows={2}
                className={textareaClassName}
                value={form.comentario}
                onChange={(e) => setForm((prev) => ({ ...prev, comentario: e.target.value }))}
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Nombre documento</span>
              <input
                type="text"
                className={inputClassName}
                value={form.nombreDocumento}
                onChange={(e) => setForm((prev) => ({ ...prev, nombreDocumento: e.target.value }))}
                placeholder="Factura gasolina marzo"
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>PDF justificante</span>
              <input
                type="file"
                accept=".pdf"
                className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface file:mr-3 file:rounded-lg file:border-0 file:bg-surface-container-low file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                onChange={(e) => setForm((prev) => ({ ...prev, archivo: e.target.files?.[0] || null }))}
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface md:col-span-2">
              <span className={labelClassName}>Descripción documento</span>
              <textarea
                rows={2}
                className={textareaClassName}
                value={form.descripcionDocumento}
                onChange={(e) => setForm((prev) => ({ ...prev, descripcionDocumento: e.target.value }))}
                disabled={saving}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 p-6 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
          >
            Cerrar
          </Button>
          {form.id ? (
            <Button
              variant="outline"
              type="button"
              onClick={onReset}
              disabled={saving}
              className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
            >
              Limpiar edición
            </Button>
          ) : null}
          <Button
            variant="primary"
            type="button"
            loading={saving}
            onClick={onSubmit}
            className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 text-white shadow-lg shadow-primary/20 hover:brightness-110"
          >
            {form.id ? 'Actualizar gasto' : 'Guardar gasto'}
          </Button>
        </div>
      </div>
    </div>
  );
}

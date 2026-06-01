'use client';

import { Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import { Empleado } from '@/hooks/useEmpleados';
import { CuentaContable, MetodoPagoContable, MovimientoContable } from '@/shared/types';
import { accountLabel, paymentMethodLabel } from '@/lib/contabilidad';

export type IngresoFormState = {
  id: string | null;
  fechaOperacion: string;
  concepto: string;
  comentario: string;
  metodoPagoId: string;
  cuentaId: string;
  importeTotal: string;
  idEmpleado: string;
  esDevolucion: boolean;
  idMovimientoRelacionado: string;
};

interface IngresoModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  form: IngresoFormState;
  setForm: Dispatch<SetStateAction<IngresoFormState>>;
  movimientos: MovimientoContable[];
  metodosPago: MetodoPagoContable[];
  cuentas: CuentaContable[];
  empleados: Empleado[];
  empleadosLoading: boolean;
  saving: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export default function IngresoModalV2({
  isOpen,
  onClose,
  form,
  setForm,
  movimientos,
  metodosPago,
  cuentas,
  empleados,
  empleadosLoading,
  saving,
  onSubmit,
  onReset,
}: IngresoModalV2Props) {
  if (!isOpen) return null;

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const inputClassName =
    'h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const title = form.id ? 'Editar aportación / devolución' : 'Nueva aportación / devolución';
  const submitLabel = form.id
    ? 'Actualizar aportación'
    : form.esDevolucion
      ? 'Registrar devolución'
      : 'Guardar aportación';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90svh] w-full max-w-4xl overflow-y-auto rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest shadow-xl sm:rounded-2xl">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <span className={labelClassName}>Método</span>
              <select
                className={inputClassName}
                value={form.metodoPagoId}
                onChange={(e) => {
                  const metodoPagoId = e.target.value;
                  const metodo = metodosPago.find((item) => item.id === metodoPagoId);
                  setForm((prev) => ({
                    ...prev,
                    metodoPagoId,
                    cuentaId: metodo?.cuenta_liquidacion_id || prev.cuentaId,
                  }));
                }}
                disabled={saving}
              >
                <option value="">Selecciona una forma de pago</option>
                {metodosPago.map((metodo) => (
                  <option key={metodo.id} value={metodo.id}>
                    {paymentMethodLabel(metodo)}
                    {!metodo.activo ? ' · Inactivo' : ''}
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
                placeholder="Ej: Cobro reserva barranco"
                disabled={saving}
              />
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Importe total</span>
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
              <span className={labelClassName}>Cuenta afectada</span>
              <select
                className={inputClassName}
                value={form.cuentaId}
                onChange={(e) => setForm((prev) => ({ ...prev, cuentaId: e.target.value }))}
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
              <span className={labelClassName}>Empleado vinculado</span>
              <select
                className={inputClassName}
                value={form.idEmpleado}
                onChange={(e) => setForm((prev) => ({ ...prev, idEmpleado: e.target.value }))}
                disabled={empleadosLoading || saving}
              >
                <option value="">Sin empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre} {empleado.apellidos}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-on-surface">
              <span className={labelClassName}>Movimiento relacionado</span>
              <select
                className={inputClassName}
                value={form.idMovimientoRelacionado}
                onChange={(e) => setForm((prev) => ({ ...prev, idMovimientoRelacionado: e.target.value }))}
                disabled={saving}
              >
                <option value="">Sin relación</option>
                {movimientos
                  .filter((movimiento) => movimiento.estado === 'confirmado')
                  .slice(0, 50)
                  .map((movimiento) => (
                    <option key={movimiento.id} value={movimiento.id}>
                      {movimiento.fecha_operacion} · {movimiento.concepto}
                    </option>
                  ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-on-surface md:col-span-2">
              <input
                type="checkbox"
                checked={form.esDevolucion}
                onChange={(e) => setForm((prev) => ({ ...prev, esDevolucion: e.target.checked }))}
                disabled={saving}
              />
              Registrar como devolución / reembolso
            </label>

            <label className="text-sm text-on-surface md:col-span-2">
              <span className={labelClassName}>Justificación / comentario</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                value={form.comentario}
                onChange={(e) => setForm((prev) => ({ ...prev, comentario: e.target.value }))}
                disabled={saving}
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:flex-wrap sm:justify-end">
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
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import supabaseClient from '@/lib/supabaseClient';
import {
  CajaContable,
  DetalleGastoContable,
  Documento,
  MetodoContable,
  MovimientoContable,
  ResumenCaja,
  ResumenEfeDiario,
} from '@/shared/types';
import {
  accountingBoxByMethod,
  accountingVatPercent,
  buildResumenCajas,
  buildResumenEfeDiario,
  calculateTaxBreakdown,
  isManualMovement,
} from '@/lib/contabilidad';
import { useUserData } from './useUserData';
import { useDocumentos } from './useDocumentos';

interface MovimientoContableRow {
  id: string;
  fecha_operacion: string;
  tipo: MovimientoContable['tipo'];
  estado: MovimientoContable['estado'];
  caja: CajaContable;
  metodo?: MetodoContable | null;
  concepto: string;
  comentario?: string | null;
  importe_total: number | string;
  base_imponible: number | string;
  iva_pct: number | string;
  iva_importe: number | string;
  es_devolucion: boolean;
  origen_tipo?: string | null;
  origen_id?: string | null;
  id_pago?: string | null;
  id_empleado?: string | null;
  id_movimiento_relacionado?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CrearIngresoContableInput {
  fechaOperacion: string;
  concepto: string;
  comentario?: string;
  metodo: MetodoContable;
  caja?: CajaContable;
  importeTotal: number;
  idEmpleado?: string | null;
  esDevolucion?: boolean;
  idMovimientoRelacionado?: string | null;
}

export interface CrearGastoContableInput {
  fechaOperacion: string;
  caja: CajaContable;
  concepto: string;
  comentario?: string;
  detalle: DetalleGastoFormulario;
  archivo?: File | null;
  nombreDocumento?: string;
  descripcionDocumento?: string;
}

export interface CrearTraspasoContableInput {
  fechaOperacion: string;
  desde: CajaContable;
  hacia: CajaContable;
  importeTotal: number;
  comentario?: string;
}

export interface EditarMovimientoContableInput {
  id: string;
  fechaOperacion: string;
  concepto: string;
  comentario?: string;
  metodo?: MetodoContable | null;
  caja: CajaContable;
  importeTotal: number;
  idEmpleado?: string | null;
  esDevolucion?: boolean;
  idMovimientoRelacionado?: string | null;
}

export interface EditarGastoContableInput {
  id: string;
  fechaOperacion: string;
  caja: CajaContable;
  concepto: string;
  comentario?: string;
  detalle: DetalleGastoFormulario;
  archivo?: File | null;
  nombreDocumento?: string;
  descripcionDocumento?: string;
}

export interface DetalleGastoFormulario extends Omit<DetalleGastoContable, 'id_movimiento_contable'> {
  base_imponible: number;
  iva_pct: number;
}

const createLocalUuid = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const toNumber = (value: number | string | null | undefined) => Number(value || 0);

const mapMovimiento = (row: MovimientoContableRow): MovimientoContable => ({
  ...row,
  importe_total: toNumber(row.importe_total),
  base_imponible: toNumber(row.base_imponible),
  iva_pct: toNumber(row.iva_pct),
  iva_importe: toNumber(row.iva_importe),
  documentos: [],
  gasto: null,
  empleado: null,
});

export function useContabilidad() {
  const { usuario } = useUserData();
  const { subirDocumento } = useDocumentos();
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateMovimientos = useCallback(async (rows: MovimientoContableRow[]) => {
    if (!rows.length) {
      setMovimientos([]);
      return;
    }

    const movimientosBase = rows.map(mapMovimiento);
    const movimientoIds = movimientosBase.map((movimiento) => movimiento.id);
    const empleadoIds = Array.from(
      new Set(
        movimientosBase
          .map((movimiento) => movimiento.id_empleado)
          .filter((value): value is string => Boolean(value))
      )
    );

    const [gastoResult, documentoResult, empleadoResult] = await Promise.all([
      supabaseClient
        .from('movimiento_contable_gasto')
        .select('*')
        .in('id_movimiento_contable', movimientoIds),
      supabaseClient
        .from('documento')
        .select('*')
        .in('id_movimiento_contable', movimientoIds),
      empleadoIds.length
        ? supabaseClient
            .from('empleado')
            .select('id, nombre, apellidos, email, movil')
            .in('id', empleadoIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (gastoResult.error) {
      throw new Error(gastoResult.error.message);
    }

    if (documentoResult.error) {
      throw new Error(documentoResult.error.message);
    }

    if (empleadoResult.error) {
      throw new Error(empleadoResult.error.message);
    }

    const gastoMap = new Map(
      (gastoResult.data || []).map((gasto) => [gasto.id_movimiento_contable, gasto as DetalleGastoContable])
    );
    const documentosMap = new Map<string, Documento[]>();

    for (const documento of (documentoResult.data || []) as Documento[]) {
      const key = documento.id_movimiento_contable;
      if (!key) continue;
      const current = documentosMap.get(key) || [];
      current.push(documento);
      documentosMap.set(key, current);
    }

    const empleadoMap = new Map(
      ((empleadoResult.data || []) as MovimientoContable['empleado'][]).map((empleado) => [empleado?.id, empleado])
    );

    setMovimientos(
      movimientosBase.map((movimiento) => ({
        ...movimiento,
        gasto: gastoMap.get(movimiento.id) || null,
        documentos: documentosMap.get(movimiento.id) || [],
        empleado: movimiento.id_empleado ? empleadoMap.get(movimiento.id_empleado) || null : null,
      }))
    );
  }, []);

  const refreshContabilidad = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseClient
        .from('movimiento_contable')
        .select('*')
        .order('fecha_operacion', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      await hydrateMovimientos((data || []) as MovimientoContableRow[]);
    } catch (err) {
      console.error('Error cargando contabilidad:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la contabilidad');
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, [hydrateMovimientos]);

  useEffect(() => {
    if (!usuario) {
      setLoading(false);
      return;
    }

    refreshContabilidad();
  }, [usuario, refreshContabilidad]);

  const attachDocumentoToMovimiento = useCallback(
    async ({
      movimientoId,
      archivo,
      nombreDocumento,
      descripcionDocumento,
      categoria,
    }: {
      movimientoId: string;
      archivo?: File | null;
      nombreDocumento?: string;
      descripcionDocumento?: string;
      categoria: Documento['categoria'];
    }) => {
      if (!archivo) return { success: true as const };

      const uploadResult = await subirDocumento({
        nombre: nombreDocumento || archivo.name.replace(/\.pdf$/i, ''),
        descripcion: descripcionDocumento,
        archivo,
        categoria,
        idMovimientoContable: movimientoId,
      });

      if (!uploadResult.success) {
        return {
          success: false as const,
          error: uploadResult.error || 'No se pudo asociar el documento al movimiento',
        };
      }

      return { success: true as const, data: uploadResult.data };
    },
    [subirDocumento]
  );

  const createMovimientoBase = useCallback(
    async (payload: Partial<MovimientoContable> & Record<string, unknown>) => {
      const { data, error: insertError } = await supabaseClient
        .from('movimiento_contable')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return data as MovimientoContableRow;
    },
    []
  );

  const createIngresoManual = useCallback(
    async (input: CrearIngresoContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const importeTotal = Math.abs(input.importeTotal) * (input.esDevolucion ? -1 : 1);
        const ivaPct = accountingVatPercent(input.metodo);
        const breakdown = calculateTaxBreakdown(importeTotal, ivaPct);

        await createMovimientoBase({
          fecha_operacion: input.fechaOperacion,
          tipo: 'ingreso',
          estado: 'confirmado',
          caja: input.caja || accountingBoxByMethod(input.metodo),
          metodo: input.metodo,
          concepto: input.concepto.trim(),
          comentario: input.comentario?.trim() || null,
          importe_total: importeTotal,
          base_imponible: breakdown.baseImponible,
          iva_pct: ivaPct,
          iva_importe: breakdown.ivaImporte,
          es_devolucion: Boolean(input.esDevolucion),
          origen_tipo: input.esDevolucion ? 'devolucion_manual' : 'manual',
          origen_id: null,
          id_pago: null,
          id_empleado: input.idEmpleado || null,
          id_movimiento_relacionado: input.idMovimientoRelacionado || null,
          created_by: usuario?.id || null,
        });

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        console.error('Error creando ingreso manual:', err);
        const message = err instanceof Error ? err.message : 'Error al crear el ingreso';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [createMovimientoBase, refreshContabilidad, usuario]
  );

  const createDevolucion = useCallback(
    async (input: CrearIngresoContableInput) =>
      createIngresoManual({
        ...input,
        esDevolucion: true,
      }),
    [createIngresoManual]
  );

  const createGasto = useCallback(
    async (input: CrearGastoContableInput) => {
      let movimientoCreado: MovimientoContableRow | null = null;

      try {
        setSaving(true);
        setError(null);

        const ivaPct = Number(input.detalle.iva_pct || 0);
        const importeTotal = Number(
          (input.detalle.base_imponible + (input.detalle.base_imponible * ivaPct) / 100).toFixed(2)
        );
        const ivaImporte = Number((importeTotal - input.detalle.base_imponible).toFixed(2));

        movimientoCreado = await createMovimientoBase({
          fecha_operacion: input.fechaOperacion,
          tipo: 'gasto',
          estado: 'confirmado',
          caja: input.caja,
          metodo: null,
          concepto: input.concepto.trim(),
          comentario: input.comentario?.trim() || null,
          importe_total: importeTotal,
          base_imponible: input.detalle.base_imponible,
          iva_pct: ivaPct,
          iva_importe: ivaImporte,
          es_devolucion: false,
          origen_tipo: 'manual',
          origen_id: null,
          id_pago: null,
          id_empleado: null,
          id_movimiento_relacionado: null,
          created_by: usuario?.id || null,
        });

        const { error: gastoError } = await supabaseClient
          .from('movimiento_contable_gasto')
          .insert({
            id_movimiento_contable: movimientoCreado.id,
            tipo_gasto: input.detalle.tipo_gasto,
            deducible: input.detalle.deducible,
            descripcion: input.detalle.descripcion,
            proveedor: input.detalle.proveedor,
            num_factura: input.detalle.num_factura || null,
            fecha_factura: input.detalle.fecha_factura,
            comentario: input.detalle.comentario || null,
          });

        if (gastoError) {
          throw new Error(gastoError.message);
        }

        const documentoResult = await attachDocumentoToMovimiento({
          movimientoId: movimientoCreado.id,
          archivo: input.archivo,
          nombreDocumento: input.nombreDocumento,
          descripcionDocumento: input.descripcionDocumento,
          categoria: 'contabilidad_factura',
        });

        if (!documentoResult.success) {
          throw new Error(documentoResult.error);
        }

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        console.error('Error creando gasto:', err);

        if (movimientoCreado?.id) {
          await supabaseClient.from('movimiento_contable').delete().eq('id', movimientoCreado.id);
        }

        const message = err instanceof Error ? err.message : 'Error al crear el gasto';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [attachDocumentoToMovimiento, createMovimientoBase, refreshContabilidad, usuario]
  );

  const createTraspaso = useCallback(
    async (input: CrearTraspasoContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const salidaId = createLocalUuid();
        const entradaId = createLocalUuid();
        const importe = Math.abs(input.importeTotal);

        const { error: insertError } = await supabaseClient.from('movimiento_contable').insert([
          {
            id: salidaId,
            fecha_operacion: input.fechaOperacion,
            tipo: 'traspaso_salida',
            estado: 'confirmado',
            caja: input.desde,
            concepto: `Traspaso a ${input.hacia}`,
            comentario: input.comentario?.trim() || null,
            importe_total: importe,
            base_imponible: 0,
            iva_pct: 0,
            iva_importe: 0,
            es_devolucion: false,
            origen_tipo: 'traspaso',
            origen_id: null,
            id_pago: null,
            id_empleado: null,
            id_movimiento_relacionado: entradaId,
            created_by: usuario?.id || null,
          },
          {
            id: entradaId,
            fecha_operacion: input.fechaOperacion,
            tipo: 'traspaso_entrada',
            estado: 'confirmado',
            caja: input.hacia,
            concepto: `Traspaso desde ${input.desde}`,
            comentario: input.comentario?.trim() || null,
            importe_total: importe,
            base_imponible: 0,
            iva_pct: 0,
            iva_importe: 0,
            es_devolucion: false,
            origen_tipo: 'traspaso',
            origen_id: null,
            id_pago: null,
            id_empleado: null,
            id_movimiento_relacionado: salidaId,
            created_by: usuario?.id || null,
          },
        ]);

        if (insertError) {
          throw new Error(insertError.message);
        }

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        console.error('Error creando traspaso:', err);
        const message = err instanceof Error ? err.message : 'Error al crear el traspaso';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad, usuario]
  );

  const editarMovimientoManual = useCallback(
    async (input: EditarMovimientoContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const movimientoActual = movimientos.find((movimiento) => movimiento.id === input.id);
        if (!movimientoActual || !isManualMovement(movimientoActual)) {
          throw new Error('Solo se pueden editar movimientos manuales');
        }

        const metodo = input.metodo || null;
        const ivaPct = metodo ? accountingVatPercent(metodo) : 0;
        const importeTotal = Math.abs(input.importeTotal) * (input.esDevolucion ? -1 : 1);
        const breakdown = calculateTaxBreakdown(importeTotal, ivaPct);

        const { error: updateError } = await supabaseClient
          .from('movimiento_contable')
          .update({
            fecha_operacion: input.fechaOperacion,
            concepto: input.concepto.trim(),
            comentario: input.comentario?.trim() || null,
            caja: input.caja,
            metodo,
            importe_total: importeTotal,
            base_imponible: breakdown.baseImponible,
            iva_pct: ivaPct,
            iva_importe: breakdown.ivaImporte,
            es_devolucion: Boolean(input.esDevolucion),
            id_empleado: input.idEmpleado || null,
            id_movimiento_relacionado: input.idMovimientoRelacionado || null,
          })
          .eq('id', input.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        console.error('Error editando movimiento manual:', err);
        const message = err instanceof Error ? err.message : 'Error al editar el movimiento';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [movimientos, refreshContabilidad]
  );

  const editarGastoManual = useCallback(
    async (input: EditarGastoContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const movimientoActual = movimientos.find((movimiento) => movimiento.id === input.id);
        if (!movimientoActual || !isManualMovement(movimientoActual)) {
          throw new Error('Solo se pueden editar movimientos manuales');
        }

        const ivaPct = Number(input.detalle.iva_pct || 0);
        const importeTotal = Number(
          (input.detalle.base_imponible + (input.detalle.base_imponible * ivaPct) / 100).toFixed(2)
        );
        const ivaImporte = Number((importeTotal - input.detalle.base_imponible).toFixed(2));

        const { error: movimientoError } = await supabaseClient
          .from('movimiento_contable')
          .update({
            fecha_operacion: input.fechaOperacion,
            caja: input.caja,
            concepto: input.concepto.trim(),
            comentario: input.comentario?.trim() || null,
            importe_total: importeTotal,
            base_imponible: input.detalle.base_imponible,
            iva_pct: ivaPct,
            iva_importe: ivaImporte,
          })
          .eq('id', input.id);

        if (movimientoError) {
          throw new Error(movimientoError.message);
        }

        const { error: gastoError } = await supabaseClient
          .from('movimiento_contable_gasto')
          .upsert({
            id_movimiento_contable: input.id,
            tipo_gasto: input.detalle.tipo_gasto,
            deducible: input.detalle.deducible,
            descripcion: input.detalle.descripcion,
            proveedor: input.detalle.proveedor,
            num_factura: input.detalle.num_factura || null,
            fecha_factura: input.detalle.fecha_factura,
            comentario: input.detalle.comentario || null,
          });

        if (gastoError) {
          throw new Error(gastoError.message);
        }

        if (input.archivo) {
          const documentoResult = await attachDocumentoToMovimiento({
            movimientoId: input.id,
            archivo: input.archivo,
            nombreDocumento: input.nombreDocumento,
            descripcionDocumento: input.descripcionDocumento,
            categoria: 'contabilidad_factura',
          });

          if (!documentoResult.success) {
            throw new Error(documentoResult.error);
          }
        }

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        console.error('Error editando gasto manual:', err);
        const message = err instanceof Error ? err.message : 'Error al editar el gasto';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [attachDocumentoToMovimiento, movimientos, refreshContabilidad]
  );

  const editarTraspasoManual = useCallback(
    async (input: { id: string; fechaOperacion: string; desde: CajaContable; hacia: CajaContable; importeTotal: number; comentario?: string }) => {
      try {
        setSaving(true);
        setError(null);

        const movimientoActual = movimientos.find((movimiento) => movimiento.id === input.id);
        const relacionado = movimientos.find(
          (movimiento) => movimiento.id === movimientoActual?.id_movimiento_relacionado
        );

        if (
          !movimientoActual ||
          !relacionado ||
          !isManualMovement(movimientoActual) ||
          !isManualMovement(relacionado)
        ) {
          throw new Error('No se pudo encontrar el traspaso manual a editar');
        }

        const importe = Math.abs(input.importeTotal);
        const salidaId = movimientoActual.tipo === 'traspaso_salida' ? movimientoActual.id : relacionado.id;
        const entradaId = movimientoActual.tipo === 'traspaso_entrada' ? movimientoActual.id : relacionado.id;

        const { error: updateError } = await supabaseClient.from('movimiento_contable').upsert([
          {
            id: salidaId,
            fecha_operacion: input.fechaOperacion,
            caja: input.desde,
            concepto: `Traspaso a ${input.hacia}`,
            comentario: input.comentario?.trim() || null,
            importe_total: importe,
            tipo: 'traspaso_salida',
            estado: 'confirmado',
            base_imponible: 0,
            iva_pct: 0,
            iva_importe: 0,
            es_devolucion: false,
            origen_tipo: 'traspaso',
            id_movimiento_relacionado: entradaId,
          },
          {
            id: entradaId,
            fecha_operacion: input.fechaOperacion,
            caja: input.hacia,
            concepto: `Traspaso desde ${input.desde}`,
            comentario: input.comentario?.trim() || null,
            importe_total: importe,
            tipo: 'traspaso_entrada',
            estado: 'confirmado',
            base_imponible: 0,
            iva_pct: 0,
            iva_importe: 0,
            es_devolucion: false,
            origen_tipo: 'traspaso',
            id_movimiento_relacionado: salidaId,
          },
        ]);

        if (updateError) {
          throw new Error(updateError.message);
        }

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        console.error('Error editando traspaso:', err);
        const message = err instanceof Error ? err.message : 'Error al editar el traspaso';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [movimientos, refreshContabilidad]
  );

  const anularMovimientoManual = useCallback(
    async (id: string, motivo?: string) => {
      try {
        setSaving(true);
        setError(null);

        const movimientoActual = movimientos.find((movimiento) => movimiento.id === id);
        if (!movimientoActual || !isManualMovement(movimientoActual)) {
          throw new Error('Solo se pueden anular movimientos manuales');
        }

        const ids = [id];
        if (movimientoActual.id_movimiento_relacionado) {
          ids.push(movimientoActual.id_movimiento_relacionado);
        }

        const comentario = motivo?.trim()
          ? `${movimientoActual.comentario ? `${movimientoActual.comentario}\n` : ''}Anulado: ${motivo.trim()}`
          : movimientoActual.comentario || null;

        const { error: updateError } = await supabaseClient
          .from('movimiento_contable')
          .update({
            estado: 'anulado',
            comentario,
          })
          .in('id', ids);

        if (updateError) {
          throw new Error(updateError.message);
        }

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        console.error('Error anulando movimiento manual:', err);
        const message = err instanceof Error ? err.message : 'Error al anular el movimiento';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [movimientos, refreshContabilidad]
  );

  const getResumenCajas = useCallback(
    (sourceMovimientos = movimientos): ResumenCaja[] => buildResumenCajas(sourceMovimientos),
    [movimientos]
  );

  const getResumenEfeDiario = useCallback(
    (fecha: string, sourceMovimientos = movimientos): ResumenEfeDiario =>
      buildResumenEfeDiario(sourceMovimientos, fecha),
    [movimientos]
  );

  return {
    movimientos,
    loading,
    saving,
    error,
    refreshContabilidad,
    createIngresoManual,
    createGasto,
    createDevolucion,
    createTraspaso,
    editarMovimientoManual,
    editarGastoManual,
    editarTraspasoManual,
    anularMovimientoManual,
    getResumenCajas,
    getResumenEfeDiario,
  };
}

export default useContabilidad;

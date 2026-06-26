import { useCallback, useEffect, useState } from 'react';
import supabaseClient from '@/lib/supabaseClient';
import {
  BancoContable,
  CuentaContable,
  DetalleGastoContable,
  Documento,
  MetodoContable,
  MetodoPagoContable,
  MovimientoContable,
  ResumenCuentaContable,
  ResumenEfeDiario,
  SaldoInicialContable,
} from '@/shared/types';
import {
  buildResumenCuentas,
  buildResumenEfeDiario,
  calculateTaxBreakdown,
  createEmptyGastoDetail,
  findAccountByCode,
  findMethodByCode,
  isManualMovement,
  sortAccounts,
  sortBanks,
  sortPaymentMethods,
} from '@/lib/contabilidad';
import { useUserData } from './useUserData';
import { useDocumentos } from './useDocumentos';

interface MovimientoContableRow {
  id: string;
  fecha_operacion: string;
  tipo: MovimientoContable['tipo'];
  estado: MovimientoContable['estado'];
  caja: MovimientoContable['caja'];
  cuenta_id?: string | null;
  metodo?: MetodoContable | null;
  metodo_pago_id?: string | null;
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

type BancoContableRow = BancoContable;

type CuentaContableRow = Omit<CuentaContable, 'banco'>;

type MetodoPagoContableRow = Omit<MetodoPagoContable, 'cuenta_liquidacion'>;

interface PendingBizumRow {
  id: string;
  concepto: string;
  importe: number | string;
  estado: 'pendiente' | 'completado' | 'cancelado';
  metodo_pago_id?: string | null;
  created_at: string;
  cliente?:
    | {
        id: string;
        nombre: string;
        apellidos: string;
      }
    | {
        id: string;
        nombre: string;
        apellidos: string;
      }[]
    | null;
}

export interface PendingBizum {
  id: string;
  concepto: string;
  importe: number;
  estado: 'pendiente' | 'completado' | 'cancelado';
  metodo_pago_id?: string | null;
  created_at: string;
  cliente?: {
    id: string;
    nombre: string;
    apellidos: string;
  } | null;
}

export interface CrearIngresoContableInput {
  fechaOperacion: string;
  concepto: string;
  comentario?: string;
  metodoPagoId: string;
  cuentaId?: string | null;
  importeTotal: number;
  idEmpleado?: string | null;
  esDevolucion?: boolean;
  idMovimientoRelacionado?: string | null;
}

export interface CrearGastoContableInput {
  fechaOperacion: string;
  cuentaId: string;
  metodoPagoId: string;
  concepto: string;
  comentario?: string;
  detalle: DetalleGastoFormulario;
  archivo?: File | null;
  nombreDocumento?: string;
  descripcionDocumento?: string;
}

export interface CrearTraspasoContableInput {
  fechaOperacion: string;
  desdeCuentaId: string;
  haciaCuentaId: string;
  importeTotal: number;
  comentario?: string;
}

export interface EditarMovimientoContableInput {
  id: string;
  fechaOperacion: string;
  concepto: string;
  comentario?: string;
  metodoPagoId: string;
  cuentaId: string;
  importeTotal: number;
  idEmpleado?: string | null;
  esDevolucion?: boolean;
  idMovimientoRelacionado?: string | null;
}

export interface EditarGastoContableInput {
  id: string;
  fechaOperacion: string;
  cuentaId: string;
  metodoPagoId: string;
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

export interface GuardarBancoContableInput {
  id?: string | null;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface GuardarCuentaContableInput {
  id?: string | null;
  codigo: string;
  nombre: string;
  tipo: CuentaContable['tipo'];
  banco_id?: string | null;
  activo: boolean;
  visible_efe: boolean;
  orden: number;
}

export interface GuardarMetodoPagoContableInput {
  id?: string | null;
  codigo: string;
  nombre: string;
  clase: MetodoPagoContable['clase'];
  cuenta_liquidacion_id?: string | null;
  activo: boolean;
  permite_pendiente: boolean;
  orden: number;
}

const createLocalUuid = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const toNumber = (value: number | string | null | undefined) => Number(value || 0);

const mapMovimiento = (row: MovimientoContableRow): MovimientoContable => ({
  ...row,
  cuenta_id: row.cuenta_id || null,
  metodo_pago_id: row.metodo_pago_id || null,
  importe_total: toNumber(row.importe_total),
  base_imponible: toNumber(row.base_imponible),
  iva_pct: toNumber(row.iva_pct),
  iva_importe: toNumber(row.iva_importe),
  documentos: [],
  gasto: null,
  empleado: null,
  cuenta: null,
  metodo_pago: null,
});

const normalizeCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

export function useContabilidad() {
  const { usuario, loading: usuarioLoading } = useUserData();
  const { subirDocumento } = useDocumentos();
  const role = usuario?.rol as 'admin' | 'fl-admin' | 'fl-empleado' | undefined;
  const canReadAccountingDetails = role === 'admin' || role === 'fl-admin';
  const [movimientos, setMovimientos] = useState<MovimientoContable[]>([]);
  const [bancos, setBancos] = useState<BancoContable[]>([]);
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoContable[]>([]);
  const [saldosIniciales, setSaldosIniciales] = useState<SaldoInicialContable[]>([]);
  const [pendingBizums, setPendingBizums] = useState<PendingBizum[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateCatalogos = useCallback(
    (
      bancosRows: BancoContableRow[],
      cuentasRows: CuentaContableRow[],
      metodosRows: MetodoPagoContableRow[],
      saldosRows: SaldoInicialContable[]
    ) => {
      const bancosOrdenados = sortBanks(bancosRows);
      const bancoMap = new Map(bancosOrdenados.map((banco) => [banco.id, banco]));
      const cuentasHidratadas = sortAccounts(
        cuentasRows.map((cuenta) => ({
          ...cuenta,
          banco: cuenta.banco_id ? bancoMap.get(cuenta.banco_id) || null : null,
        }))
      );
      const cuentaMap = new Map(cuentasHidratadas.map((cuenta) => [cuenta.id, cuenta]));
      const metodosHidratados = sortPaymentMethods(
        metodosRows.map((metodo) => ({
          ...metodo,
          cuenta_liquidacion: metodo.cuenta_liquidacion_id
            ? cuentaMap.get(metodo.cuenta_liquidacion_id) || null
            : null,
        }))
      );
      const saldosHidratados = saldosRows.map((saldo) => ({
        ...saldo,
        saldo_inicial: toNumber(saldo.saldo_inicial),
        cuenta: cuentaMap.get(saldo.cuenta_id) || null,
      }));

      setBancos(bancosOrdenados);
      setCuentas(cuentasHidratadas);
      setMetodosPago(metodosHidratados);
      setSaldosIniciales(saldosHidratados);

      return {
        bancos: bancosOrdenados,
        cuentas: cuentasHidratadas,
        metodosPago: metodosHidratados,
        saldosIniciales: saldosHidratados,
      };
    },
    []
  );

  const hydrateMovimientos = useCallback(
    async (
      rows: MovimientoContableRow[],
      cuentasSource: CuentaContable[],
      metodosSource: MetodoPagoContable[]
    ) => {
      if (!rows.length) {
        setMovimientos([]);
        return [];
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
        canReadAccountingDetails
          ? supabaseClient
              .from('movimiento_contable_gasto')
              .select('*')
              .in('id_movimiento_contable', movimientoIds)
          : Promise.resolve({ data: [], error: null }),
        supabaseClient.from('documento').select('*').in('id_movimiento_contable', movimientoIds),
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
        (gastoResult.data || []).map((gasto) => [
          gasto.id_movimiento_contable,
          {
            ...(gasto as DetalleGastoContable),
            deducible: Boolean(gasto.deducible),
          },
        ])
      );
      const documentosMap = new Map<string, Documento[]>();
      const cuentaMap = new Map(cuentasSource.map((cuenta) => [cuenta.id, cuenta]));
      const metodoMap = new Map(metodosSource.map((metodo) => [metodo.id, metodo]));

      for (const documento of (documentoResult.data || []) as Documento[]) {
        const key = documento.id_movimiento_contable;
        if (!key) continue;
        const current = documentosMap.get(key) || [];
        current.push(documento);
        documentosMap.set(key, current);
      }

      const empleadoMap = new Map(
        ((empleadoResult.data || []) as MovimientoContable['empleado'][]).map((empleado) => [
          empleado?.id,
          empleado,
        ])
      );

      const hidratados = movimientosBase.map((movimiento) => ({
        ...movimiento,
        gasto: gastoMap.get(movimiento.id) || null,
        documentos: documentosMap.get(movimiento.id) || [],
        empleado: movimiento.id_empleado
          ? empleadoMap.get(movimiento.id_empleado) || null
          : null,
        cuenta: movimiento.cuenta_id ? cuentaMap.get(movimiento.cuenta_id) || null : null,
        metodo_pago: movimiento.metodo_pago_id
          ? metodoMap.get(movimiento.metodo_pago_id) || null
          : null,
      }));

      setMovimientos(hidratados);
      return hidratados;
    },
    [canReadAccountingDetails]
  );

  const resolveMethodDefaultAccountId = useCallback(
    (methodId?: string | null, methodsSource = metodosPago) =>
      methodsSource.find((method) => method.id === methodId)?.cuenta_liquidacion_id || null,
    [metodosPago]
  );

  const refreshContabilidad = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [bancosResult, cuentasResult, metodosResult, saldosResult, movimientosResult] =
        await Promise.all([
          supabaseClient.from('contabilidad_banco').select('*').order('orden', { ascending: true }),
          supabaseClient
            .from('contabilidad_cuenta')
            .select('*')
            .order('orden', { ascending: true }),
          supabaseClient
            .from('contabilidad_metodo_pago')
            .select('*')
            .order('orden', { ascending: true }),
          canReadAccountingDetails
            ? supabaseClient
                .from('contabilidad_saldo_inicial_diario')
                .select('*')
                .order('fecha', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          supabaseClient
            .from('movimiento_contable')
            .select('*')
            .order('fecha_operacion', { ascending: false })
            .order('created_at', { ascending: false }),
        ]);

      if (bancosResult.error) throw new Error(bancosResult.error.message);
      if (cuentasResult.error) throw new Error(cuentasResult.error.message);
      if (metodosResult.error) throw new Error(metodosResult.error.message);
      if (saldosResult.error) throw new Error(saldosResult.error.message);
      if (movimientosResult.error) throw new Error(movimientosResult.error.message);

      const catalogos = hydrateCatalogos(
        (bancosResult.data || []) as BancoContableRow[],
        (cuentasResult.data || []) as CuentaContableRow[],
        (metodosResult.data || []) as MetodoPagoContableRow[],
        (saldosResult.data || []) as SaldoInicialContable[]
      );

      await hydrateMovimientos(
        (movimientosResult.data || []) as MovimientoContableRow[],
        catalogos.cuentas,
        catalogos.metodosPago
      );

      const metodoBizumAlfonso = findMethodByCode(catalogos.metodosPago, 'bizum_alfonso');
      if (metodoBizumAlfonso) {
        const { data: bizumData, error: bizumError } = await supabaseClient
          .from('pago')
          .select(
            `
            id,
            concepto,
            importe,
            estado,
            metodo_pago_id,
            created_at,
            cliente:cliente(id, nombre, apellidos)
          `
          )
          .eq('metodo_pago_id', metodoBizumAlfonso.id)
          .eq('estado', 'pendiente')
          .order('created_at', { ascending: false });

        if (bizumError) {
          throw new Error(bizumError.message);
        }

        setPendingBizums(
          ((bizumData || []) as PendingBizumRow[]).map((item) => ({
            ...item,
            importe: toNumber(item.importe),
            cliente: Array.isArray(item.cliente) ? item.cliente[0] || null : item.cliente || null,
          }))
        );
      } else {
        setPendingBizums([]);
      }
    } catch (err) {
      console.error('Error cargando contabilidad:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la contabilidad');
      setMovimientos([]);
      setBancos([]);
      setCuentas([]);
      setMetodosPago([]);
      setSaldosIniciales([]);
      setPendingBizums([]);
    } finally {
      setLoading(false);
    }
  }, [canReadAccountingDetails, hydrateCatalogos, hydrateMovimientos]);

  useEffect(() => {
    if (usuarioLoading || !usuario) {
      return;
    }

    void refreshContabilidad();
  }, [refreshContabilidad, usuario, usuarioLoading]);

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

  const guardarBanco = useCallback(
    async (input: GuardarBancoContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const payload = {
          codigo: normalizeCode(input.codigo),
          nombre: input.nombre.trim(),
          activo: input.activo,
          orden: Number(input.orden || 0),
        };

        const query = input.id
          ? supabaseClient.from('contabilidad_banco').update(payload).eq('id', input.id)
          : supabaseClient.from('contabilidad_banco').insert(payload);

        const { error: saveError } = await query;
        if (saveError) throw new Error(saveError.message);

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar el banco';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const toggleBancoActivo = useCallback(
    async (id: string, activo: boolean) => {
      try {
        setSaving(true);
        setError(null);
        const { error: updateError } = await supabaseClient
          .from('contabilidad_banco')
          .update({ activo })
          .eq('id', id);

        if (updateError) throw new Error(updateError.message);
        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar el banco';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const guardarCuenta = useCallback(
    async (input: GuardarCuentaContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const payload = {
          codigo: normalizeCode(input.codigo),
          nombre: input.nombre.trim(),
          tipo: input.tipo,
          banco_id: input.tipo === 'banco' ? input.banco_id || null : null,
          activo: input.activo,
          visible_efe: input.visible_efe,
          orden: Number(input.orden || 0),
        };

        const query = input.id
          ? supabaseClient.from('contabilidad_cuenta').update(payload).eq('id', input.id)
          : supabaseClient.from('contabilidad_cuenta').insert(payload);

        const { error: saveError } = await query;
        if (saveError) throw new Error(saveError.message);

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar la cuenta';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const toggleCuentaActiva = useCallback(
    async (id: string, activo: boolean) => {
      try {
        setSaving(true);
        setError(null);
        const { error: updateError } = await supabaseClient
          .from('contabilidad_cuenta')
          .update({ activo })
          .eq('id', id);

        if (updateError) throw new Error(updateError.message);
        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar la cuenta';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const guardarMetodoPago = useCallback(
    async (input: GuardarMetodoPagoContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const payload = {
          codigo: normalizeCode(input.codigo),
          nombre: input.nombre.trim(),
          clase: input.clase,
          cuenta_liquidacion_id: input.cuenta_liquidacion_id || null,
          activo: input.activo,
          permite_pendiente: input.permite_pendiente,
          orden: Number(input.orden || 0),
        };

        const query = input.id
          ? supabaseClient.from('contabilidad_metodo_pago').update(payload).eq('id', input.id)
          : supabaseClient.from('contabilidad_metodo_pago').insert(payload);

        const { error: saveError } = await query;
        if (saveError) throw new Error(saveError.message);

        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar el método de pago';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const toggleMetodoPagoActivo = useCallback(
    async (id: string, activo: boolean) => {
      try {
        setSaving(true);
        setError(null);
        const { error: updateError } = await supabaseClient
          .from('contabilidad_metodo_pago')
          .update({ activo })
          .eq('id', id);

        if (updateError) throw new Error(updateError.message);
        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar el método';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const guardarSaldoInicialDiario = useCallback(
    async (input: {
      fecha: string;
      cuentaId: string;
      saldoInicial: number;
      comentario?: string;
    }) => {
      try {
        setSaving(true);
        setError(null);

        const { error: upsertError } = await supabaseClient
          .from('contabilidad_saldo_inicial_diario')
          .upsert({
            fecha: input.fecha,
            cuenta_id: input.cuentaId,
            saldo_inicial: input.saldoInicial,
            comentario: input.comentario?.trim() || null,
            updated_by: usuario?.id || null,
          });

        if (upsertError) throw new Error(upsertError.message);
        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar el saldo inicial';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad, usuario]
  );

  const createIngresoManual = useCallback(
    async (input: CrearIngresoContableInput) => {
      try {
        setSaving(true);
        setError(null);

        const importeTotal = Math.abs(input.importeTotal) * (input.esDevolucion ? -1 : 1);
        const ivaPct = input.metodoPagoId
          ? metodosPago.find((method) => method.id === input.metodoPagoId)?.clase === 'efectivo'
            ? 0
            : 21
          : 0;
        const breakdown = calculateTaxBreakdown(importeTotal, ivaPct);
        const cuentaId = input.cuentaId || resolveMethodDefaultAccountId(input.metodoPagoId);

        await createMovimientoBase({
          fecha_operacion: input.fechaOperacion,
          tipo: 'ingreso',
          estado: 'confirmado',
          cuenta_id: cuentaId,
          metodo_pago_id: input.metodoPagoId,
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
    [createMovimientoBase, metodosPago, refreshContabilidad, resolveMethodDefaultAccountId, usuario]
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
          (
            input.detalle.base_imponible +
            (input.detalle.base_imponible * ivaPct) / 100
          ).toFixed(2)
        );
        const ivaImporte = Number((importeTotal - input.detalle.base_imponible).toFixed(2));

        movimientoCreado = await createMovimientoBase({
          fecha_operacion: input.fechaOperacion,
          tipo: 'gasto',
          estado: 'confirmado',
          cuenta_id: input.cuentaId,
          metodo_pago_id: input.metodoPagoId,
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
        const cuentaDesde = cuentas.find((cuenta) => cuenta.id === input.desdeCuentaId);
        const cuentaHacia = cuentas.find((cuenta) => cuenta.id === input.haciaCuentaId);

        const { error: insertError } = await supabaseClient.from('movimiento_contable').insert([
          {
            id: salidaId,
            fecha_operacion: input.fechaOperacion,
            tipo: 'traspaso_salida',
            estado: 'confirmado',
            cuenta_id: input.desdeCuentaId,
            concepto: `Traspaso a ${cuentaHacia?.nombre || 'cuenta destino'}`,
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
            cuenta_id: input.haciaCuentaId,
            concepto: `Traspaso desde ${cuentaDesde?.nombre || 'cuenta origen'}`,
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
    [cuentas, refreshContabilidad, usuario]
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

        const metodo = metodosPago.find((item) => item.id === input.metodoPagoId) || null;
        const ivaPct = metodo?.clase === 'efectivo' ? 0 : 21;
        const importeTotal = Math.abs(input.importeTotal) * (input.esDevolucion ? -1 : 1);
        const breakdown = calculateTaxBreakdown(importeTotal, ivaPct);

        const { error: updateError } = await supabaseClient
          .from('movimiento_contable')
          .update({
            fecha_operacion: input.fechaOperacion,
            concepto: input.concepto.trim(),
            comentario: input.comentario?.trim() || null,
            cuenta_id: input.cuentaId,
            metodo_pago_id: input.metodoPagoId,
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
    [metodosPago, movimientos, refreshContabilidad]
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
          (
            input.detalle.base_imponible +
            (input.detalle.base_imponible * ivaPct) / 100
          ).toFixed(2)
        );
        const ivaImporte = Number((importeTotal - input.detalle.base_imponible).toFixed(2));

        const { error: movimientoError } = await supabaseClient
          .from('movimiento_contable')
          .update({
            fecha_operacion: input.fechaOperacion,
            cuenta_id: input.cuentaId,
            metodo_pago_id: input.metodoPagoId,
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
    async (input: {
      id: string;
      fechaOperacion: string;
      desdeCuentaId: string;
      haciaCuentaId: string;
      importeTotal: number;
      comentario?: string;
    }) => {
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
        const salidaId =
          movimientoActual.tipo === 'traspaso_salida' ? movimientoActual.id : relacionado.id;
        const entradaId =
          movimientoActual.tipo === 'traspaso_entrada' ? movimientoActual.id : relacionado.id;
        const cuentaDesde = cuentas.find((cuenta) => cuenta.id === input.desdeCuentaId);
        const cuentaHacia = cuentas.find((cuenta) => cuenta.id === input.haciaCuentaId);

        const { error: updateError } = await supabaseClient.from('movimiento_contable').upsert([
          {
            id: salidaId,
            fecha_operacion: input.fechaOperacion,
            cuenta_id: input.desdeCuentaId,
            concepto: `Traspaso a ${cuentaHacia?.nombre || 'cuenta destino'}`,
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
            cuenta_id: input.haciaCuentaId,
            concepto: `Traspaso desde ${cuentaDesde?.nombre || 'cuenta origen'}`,
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
    [cuentas, movimientos, refreshContabilidad]
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

  const completarBizumPendiente = useCallback(
    async (pagoId: string) => {
      try {
        setSaving(true);
        setError(null);
        const { error: updateError } = await supabaseClient
          .from('pago')
          .update({ estado: 'completado' })
          .eq('id', pagoId);

        if (updateError) throw new Error(updateError.message);
        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al completar el Bizum';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const cancelarBizumPendiente = useCallback(
    async (pagoId: string) => {
      try {
        setSaving(true);
        setError(null);
        const { error: updateError } = await supabaseClient
          .from('pago')
          .update({ estado: 'cancelado' })
          .eq('id', pagoId);

        if (updateError) throw new Error(updateError.message);
        await refreshContabilidad();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cancelar el Bizum';
        setError(message);
        return { success: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [refreshContabilidad]
  );

  const getResumenCuentas = useCallback(
    (sourceMovimientos = movimientos, sourceCuentas = cuentas): ResumenCuentaContable[] =>
      buildResumenCuentas(sourceMovimientos, sourceCuentas),
    [cuentas, movimientos]
  );

  const getResumenEfeDiario = useCallback(
    (
      fecha: string,
      sourceMovimientos = movimientos,
      sourceCuentas = cuentas,
      sourceSaldos = saldosIniciales
    ): ResumenEfeDiario =>
      buildResumenEfeDiario(sourceMovimientos, sourceCuentas, fecha, sourceSaldos),
    [cuentas, movimientos, saldosIniciales]
  );

  return {
    movimientos,
    bancos,
    cuentas,
    metodosPago,
    saldosIniciales,
    pendingBizums,
    loading: usuarioLoading || loading,
    saving,
    error,
    refreshContabilidad,
    guardarBanco,
    toggleBancoActivo,
    guardarCuenta,
    toggleCuentaActiva,
    guardarMetodoPago,
    toggleMetodoPagoActivo,
    guardarSaldoInicialDiario,
    createIngresoManual,
    createGasto,
    createDevolucion,
    createTraspaso,
    editarMovimientoManual,
    editarGastoManual,
    editarTraspasoManual,
    anularMovimientoManual,
    completarBizumPendiente,
    cancelarBizumPendiente,
    getResumenCuentas,
    getResumenEfeDiario,
    createEmptyGastoDetail,
    resolveMethodDefaultAccountId,
    findMethodByCode: (code: string) => findMethodByCode(metodosPago, code),
    findAccountByCode: (code: string) => findAccountByCode(cuentas, code),
  };
}

export default useContabilidad;

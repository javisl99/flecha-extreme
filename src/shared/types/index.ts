// Tipos compartidos para toda la aplicación

export interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  movil: string;
  fechaRegistro: string;
  dni?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Reserva {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  actividad: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';
  pagado: boolean;
  precio: number;
  notas?: string;
}

export interface Pago {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  reservaId?: string;
  reserva?: Reserva;
  concepto: string;
  monto: number;
  fechaPago: string;
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';
  estado: 'Pendiente' | 'Completado' | 'Cancelado';
  notas?: string;
}

export interface Documento {
  id: string;
  nombre: string;
  descripcion?: string;
  url: string;
  tipo?: 'contrato' | 'factura' | 'recibo' | 'otro';
  categoria?: 'general' | 'contabilidad_factura' | 'contabilidad_justificante' | 'contabilidad_otro';
  fechaCreacion?: string;
  created_at?: string;
  id_usuario?: string;
  id_movimiento_contable?: string | null;
  clienteId?: string;
  reservaId?: string;
  usuario?: {
    nombre: string;
    apellidos: string;
  } | null;
}

export interface Empleado {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  movil: string;
  puesto: string;
  departamento: string;
  fechaContratacion: string;
  activo: boolean;
}

export interface RegistroHoras {
  id: string;
  empleadoId: string;
  empleado?: Empleado;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  horasTotales: number;
  actividad: string;
}

export interface Actividad {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  precio: number;
  duracion: number;
  capacidadMaxima: number;
  requisitos?: string;
  activo: boolean;
  imagen?: string;
}

export interface MovimientoCaja {
  id: string;
  fecha: string;
  concepto: string;
  tipo: 'ingreso' | 'gasto';
  importe: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  referencia?: string;
  notas?: string;
}

export type LegacyMetodoPagoCode =
  | 'efectivo'
  | 'tpv'
  | 'tpv_online'
  | 'bizum_alfonso'
  | 'bizum_robe'
  | 'bizum_alba'
  | 'bizum_maria'
  | 'bizum_jm'
  | 'angeles'
  | 'transferencia';

export type CajaContable = 'efectivo' | 'santander' | 'bbva' | 'personal';

export type MetodoContable =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'bizum_alfonso'
  | 'bizum_robe'
  | 'otro';

export type TipoMovimientoContable =
  | 'ingreso'
  | 'gasto'
  | 'traspaso_entrada'
  | 'traspaso_salida';

export type EstadoMovimientoContable = 'confirmado' | 'anulado';

export type TipoGastoContable =
  | 'publicidad_marketing'
  | 'personal'
  | 'material'
  | 'gasolina'
  | 'gestor'
  | 'impuestos'
  | 'alquiler_robe'
  | 'otros';

export type DeducibleContable = boolean;

export type TipoCuentaContable = 'caja' | 'banco';

export type ClaseMetodoPagoContable = 'efectivo' | 'tpv' | 'transferencia' | 'bizum' | 'otro';

export interface BancoContable {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
  created_at?: string;
  updated_at?: string;
}

export interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoCuentaContable;
  banco_id?: string | null;
  activo: boolean;
  visible_efe: boolean;
  orden: number;
  banco?: BancoContable | null;
  created_at?: string;
  updated_at?: string;
}

export interface MetodoPagoContable {
  id: string;
  codigo: string;
  nombre: string;
  clase: ClaseMetodoPagoContable;
  cuenta_liquidacion_id?: string | null;
  activo: boolean;
  permite_pendiente: boolean;
  orden: number;
  cuenta_liquidacion?: CuentaContable | null;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleGastoContable {
  id_movimiento_contable: string;
  tipo_gasto: TipoGastoContable;
  deducible: DeducibleContable;
  descripcion: string;
  proveedor: string;
  num_factura?: string | null;
  fecha_factura: string;
  comentario?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmpleadoContableRef {
  id: string;
  nombre: string;
  apellidos: string;
  email?: string;
  movil?: string;
}

export interface MovimientoContable {
  id: string;
  fecha_operacion: string;
  tipo: TipoMovimientoContable;
  estado: EstadoMovimientoContable;
  caja: CajaContable;
  cuenta_id?: string | null;
  cuenta?: CuentaContable | null;
  metodo?: MetodoContable | null;
  metodo_pago_id?: string | null;
  metodo_pago?: MetodoPagoContable | null;
  concepto: string;
  comentario?: string | null;
  importe_total: number;
  base_imponible: number;
  iva_pct: number;
  iva_importe: number;
  es_devolucion: boolean;
  origen_tipo?: string | null;
  origen_id?: string | null;
  id_pago?: string | null;
  id_empleado?: string | null;
  id_movimiento_relacionado?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  gasto?: DetalleGastoContable | null;
  empleado?: EmpleadoContableRef | null;
  documentos?: Documento[];
}

export interface ResumenCuentaContable {
  cuenta_id: string;
  cuenta: CuentaContable;
  saldo: number;
  ingresos_operativos: number;
  gastos_operativos: number;
}

export interface ResumenEfeCuenta {
  cuenta_id: string;
  cuenta: CuentaContable;
  saldo_inicial: number;
  ingresos: number;
  gastos: number;
  saldo_cierre: number;
  comentario_ajuste?: string | null;
  movimientos: MovimientoContable[];
}

export interface ResumenEfeDiario {
  fecha: string;
  ingresos: number;
  gastos: number;
  saldo: number;
  cuentas: ResumenEfeCuenta[];
  movimientos: MovimientoContable[];
}

export interface SaldoInicialContable {
  fecha: string;
  cuenta_id: string;
  saldo_inicial: number;
  comentario?: string | null;
  updated_by?: string | null;
  updated_at?: string;
  cuenta?: CuentaContable | null;
}

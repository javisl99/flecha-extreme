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
  clienteId?: string;
  reservaId?: string;
  tipo: 'contrato' | 'factura' | 'recibo' | 'otro';
  fechaCreacion: string;
  url: string;
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
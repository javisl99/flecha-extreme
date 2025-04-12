// Tipos compartidos para toda la aplicación

export interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  dni?: string;
  notas?: string;
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
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  estado: 'pendiente' | 'completado' | 'cancelado';
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
  telefono: string;
  puesto: string;
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
  precio: number;
  duracion: number;
  capacidadMaxima: number;
  activo: boolean;
} 
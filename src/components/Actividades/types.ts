import { Reserva } from '@/shared/types';

// Tipos específicos del módulo de reservas
export interface ReservaDetalle extends Reserva {
  // Campos adicionales específicos para el detalle de una reserva
  clienteNombre?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
}

export interface FiltrosReserva {
  clienteId?: string;
  actividad?: string;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: Reserva['estado'];
  pagado?: boolean;
}

export interface ResumenReservas {
  total: number;
  confirmadas: number;
  pendientes: number;
  canceladas: number;
  completadas: number;
  pagadas: number;
  noPagadas: number;
  ingresoTotal: number;
  ingresoPendiente: number;
} 
import { Cliente } from '@/shared/types';

// Tipos específicos del módulo de clientes
export interface ClienteDetalle extends Cliente {
  // Aquí se pueden añadir campos específicos para el detalle de un cliente
  // que no sean necesarios en el tipo base
  totalReservas?: number;
  totalGastado?: number;
}

export interface FiltrosCliente {
  busqueda?: string;
  ordenarPor?: 'nombre' | 'apellidos' | 'email' | 'movil' | 'dni' | 'fechaRegistro' | 'fechaActualizacion';
  direccion?: 'asc' | 'desc';
} 
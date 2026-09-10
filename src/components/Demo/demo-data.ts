export type DemoSection = 'dashboard' | 'reservas' | 'clientes' | 'pagos';

export type DemoPayment = {
  id: string;
  client: string;
  concept: string;
  amount: number;
  method: 'Bizum' | 'Tarjeta' | 'Efectivo';
  status: 'Pendiente' | 'Completado';
};

export const demoReservations = [
  { id: 'R-1042', time: '09:30', activity: 'Curso de surf · iniciación', client: 'Lucía Martín', people: 2, status: 'Confirmada' },
  { id: 'R-1043', time: '11:00', activity: 'Ruta guiada en kayak', client: 'Hugo Romero', people: 4, status: 'Confirmada' },
  { id: 'R-1044', time: '12:30', activity: 'Paddle surf · alquiler', client: 'Marta Vidal', people: 2, status: 'Pendiente' },
  { id: 'R-1045', time: '16:00', activity: 'Campamento náutico', client: 'Álex Navarro', people: 1, status: 'Confirmada' },
];

export const demoClients = [
  { id: 'C-0218', name: 'Lucía Martín', email: 'lucia.martin@example.com', phone: '+34 600 123 018', bookings: 4, lastActivity: 'Curso de surf' },
  { id: 'C-0219', name: 'Hugo Romero', email: 'hugo.romero@example.com', phone: '+34 600 123 019', bookings: 2, lastActivity: 'Ruta en kayak' },
  { id: 'C-0220', name: 'Marta Vidal', email: 'marta.vidal@example.com', phone: '+34 600 123 020', bookings: 6, lastActivity: 'Paddle surf' },
  { id: 'C-0221', name: 'Álex Navarro', email: 'alex.navarro@example.com', phone: '+34 600 123 021', bookings: 1, lastActivity: 'Campamento náutico' },
];

export const initialDemoPayments: DemoPayment[] = [
  { id: 'P-0871', client: 'Marta Vidal', concept: 'Alquiler paddle surf', amount: 45, method: 'Bizum', status: 'Pendiente' },
  { id: 'P-0870', client: 'Hugo Romero', concept: 'Ruta guiada en kayak', amount: 120, method: 'Tarjeta', status: 'Completado' },
  { id: 'P-0869', client: 'Lucía Martín', concept: 'Curso de surf · iniciación', amount: 90, method: 'Efectivo', status: 'Completado' },
];

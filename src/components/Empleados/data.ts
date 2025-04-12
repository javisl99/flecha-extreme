import { Empleado, RegistroHoras } from '@/shared/types';

export const empleadosMock: Empleado[] = [
  {
    id: 'e1',
    nombre: 'Miguel',
    apellidos: 'López Ramírez',
    email: 'miguel.lopez@flechaextreme.com',
    telefono: '654123987',
    puesto: 'Instructor de Kitesurf',
    fechaContratacion: '2022-03-15',
    activo: true
  },
  {
    id: 'e2',
    nombre: 'Patricia',
    apellidos: 'Martínez Sanz',
    email: 'patricia.martinez@flechaextreme.com',
    telefono: '678456123',
    puesto: 'Recepcionista',
    fechaContratacion: '2022-05-10',
    activo: true
  },
  {
    id: 'e3',
    nombre: 'Antonio',
    apellidos: 'García Fernández',
    email: 'antonio.garcia@flechaextreme.com',
    telefono: '612789345',
    puesto: 'Gerente',
    fechaContratacion: '2021-01-20',
    activo: true
  },
  {
    id: 'e4',
    nombre: 'Isabel',
    apellidos: 'Rodríguez Gómez',
    email: 'isabel.rodriguez@flechaextreme.com',
    telefono: '645987321',
    puesto: 'Instructor de Kayak',
    fechaContratacion: '2022-06-05',
    activo: true
  },
  {
    id: 'e5',
    nombre: 'David',
    apellidos: 'Sánchez Pérez',
    email: 'david.sanchez@flechaextreme.com',
    telefono: '678321654',
    puesto: 'Técnico de Mantenimiento',
    fechaContratacion: '2022-04-12',
    activo: true
  }
];

export const registroHorasMock: RegistroHoras[] = [
  {
    id: 'h1',
    empleadoId: 'e1',
    empleado: empleadosMock.find(e => e.id === 'e1'),
    fecha: '2024-04-24',
    horaEntrada: '09:00',
    horaSalida: '17:00',
    horasTotales: 8,
    actividad: 'Clases de Kitesurf'
  },
  {
    id: 'h2',
    empleadoId: 'e2',
    empleado: empleadosMock.find(e => e.id === 'e2'),
    fecha: '2024-04-24',
    horaEntrada: '08:30',
    horaSalida: '16:30',
    horasTotales: 8,
    actividad: 'Atención al cliente'
  },
  {
    id: 'h3',
    empleadoId: 'e3',
    empleado: empleadosMock.find(e => e.id === 'e3'),
    fecha: '2024-04-24',
    horaEntrada: '08:00',
    horaSalida: '18:00',
    horasTotales: 10,
    actividad: 'Gestión y reuniones'
  },
  {
    id: 'h4',
    empleadoId: 'e4',
    empleado: empleadosMock.find(e => e.id === 'e4'),
    fecha: '2024-04-24',
    horaEntrada: '10:00',
    horaSalida: '18:00',
    horasTotales: 8,
    actividad: 'Tour guiado de Kayak'
  },
  {
    id: 'h5',
    empleadoId: 'e5',
    empleado: empleadosMock.find(e => e.id === 'e5'),
    fecha: '2024-04-24',
    horaEntrada: '09:00',
    horaSalida: '17:00',
    horasTotales: 8,
    actividad: 'Reparación de equipos'
  },
  {
    id: 'h6',
    empleadoId: 'e1',
    empleado: empleadosMock.find(e => e.id === 'e1'),
    fecha: '2024-04-25',
    horaEntrada: '09:00',
    horaSalida: '17:00',
    horasTotales: 8,
    actividad: 'Clases de Kitesurf'
  },
  {
    id: 'h7',
    empleadoId: 'e2',
    empleado: empleadosMock.find(e => e.id === 'e2'),
    fecha: '2024-04-25',
    horaEntrada: '08:30',
    horaSalida: '16:30',
    horasTotales: 8,
    actividad: 'Atención al cliente'
  }
]; 
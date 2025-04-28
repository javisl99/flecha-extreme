import { Actividad } from '@/shared/types';

export const actividadesMock: Actividad[] = [
  {
    id: 'a1',
    nombre: 'Clase de Kitesurf (Principiante)',
    descripcion: 'Clase para principiantes sin experiencia previa',
    categoria: 'Kitesurf',
    precio: 80,
    duracion: 120, // minutos
    capacidadMaxima: 4,
    activo: true
  },
  {
    id: 'a2',
    nombre: 'Clase de Kitesurf (Intermedio)',
    descripcion: 'Clase para personas con conocimientos básicos',
    categoria: 'Kitesurf',
    precio: 80,
    duracion: 120, // minutos
    capacidadMaxima: 3,
    activo: true
  },
  {
    id: 'a3',
    nombre: 'Clase de Kitesurf (Avanzado)',
    descripcion: 'Clase para perfeccionar técnicas avanzadas',
    categoria: 'Kitesurf',
    precio: 90,
    duracion: 120, // minutos
    capacidadMaxima: 2,
    activo: true
  },
  {
    id: 'a4',
    nombre: 'Clase Privada de Kitesurf',
    descripcion: 'Clase individual con instructor exclusivo',
    categoria: 'Kitesurf',
    precio: 150,
    duracion: 180, // minutos
    capacidadMaxima: 1,
    activo: true
  },
  {
    id: 'a5',
    nombre: 'Alquiler de Kayak',
    descripcion: 'Alquiler por horas de kayak individual',
    categoria: 'Kayak',
    precio: 20,
    duracion: 60, // por hora, mínimo 1 hora
    capacidadMaxima: 1,
    activo: true
  },
  {
    id: 'a6',
    nombre: 'Alquiler de Kayak Doble',
    descripcion: 'Alquiler por horas de kayak para dos personas',
    categoria: 'Kayak',
    precio: 30,
    duracion: 60, // por hora, mínimo 1 hora
    capacidadMaxima: 2,
    activo: true
  },
  {
    id: 'a7',
    nombre: 'Tour Guiado de Kayak',
    descripcion: 'Excursión guiada en kayak con instructor',
    categoria: 'Kayak',
    precio: 60,
    duracion: 120, // minutos
    capacidadMaxima: 8,
    activo: true
  },
  {
    id: 'a8',
    nombre: 'Alquiler de Paddleboard',
    descripcion: 'Alquiler por horas de tabla de paddleboard',
    categoria: 'Paddleboard',
    precio: 25,
    duracion: 60, // por hora, mínimo 1 hora
    capacidadMaxima: 1,
    activo: true
  },
  {
    id: 'a9',
    nombre: 'Tour de Paddleboard',
    descripcion: 'Excursión guiada en paddleboard con instructor',
    categoria: 'Paddleboard',
    precio: 60,
    duracion: 120, // minutos
    capacidadMaxima: 6,
    activo: true
  },
  {
    id: 'a10',
    nombre: 'Campus de Verano (Semana)',
    descripcion: 'Programa semanal de actividades acuáticas para niños y jóvenes',
    categoria: 'Programas',
    precio: 250,
    duracion: 2400, // 40 horas semanales
    capacidadMaxima: 15,
    activo: true
  },
  {
    id: 'a11',
    nombre: 'Mantenimiento de Equipo',
    descripcion: 'Servicio de revisión y mantenimiento de material de kitesurf',
    categoria: 'Servicios',
    precio: 50,
    duracion: 60, // minutos
    capacidadMaxima: 1,
    activo: true
  },
  {
    id: 'a12',
    nombre: 'Windsurf (Principiante)',
    descripcion: 'Clase de windsurf para principiantes',
    categoria: 'Windsurf',
    precio: 70,
    duracion: 120, // minutos
    capacidadMaxima: 4,
    activo: false
  }
]; 
import { Actividad } from '@/shared/types';

export const actividadesMock: Actividad[] = [
  {
    id: '1',
    nombre: 'Escalada en Roca',
    categoria: 'Aventura',
    descripcion: 'Escalada guiada en roca natural',
    duracion: 120,
    precio: 45,
    activo: true,
    capacidadMaxima: 8
  },
  {
    id: '2',
    nombre: 'Rafting',
    categoria: 'Aventura',
    descripcion: 'Descenso en balsa por río',
    duracion: 180,
    precio: 60,
    activo: true,
    capacidadMaxima: 12
  }
]; 
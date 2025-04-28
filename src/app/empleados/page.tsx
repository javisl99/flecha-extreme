'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';

// Componente del icono SVG de Empleados
const EmpleadosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Datos de ejemplo para empleados
const empleadosMock = [
  { 
    id: '1', 
    nombre: 'Ana', 
    apellidos: 'García López', 
    puesto: 'Gerente', 
    departamento: 'Administración', 
    email: 'ana.garcia@flechaextreme.com',
    telefono: '666111222',
    fechaContratacion: '2020-04-15',
    activo: true
  },
  { 
    id: '2', 
    nombre: 'Carlos', 
    apellidos: 'Martínez Ruiz', 
    puesto: 'Instructor', 
    departamento: 'Actividades', 
    email: 'carlos.martinez@flechaextreme.com',
    telefono: '666333444',
    fechaContratacion: '2020-06-10',
    activo: true
  },
  { 
    id: '3', 
    nombre: 'Laura', 
    apellidos: 'Sánchez Pérez', 
    puesto: 'Recepcionista', 
    departamento: 'Atención al Cliente', 
    email: 'laura.sanchez@flechaextreme.com',
    telefono: '666555666',
    fechaContratacion: '2021-02-22',
    activo: true
  },
  { 
    id: '4', 
    nombre: 'Miguel', 
    apellidos: 'Hernández Gil', 
    puesto: 'Instructor', 
    departamento: 'Actividades', 
    email: 'miguel.hernandez@flechaextreme.com',
    telefono: '666777888',
    fechaContratacion: '2021-07-05',
    activo: false
  },
  { 
    id: '5', 
    nombre: 'Sofía', 
    apellidos: 'Díaz Marín', 
    puesto: 'Contable', 
    departamento: 'Administración', 
    email: 'sofia.diaz@flechaextreme.com',
    telefono: '666999000',
    fechaContratacion: '2022-01-10',
    activo: true
  },
];

export default function EmpleadosPage() {
  const [filtro, setFiltro] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<boolean | null>(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<(typeof empleadosMock)[0] | null>(null);
  
  const empleadosFiltrados = empleadosMock.filter(empleado => {
    const coincideBusqueda = 
      empleado.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      empleado.apellidos.toLowerCase().includes(filtro.toLowerCase()) ||
      empleado.puesto.toLowerCase().includes(filtro.toLowerCase()) ||
      empleado.departamento.toLowerCase().includes(filtro.toLowerCase()) ||
      empleado.email.toLowerCase().includes(filtro.toLowerCase());
      
    const coincideActivo = filtroActivo === null || empleado.activo === filtroActivo;
    
    return coincideBusqueda && coincideActivo;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Empleados</h1>
        <Button variant="primary" icon={<EmpleadosIcon />}>
          Nuevo Empleado
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Card>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar empleados..."
                  className="w-full px-4 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="px-4 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={filtroActivo === null ? '' : filtroActivo ? 'activo' : 'inactivo'}
                  onChange={(e) => {
                    if (e.target.value === '') setFiltroActivo(null);
                    else setFiltroActivo(e.target.value === 'activo');
                  }}
                >
                  <option value="">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-table-head-bg dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Puesto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                  {empleadosFiltrados.map((empleado) => (
                    <tr 
                      key={empleado.id} 
                      className="hover:bg-table-row-hover dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => setEmpleadoSeleccionado(empleado)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-light text-white flex items-center justify-center">
                            {empleado.nombre.charAt(0)}{empleado.apellidos.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {empleado.nombre} {empleado.apellidos}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {empleado.puesto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {empleado.departamento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {empleado.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          empleado.activo 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                        }`}>
                          {empleado.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {empleadosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No se encontraron empleados con los filtros seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card title="Detalles del Empleado" className="h-full">
            {empleadoSeleccionado ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary-light text-white text-xl font-bold">
                    {empleadoSeleccionado.nombre.charAt(0)}{empleadoSeleccionado.apellidos.charAt(0)}
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                    {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {empleadoSeleccionado.puesto} - {empleadoSeleccionado.departamento}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-gray-100">{empleadoSeleccionado.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Teléfono:</span>
                    <span className="text-gray-900 dark:text-gray-100">{empleadoSeleccionado.telefono}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Fecha de contratación:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(empleadoSeleccionado.fechaContratacion).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                    <span className={empleadoSeleccionado.activo ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                      {empleadoSeleccionado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Horarios
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Nóminas
                  </Button>
                </div>
                
                <div className="pt-4 flex space-x-2">
                  <Button variant="primary" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button 
                    variant={empleadoSeleccionado.activo ? 'accent' : 'secondary'} 
                    size="sm" 
                    className="flex-1"
                  >
                    {empleadoSeleccionado.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                Selecciona un empleado para ver sus detalles
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 
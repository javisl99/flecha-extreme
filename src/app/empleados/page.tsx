'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useEmpleados, type Empleado } from '@/hooks/useEmpleados';
import { toast } from 'react-hot-toast';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';
import ModalEmpleado from '@/components/Empleados/ModalEmpleado';
import { FiltrosEmpleados, type FiltrosEmpleadoState } from '@/components/Empleados/FiltrosEmpleados';

// Componente del icono SVG de Empleados
const EmpleadosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function EmpleadosPage() {
  const [filtros, setFiltros] = useState<FiltrosEmpleadoState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: ''
  });
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [isModalEmpleadoOpen, setIsModalEmpleadoOpen] = useState(false);
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');
  const { empleados, loading, error, eliminarEmpleado, refreshEmpleados } = useEmpleados();
  
  const empleadosFiltrados = empleados.filter(empleado => {
    const coincideNombre = !filtros.nombre || empleado.nombre?.toLowerCase().includes(filtros.nombre.toLowerCase());
    const coincideApellidos = !filtros.apellidos || empleado.apellidos?.toLowerCase().includes(filtros.apellidos.toLowerCase());
    const coincideEmail = !filtros.email || empleado.email?.toLowerCase().includes(filtros.email.toLowerCase());
    const coincideMovil = !filtros.movil || empleado.movil?.toLowerCase().includes(filtros.movil.toLowerCase());
    const coincideDNI = !filtros.dni || empleado.dni?.toLowerCase().includes(filtros.dni.toLowerCase());
      
    return coincideNombre && coincideApellidos && coincideEmail && coincideMovil && coincideDNI;
  });

  const handleNuevoEmpleadoSuccess = async (updatedEmpleado: Empleado) => {
    await refreshEmpleados();
    setEmpleadoSeleccionado(updatedEmpleado);
  };

  const handleEliminarEmpleado = async () => {
    if (!empleadoSeleccionado) return;
    setIsModalConfirmacionOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!empleadoSeleccionado) return;
    
    try {
      const result = await eliminarEmpleado(empleadoSeleccionado.id);
      if (!result.error) {
        toast.success('Empleado eliminado correctamente');
        setEmpleadoSeleccionado(null);
        await refreshEmpleados();
      } else {
        toast.error('Error al eliminar el empleado');
      }
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      toast.error('Error al eliminar el empleado');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Empleados</h1>
          <Button 
            variant="primary" 
            icon={<EmpleadosIcon />}
            onClick={() => { setModoModal('nuevo'); setIsModalEmpleadoOpen(true); }}
          >
            Nuevo Empleado
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <Card>
              <FiltrosEmpleados onFiltrosChange={setFiltros} />
              <div className="overflow-x-auto">
                {loading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-table-head-bg dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Empleado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Móvil
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          DNI
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                      {empleadosFiltrados.map((empleado) => (
                        <tr 
                          key={empleado.id} 
                          className={`transition-colors cursor-pointer ${
                            empleadoSeleccionado?.id === empleado.id 
                              ? 'bg-primary/10 hover:bg-primary/20' 
                              : 'hover:bg-table-row-hover dark:hover:bg-gray-700'
                          }`}
                          onClick={() => setEmpleadoSeleccionado(empleado)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-light text-white flex items-center justify-center">
                                {empleado.nombre?.charAt(0)}{empleado.apellidos?.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {empleado.nombre} {empleado.apellidos}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {empleado.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {empleado.movil}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {empleado.dni}
                          </td>
                        </tr>
                      ))}
                      
                      {empleadosFiltrados.length === 0 && !loading && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron empleados con los filtros seleccionados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
          
          <div className="w-full md:w-1/3">
            <Card title="Detalles del Empleado" className="h-full">
              {empleadoSeleccionado ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary-light text-white text-xl font-bold">
                      {empleadoSeleccionado.nombre?.charAt(0)}{empleadoSeleccionado.apellidos?.charAt(0)}
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                      {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <span className="text-gray-900 dark:text-gray-100">{empleadoSeleccionado.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Teléfono:</span>
                      <span className="text-gray-900 dark:text-gray-100">{empleadoSeleccionado.movil}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">DNI:</span>
                      <span className="text-gray-900 dark:text-gray-100">{empleadoSeleccionado.dni}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Fecha de registro:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(empleadoSeleccionado.created_at || '').toLocaleDateString()}
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
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => { setModoModal('editar'); setIsModalEmpleadoOpen(true); }}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="accent"
                      size="sm" 
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleEliminarEmpleado}
                      icon={<TrashIcon />}
                    >
                      Eliminar
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

      <ModalEmpleado
        isOpen={isModalEmpleadoOpen}
        onClose={() => setIsModalEmpleadoOpen(false)}
        onSuccess={handleNuevoEmpleadoSuccess}
        modo={modoModal}
        empleado={modoModal === 'editar' && empleadoSeleccionado ? empleadoSeleccionado : undefined}
      />

      <ModalConfirmacion
        isOpen={isModalConfirmacionOpen}
        onClose={() => setIsModalConfirmacionOpen(false)}
        onConfirm={handleConfirmarEliminacion}
        titulo="Eliminar Empleado"
        mensaje={`¿Estás seguro de que quieres eliminar al empleado ${empleadoSeleccionado?.nombre} ${empleadoSeleccionado?.apellidos}? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
      />
    </ProtectedRoute>
  );
} 
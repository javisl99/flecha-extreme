'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { Cliente } from '@/shared/types';
import { useClientes } from '@/hooks/useClientes';
import ModalCliente from '@/components/Clientes/modalCliente';
import { FiltrosClientes, type FiltrosClienteState } from '@/components/Clientes/FiltrosClientes';
import { toast } from 'react-hot-toast';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function ClientesPage() {
  const [filtros, setFiltros] = useState<FiltrosClienteState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: ''
  });
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');
  const { clientes, loading, error, refreshClientes, eliminarCliente } = useClientes();
  
  const clientesFiltrados = clientes.filter(cliente => {
    const cumpleNombre = !filtros.nombre || cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
    const cumpleApellidos = !filtros.apellidos || cliente.apellidos.toLowerCase().includes(filtros.apellidos.toLowerCase());
    const cumpleEmail = !filtros.email || cliente.email.toLowerCase().includes(filtros.email.toLowerCase());
    const cumpleMovil = !filtros.movil || String(cliente.movil).includes(filtros.movil);
    const cumpleDni = !filtros.dni || (cliente.dni && cliente.dni.toLowerCase().includes(filtros.dni.toLowerCase()));

    return cumpleNombre && cumpleApellidos && cumpleEmail && cumpleMovil && cumpleDni;
  });

  const handleNuevoClienteSuccess = async (updatedClient: Cliente) => {
    await refreshClientes();
    setClienteSeleccionado(updatedClient);
  };

  const handleEliminarCliente = async () => {
    if (!clienteSeleccionado) return;
    setIsModalConfirmacionOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!clienteSeleccionado) return;
    
    try {
      const result = await eliminarCliente(clienteSeleccionado.id);
      if (!result.error) {
        toast.success('Cliente eliminado correctamente');
        setClienteSeleccionado(null);
        await refreshClientes();
      } else {
        toast.error('Error al eliminar el cliente');
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error al eliminar el cliente');
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Clientes</h1>
        <Button 
          variant="primary"
          icon={<UserIcon />}
          className="cursor-pointer"
          onClick={() => { setModoModal('nuevo'); setIsModalOpen(true); }}
        >
          Nuevo Cliente
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Card>
            <FiltrosClientes onFiltrosChange={setFiltros} />
            
            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton columns={5} rows={5} />
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cliente
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
                    {clientesFiltrados.map((cliente) => (
                      <tr 
                        key={cliente.id} 
                        className={`transition-colors cursor-pointer ${
                          clienteSeleccionado?.id === cliente.id 
                            ? 'bg-primary/10 hover:bg-primary/20' 
                            : 'hover:bg-table-row-hover dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setClienteSeleccionado(cliente)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-light text-white flex items-center justify-center">
                              {cliente.nombre?.charAt(0)}{cliente.apellidos?.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {cliente.nombre} {cliente.apellidos}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {cliente.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {cliente.movil || 'No especificado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {cliente.dni || 'No especificado'}
                        </td>
                      </tr>
                    ))}
                    
                    {clientesFiltrados.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron clientes con esos criterios
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
          <Card title="Detalles del Cliente" className="h-full">
            {clienteSeleccionado ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary-light text-white text-xl font-bold">
                    {clienteSeleccionado.nombre.charAt(0)}{clienteSeleccionado.apellidos.charAt(0)}
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                    {clienteSeleccionado.nombre} {clienteSeleccionado.apellidos}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-gray-100">{clienteSeleccionado.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Móvil:</span>
                    <span className="text-gray-900 dark:text-gray-100">{clienteSeleccionado.movil || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">DNI:</span>
                    <span className="text-gray-900 dark:text-gray-100">{clienteSeleccionado.dni || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Fecha de registro:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {clienteSeleccionado.notas && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      {clienteSeleccionado.notas}
                    </p>
                  </div>
                )}
                
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Reservas
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Pagos
                  </Button>
                </div>
                
                <div className="pt-4 flex space-x-2">
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => { setModoModal('editar'); setIsModalOpen(true); }}>
                    Editar
                  </Button>
                  <Button 
                    variant="accent" 
                    size="sm" 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleEliminarCliente}
                    icon={<TrashIcon />}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                Selecciona un cliente para ver sus detalles
              </div>
            )}
          </Card>
        </div>
      </div>

      <ModalCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleNuevoClienteSuccess}
        modo={modoModal}
        cliente={modoModal === 'editar' && clienteSeleccionado ? clienteSeleccionado : undefined}
      />

      <ModalConfirmacion
        isOpen={isModalConfirmacionOpen}
        onClose={() => setIsModalConfirmacionOpen(false)}
        onConfirm={handleConfirmarEliminacion}
        titulo="Eliminar Cliente"
        mensaje={`¿Estás seguro de que quieres eliminar al cliente ${clienteSeleccionado?.nombre} ${clienteSeleccionado?.apellidos}? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
      />
    </div>
  );
} 
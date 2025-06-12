'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { Cliente } from '@/shared/types';
import { FiltrosCliente } from '@/components/Clientes/types';
import { useClientes } from '@/hooks/useClientes';
import ModalCliente from '@/components/Clientes/modalCliente';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

export default function ClientesPage() {
  const [filtros, setFiltros] = useState<FiltrosCliente>({
    busqueda: '',
    ordenarPor: 'nombre',
    direccion: 'asc'
  });
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');
  const { clientes, loading, error, refreshClientes } = useClientes(filtros);
  
  const handleBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({ ...filtros, busqueda: e.target.value });
  };
  
  const handleOrdenar = (campo: FiltrosCliente['ordenarPor']) => {
    if (filtros.ordenarPor === campo) {
      setFiltros({ ...filtros, direccion: filtros.direccion === 'asc' ? 'desc' : 'asc' });
    } else {
      setFiltros({ ...filtros, ordenarPor: campo, direccion: 'asc' });
    }
  };

  const handleNuevoClienteSuccess = async (updatedClient: Cliente) => {
    // Recargar la lista de clientes para asegurar que la tabla está al día
    await refreshClientes();
    // Actualizar el cliente seleccionado directamente con los datos del modal
    setClienteSeleccionado(updatedClient);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando clientes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
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
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="w-full px-4 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={filtros.busqueda}
                onChange={handleBusqueda}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrdenar('nombre')}
                    >
                      <span className="flex items-center gap-1">
                        Nombre
                        {filtros.ordenarPor === 'nombre' && (
                          <span>{filtros.direccion === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrdenar('apellidos')}
                    >
                      <span className="flex items-center gap-1">
                        Apellidos
                        {filtros.ordenarPor === 'apellidos' && (
                          <span>{filtros.direccion === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrdenar('email')}
                    >
                      <span className="flex items-center gap-1">
                        Email
                        {filtros.ordenarPor === 'email' && (
                          <span>{filtros.direccion === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrdenar('movil')}
                    >
                      <span className="flex items-center gap-1">
                        Móvil
                        {filtros.ordenarPor === 'movil' && (
                          <span>{filtros.direccion === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrdenar('dni')}
                    >
                      <span className="flex items-center gap-1">
                        DNI
                        {filtros.ordenarPor === 'dni' && (
                          <span>{filtros.direccion === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                  {clientes.map((cliente) => (
                    <tr 
                      key={cliente.id} 
                      className="hover:bg-table-row-hover dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => setClienteSeleccionado(cliente)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cliente.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {cliente.apellidos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {cliente.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {cliente.movil}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {cliente.dni || 'No especificado'}
                      </td>
                    </tr>
                  ))}
                  
                  {clientes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No se encontraron clientes con esos criterios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">{clienteSeleccionado.nombre} {clienteSeleccionado.apellidos}</h3>
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
                    <span className="text-gray-900 dark:text-gray-100">{new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString()}</span>
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
                  <Button variant="accent" size="sm" className="flex-1">
                    Nueva Reserva
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
    </div>
  );
} 
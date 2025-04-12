'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { clientesMock } from '@/components/Clientes/data';
import { Cliente } from '@/shared/types';
import { FiltrosCliente } from '@/components/Clientes/types';

export default function ClientesPage() {
  const [filtros, setFiltros] = useState<FiltrosCliente>({
    busqueda: '',
    ordenarPor: 'nombre',
    direccion: 'asc'
  });
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  
  // Filtrar y ordenar clientes
  const clientesFiltrados = clientesMock
    .filter((cliente) => {
      if (!filtros.busqueda) return true;
      
      const termino = filtros.busqueda.toLowerCase();
      return (
        cliente.nombre.toLowerCase().includes(termino) ||
        cliente.apellidos.toLowerCase().includes(termino) ||
        cliente.email.toLowerCase().includes(termino) ||
        cliente.telefono.toLowerCase().includes(termino) ||
        (cliente.dni && cliente.dni.toLowerCase().includes(termino))
      );
    })
    .sort((a, b) => {
      const orden = filtros.direccion === 'asc' ? 1 : -1;
      
      switch (filtros.ordenarPor) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre) * orden;
        case 'apellidos':
          return a.apellidos.localeCompare(b.apellidos) * orden;
        case 'fechaRegistro':
          return (new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime()) * orden;
        default:
          return 0;
      }
    });
    
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Clientes</h1>
        <Button 
          variant="primary"
          icon="👤"
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
                      Nombre {filtros.ordenarPor === 'nombre' && (filtros.direccion === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrdenar('apellidos')}
                    >
                      Apellidos {filtros.ordenarPor === 'apellidos' && (filtros.direccion === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleOrdenar('fechaRegistro')}
                    >
                      Registro {filtros.ordenarPor === 'fechaRegistro' && (filtros.direccion === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                  {clientesFiltrados.map((cliente) => (
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
                        {cliente.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(cliente.fechaRegistro).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  
                  {clientesFiltrados.length === 0 && (
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
                    <span className="text-gray-500 dark:text-gray-400">Teléfono:</span>
                    <span className="text-gray-900 dark:text-gray-100">{clienteSeleccionado.telefono}</span>
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
                  <Button variant="primary" size="sm" className="flex-1">
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
    </div>
  );
} 
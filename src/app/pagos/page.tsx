'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { pagosMock } from '@/components/Pagos/data';

export default function PagosPage() {
  const [filtro, setFiltro] = useState('');
  
  const pagosFiltrados = pagosMock.filter(pago => 
    pago.concepto.toLowerCase().includes(filtro.toLowerCase()) ||
    pago.cliente?.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    pago.cliente?.apellidos.toLowerCase().includes(filtro.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Pagos</h1>
        <Button variant="primary" icon="💰">
          Nuevo Pago
        </Button>
      </div>
      
      <Card>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar pagos..."
            className="w-full px-4 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-table-head-bg dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Importe
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
              {pagosFiltrados.map((pago) => (
                <tr key={pago.id} className="hover:bg-table-row-hover dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pago.cliente ? `${pago.cliente.nombre} ${pago.cliente.apellidos}` : 'Cliente no encontrado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {pago.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(pago.fechaPago).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {pago.monto.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span title={pago.metodoPago}>
                      {pago.metodoPago === 'efectivo' ? '💵' : 
                       pago.metodoPago === 'tarjeta' ? '💳' : 
                       pago.metodoPago === 'transferencia' ? '🏦' : '💰'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={
                      pago.estado === 'completado' ? 'text-green-600 dark:text-green-500' :
                      pago.estado === 'pendiente' ? 'text-yellow-600 dark:text-yellow-500' :
                      'text-red-600 dark:text-red-500'
                    }>
                      {pago.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button className="text-primary-dark dark:text-primary-light hover:text-primary ml-2">
                      Ver
                    </button>
                    <button className="text-primary-dark dark:text-primary-light hover:text-primary ml-2">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              
              {pagosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron pagos con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 
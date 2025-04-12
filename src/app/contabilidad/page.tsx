'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { movimientosCajaMock } from '@/components/Contabilidad/data';

export default function ContabilidadPage() {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: ''
  });
  
  // Filtrar movimientos según los filtros
  const movimientosFiltrados = movimientosCajaMock.filter(movimiento => {
    if (filtros.fechaInicio && new Date(movimiento.fecha) < new Date(filtros.fechaInicio)) return false;
    if (filtros.fechaFin && new Date(movimiento.fecha) > new Date(filtros.fechaFin)) return false;
    if (filtros.tipo && movimiento.tipo !== filtros.tipo) return false;
    return true;
  });
  
  // Calcular totales
  const totalIngresos = movimientosFiltrados
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.importe, 0);
    
  const totalGastos = movimientosFiltrados
    .filter(m => m.tipo === 'gasto')
    .reduce((sum, m) => sum + m.importe, 0);
    
  const balance = totalIngresos - totalGastos;
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Contabilidad</h1>
        <div className="flex space-x-2">
          <Button variant="outline" icon="📊">
            Informes
          </Button>
          <Button variant="primary" icon="💰">
            Nuevo Movimiento
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">{totalIngresos.toFixed(2)} €</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500">{totalGastos.toFixed(2)} €</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {balance.toFixed(2)} €
            </p>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
            <input
              type="date"
              name="fechaInicio"
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filtros.fechaInicio}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
            <input
              type="date"
              name="fechaFin"
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filtros.fechaFin}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select
              name="tipo"
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filtros.tipo}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline"
              onClick={() => setFiltros({ fechaInicio: '', fechaFin: '', tipo: '' })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-table-head-bg dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Importe
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
              {movimientosFiltrados.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-table-row-hover dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {new Date(movimiento.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {movimiento.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {movimiento.metodoPago}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {movimiento.referencia || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={movimiento.tipo === 'ingreso' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                      {movimiento.tipo === 'ingreso' ? '+' : '-'}{movimiento.importe.toFixed(2)} €
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
              
              {movimientosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron movimientos con los filtros seleccionados
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
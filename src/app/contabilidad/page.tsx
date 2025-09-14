'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { movimientosCajaMock } from '@/components/Contabilidad/data';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';

// Iconos para métodos de pago
const CashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
  </svg>
);

const OtherPaymentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const MoneyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'efectivo': return <CashIcon />;
      case 'tarjeta': return <CardIcon />;
      case 'transferencia': return <BankIcon />;
      case 'otro': return <OtherPaymentIcon />;
      default: return <OtherPaymentIcon />;
    }
  };
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Contabilidad</h1>
          <div className="flex space-x-2">
            <Button variant="outline" icon={<ChartIcon />} className="cursor-pointer">
              Informes
            </Button>
            <Button variant="primary" icon={<MoneyIcon />} className="cursor-pointer">
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span title={movimiento.metodoPago} className="flex justify-center text-gray-600 dark:text-gray-400">
                        {getMetodoPagoIcon(movimiento.metodoPago)}
                      </span>
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
                      <div className="flex justify-end space-x-2">
                        <button className="p-1.5 rounded-full text-primary-dark dark:text-primary-light bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer" title="Ver">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="p-1.5 rounded-full text-primary-dark dark:text-primary-light bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="p-1.5 rounded-full text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer" title="Eliminar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
    </ProtectedRoute>
  );
} 
'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { pagosMock } from '@/components/Pagos/data';

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

export default function PagosPage() {
  const [filtro, setFiltro] = useState('');
  
  const pagosFiltrados = pagosMock.filter(pago => 
    pago.concepto.toLowerCase().includes(filtro.toLowerCase()) ||
    pago.cliente?.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    pago.cliente?.apellidos.toLowerCase().includes(filtro.toLowerCase())
  );
  
  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'Efectivo': return <CashIcon />;
      case 'Tarjeta': return <CardIcon />;
      case 'Transferencia': return <BankIcon />;
      case 'Otro': return <OtherPaymentIcon />;
      default: return <OtherPaymentIcon />;
    }
  };
  
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
                    <span title={pago.metodoPago} className="flex justify-center text-gray-600 dark:text-gray-400">
                      {getMetodoPagoIcon(pago.metodoPago)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={
                      pago.estado === 'Completado' ? 'text-green-600 dark:text-green-500' :
                      pago.estado === 'Pendiente' ? 'text-yellow-600 dark:text-yellow-500' :
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
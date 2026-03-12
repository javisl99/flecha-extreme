'use client';

import { useState } from 'react';
import { Card } from '@/shared/components';
import { MovimientoContable, ResumenEfeDiario } from '@/shared/types';
import { accountingMethodLabel, formatCurrency } from '@/lib/contabilidad';

interface ResumenDiarioProps {
  fecha: string;
  resumen: ResumenEfeDiario;
  movimientos: MovimientoContable[];
}

const LedgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export default function ResumenDiario({ fecha, resumen, movimientos }: ResumenDiarioProps) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const movimientosAMostrar = mostrarTodos ? movimientos : movimientos.slice(0, 3);
  const hayMasMovimientos = movimientos.length > 3;

  return (
    <Card title="Resumen del Dia" icon={<LedgerIcon />} className="h-full">
      <div className="space-y-4">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
          <span>
            {new Date(fecha).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos:</span>
          <span className="text-green-600 dark:text-green-500 font-semibold">{formatCurrency(resumen.ingresos)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Gastos:</span>
          <span className="text-red-600 dark:text-red-500 font-semibold">{formatCurrency(resumen.gastos)}</span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center">
          <span className="font-bold text-gray-700 dark:text-gray-300">Balance:</span>
          <span className={`font-bold ${resumen.saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            {formatCurrency(resumen.saldo)}
          </span>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Movimientos Recientes</h4>
          <div className="space-y-2">
            {movimientos.length > 0 ? (
              <>
                {movimientosAMostrar.map((movimiento) => (
                  <div
                    key={movimiento.id}
                    className="flex justify-between items-center text-xs p-2 rounded-md bg-gray-50 dark:bg-gray-800"
                  >
                    <div>
                      <span className="font-medium">{movimiento.concepto}</span>
                      <span className="block text-gray-500 dark:text-gray-400">
                        {accountingMethodLabel(movimiento.metodo)}
                        {movimiento.documentos?.[0] ? ` · ${movimiento.documentos[0].nombre}` : ''}
                      </span>
                    </div>
                    <span className={`${movimiento.importe_total >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'} font-semibold`}>
                      {formatCurrency(movimiento.importe_total)}
                    </span>
                  </div>
                ))}

                {!mostrarTodos && hayMasMovimientos && (
                  <div className="text-center mt-3">
                    <button
                      onClick={() => setMostrarTodos(true)}
                      className="text-sm text-primary-dark dark:text-primary-light hover:underline"
                    >
                      Ver todos los movimientos ({movimientos.length})
                    </button>
                  </div>
                )}

                {mostrarTodos && hayMasMovimientos && (
                  <div className="text-center mt-3">
                    <button
                      onClick={() => setMostrarTodos(false)}
                      className="text-sm text-primary-dark dark:text-primary-light hover:underline"
                    >
                      Mostrar menos
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-xs italic">No hay movimientos para mostrar en esta fecha.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

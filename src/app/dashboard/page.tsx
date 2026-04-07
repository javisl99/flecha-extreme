'use client';

import { useState } from 'react';
import { Card, SurfSpinner } from '@/shared/components';
import ResumenDiario from '@/components/Dashboard/ResumenDiario';
import ReservasHoy from '@/components/Dashboard/ReservasHoy';
import { reservasMock } from '@/components/Actividades/data';
import { useContabilidad } from '@/hooks/useContabilidad';
import { formatCurrency } from '@/lib/contabilidad';

// Componentes de iconos SVG para el dashboard
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

export default function DashboardPage() {
  const { loading: contabilidadLoading, getResumenEfeDiario } = useContabilidad();
  // Usando la fecha actual
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };
  
  const [fecha] = useState(getCurrentDate());
  
  // Filtrar datos para la fecha actual
  const reservasHoy = reservasMock.filter(r => r.fecha === fecha);
  
  // Calcular KPIs
  const reservasPendientes = reservasMock.filter(r => r.estado === 'Pendiente').length;
  const reservasNoPagadas = reservasMock.filter(r => !r.pagado).length;
  const resumenContable = getResumenEfeDiario(fecha);
  const movimientosHoy = resumenContable.movimientos;
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          title="Reservas Pendientes" 
          icon={<CalendarIcon />}
          className="bg-card-bg"
        >
          <div className="text-4xl font-bold text-center text-primary-dark dark:text-primary-light">{reservasPendientes}</div>
          <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">Por confirmar o pendientes</div>
        </Card>
        
        <Card 
          title="Sin Pagar" 
          icon={<WalletIcon />}
          className="bg-card-bg"
        >
          <div className="text-4xl font-bold text-center text-primary-dark dark:text-primary-light">{reservasNoPagadas}</div>
          <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">Reservas sin pago confirmado</div>
        </Card>
        
        <Card 
          title="Balance del Día" 
          icon={<ChartIcon />}
          className="bg-card-bg"
        >
          <div className={`text-4xl font-bold text-center ${resumenContable.saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            {contabilidadLoading ? '...' : formatCurrency(resumenContable.saldo)}
          </div>
          <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">Ingresos - Gastos</div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResumenDiario fecha={fecha} resumen={resumenContable} movimientos={movimientosHoy} />
        <ReservasHoy reservas={reservasHoy} />
      </div>
      
      {/* Ejemplo del SurfSpinner */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-primary-dark dark:text-primary-light mb-4">
          Ejemplo del SurfSpinner
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Tamaño Pequeño" className="bg-card-bg">
            <SurfSpinner size="sm" />
          </Card>
          
          <Card title="Tamaño Mediano" className="bg-card-bg">
            <SurfSpinner size="md" />
          </Card>
          
          <Card title="Tamaño Grande" className="bg-card-bg">
            <SurfSpinner size="lg" />
          </Card>
          
          <Card title="Con Texto" className="bg-card-bg">
            <SurfSpinner size="md" showText={true} text="Cargando datos..." />
          </Card>
        </div>
      </div>
    </div>
  );
} 

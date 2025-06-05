'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/components';
import { useParking } from '@/hooks/useParking';
import PlazaInfoModal from '@/components/Parking/PlazaInfoModal';

type MetodoPago = 'efectivo' | 'tpv' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface PagoParking {
  id: string;
  id_cliente: string | null;
  origen_tipo: 'parking';
  origen_id: string;
  concepto: string;
  importe: number;
  metodo: MetodoPago;
  estado: EstadoPago;
}

const tiposParking = [
  { 
    tipo: 'embarcacion', 
    titulo: 'Embarcaciones',
    color: 'bg-blue-100',
    colorBorde: 'border-blue-300',
    colorTexto: 'text-blue-800',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 267 267" fill="currentColor">
        <path d="M255.953 190.297l-18.683-37.132-37.127 18.7c-5.722 2.883-8.028 9.856-5.145 15.577 2.883 5.727 9.866 8.017 15.583 5.145l4.351-2.187c-9.562 27.772-36.616 48.696-69.593 52.612V122.004h18.716c6.407 0 11.602-5.194 11.602-11.602s-5.194-11.607-11.602-11.607h-18.716V86.443c18.656-5.113 32.417-22.164 32.417-42.419C177.755 19.744 158.011 0 133.737 0S89.719 19.744 89.719 44.024c0 20.255 13.761 37.301 32.417 42.419v12.352h-17.769c-6.407 0-11.602 5.2-11.602 11.607s5.194 11.602 11.602 11.602h17.769v120.883c-32.183-4.161-58.557-24.525-68.298-51.568l2.54 1.273c5.738 2.877 12.7.577 15.583-5.145 2.883-5.722.577-12.695-5.145-15.577l-37.127-18.7-18.683 37.132c-2.883 5.722-.571 12.7 5.145 15.577 1.675.843 3.454 1.24 5.211 1.24 4.248 0 8.338-2.339 10.372-6.391l.528-1.044c14.37 39.042 54.597 67.27 101.955 67.27 46.738 0 86.497-27.505 101.346-65.742 2.121 3.726 5.983 5.907 10.041 5.907 1.751 0 3.535-.392 5.211-1.24 5.722-2.883 8.028-9.862 5.151-15.583zM112.922 44.024c0-11.482 9.333-20.815 20.815-20.815 11.482 0 20.815 9.333 20.815 20.815 0 11.471-9.339 20.81-20.815 20.81-11.477 0-20.815-9.339-20.815-20.81z" />
      </svg>
    )
  },
  { 
    tipo: 'tabla', 
    titulo: 'Tablas',
    color: 'bg-green-100',
    colorBorde: 'border-green-300',
    colorTexto: 'text-green-800',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 512 512" fill="currentColor">
        <path d="M494.496 17.493C477.301.298 453.019-4.248 422.319 3.977c-82.101 22-197.341 133.723-258.726 198.362C81.471 288.813 8.511 382.116.952 410.324c-2.567 9.577.668 15.361 3.833 18.526 16.21 16.21 46.771 14.008 68.746 9.607-4.398 21.975-6.601 52.539 9.607 68.747 3.389 3.389 7.356 4.797 11.743 4.797 9.236 0 20.338-6.244 31.834-13.384 15.052-9.348 35.114-23.777 58.013-41.725 50.796-39.814 108.37-91.088 157.956-140.674 42.771-42.771 101.207-105.975 136.702-164.188C517 90.344 522.083 45.08 494.496 17.493zM480.074 86.6c-17.272 56.413-88.244 146.309-194.717 246.641-41.193 38.816-84.988 76.534-123.316 106.206-33.637 26.04-53.188 38.185-62.345 42.714-3.978-12.456-.097-37.68 5.414-55.695l36.794-36.794c5.409-5.409 5.409-14.179 0-19.59-5.409-5.409-14.179-5.409-19.59 0l-36.793 36.793c-18.022 5.513-43.243 9.394-55.695 5.416 4.528-9.157 16.674-28.709 42.713-62.345 29.672-38.329 67.39-82.125 106.206-123.316C279.079 120.157 368.976 49.185 425.388 31.913c22.849-6.996 39.046-5.306 49.519 5.168C485.38 47.554 487.07 63.751 480.074 86.6z M429.33 110.115c-6.884-3.34-15.17-.464-18.506 6.419-11.013 22.707-36.747 56.197-74.421 96.847-5.2 5.611-4.867 14.375.744 19.574 2.666 2.471 6.043 3.693 9.412 3.693 3.722 0 7.434-1.492 10.163-4.437 40.074-43.24 66.661-78.092 79.027-103.59 3.338-6.882.464-15.168-6.419-18.506z" />
      </svg>
    )
  },
  { 
    tipo: 'kayak', 
    titulo: 'Kayaks',
    color: 'bg-orange-100',
    colorBorde: 'border-orange-300',
    colorTexto: 'text-orange-800',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 511.999 511.999" fill="currentColor">
        <path d="M506.376 55.175L458.322 7.122c-5.504-5.504-14.428-5.504-19.933 0l-30.985 30.985c-14.252 14.252-17.674 35.223-10.286 52.713c-1.12.678-2.183 1.483-3.15 2.45L91.981 395.257c-1.027 1.027-1.872 2.163-2.574 3.361c-17.508-7.434-38.522-4.024-52.798 10.25L5.623 439.852c-5.504 5.504-5.504 14.429 0 19.933l48.054 48.054c5.504 5.504 14.428 5.504 19.933 0l30.985-30.985c15.23-15.23 18.103-38.138 8.621-56.267c.783-.549 1.537-1.157 2.237-1.857L417.44 116.745c.634-.634 1.188-1.317 1.699-2.021c18.126 9.473 41.025 6.598 56.252-8.629l30.985-30.985C511.88 69.604 511.88 60.679 506.376 55.175z" />
        <path d="M287.822 18.22C281.289 6.959 269.286.007 256.267 0c-13.02-.008-25.057 6.925-31.591 18.186c-29.734 51.242-69.75 138.626-69.75 237.815c0 9.547.378 18.983 1.074 28.29l53.352-53.352v-47.247c0-25.894 20.992-46.886 46.886-46.886c13.039 0 24.831 5.326 33.329 13.917l40.982-40.982C317.405 73.151 301.526 41.842 287.822 18.22z" />
        <path d="M356.238 224.889l-53.113 53.115v50.303c0 25.894-20.992 46.886-46.886 46.886c-13.817 0-26.235-5.979-34.816-15.488l-40.306 40.306c13.297 37.559 29.552 69.661 43.538 93.767c6.534 11.261 18.536 18.214 31.556 18.22s25.057-6.925 31.591-18.186c29.734-51.242 69.75-138.626 69.75-237.815C357.552 245.483 357.078 235.11 356.238 224.889z" />
      </svg>
    )
  }
];

export default function ParkingPage() {
  const { 
    plazas, 
    loading, 
    error, 
    fetchPlazasParking, 
    getReservaActual,
    crearReserva,
    eliminarReserva,
    fetchTarifas,
    getPagoReserva,
    tarifas
  } = useParking();
  const [plazaSeleccionada, setPlazaSeleccionada] = useState<any>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pagoInfo, setPagoInfo] = useState<PagoParking | undefined>(undefined);

  useEffect(() => {
    fetchPlazasParking();
  }, []);

  useEffect(() => {
    const fetchPagoInfo = async () => {
      if (plazaSeleccionada) {
        const reservaActual = getReservaActual(plazaSeleccionada.id);
        if (reservaActual?.id) {
          const pago = await getPagoReserva(reservaActual.id);
          setPagoInfo(pago || undefined);
        } else {
          setPagoInfo(undefined);
        }
      }
    };

    fetchPagoInfo();
  }, [plazaSeleccionada]);

  const getPlazasPorTipo = (tipo: string) => {
    return plazas.filter(plaza => plaza.tipo === tipo);
  };

  const handleClickPlaza = async (plaza: any) => {
    await fetchTarifas(plaza.tipo);
    setPlazaSeleccionada(plaza);
    setModalAbierto(true);
  };

  const handleCrearReserva = async (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
    pago?: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => {
    if (!plazaSeleccionada) return;
    
    const success = await crearReserva(plazaSeleccionada.id, data);
    if (success) {
      setModalAbierto(false);
      setPlazaSeleccionada(null);
      setPagoInfo(undefined);
    }
  };

  const handleEliminarReserva = async () => {
    if (!plazaSeleccionada) return;
    
    const success = await eliminarReserva(plazaSeleccionada.id);
    if (success) {
      setModalAbierto(false);
      setPlazaSeleccionada(null);
      setPagoInfo(undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Parking</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiposParking.map((tipoParking) => {
          const plazasTipo = getPlazasPorTipo(tipoParking.tipo);
          const plazasDisponibles = plazasTipo.filter(plaza => plaza.disponible !== false && !plaza.reservada);
          
          return (
            <Card key={tipoParking.tipo} className="overflow-hidden">
              <div className={`p-4 ${tipoParking.color} border-b ${tipoParking.colorBorde} flex items-center justify-between`}>
                <div className="flex items-center">
                  <div className={`${tipoParking.colorTexto} mr-3`}>
                    {tipoParking.icono}
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${tipoParking.colorTexto}`}>
                      {tipoParking.titulo}
                    </h2>
                    <p className={`text-sm ${tipoParking.colorTexto}`}>
                      {plazasDisponibles.length} de {plazasTipo.length} disponibles
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3">
                  {plazasTipo.map((plaza) => {
                    const estaDisponible = plaza.disponible !== false && !plaza.reservada;
                    const estaReservada = plaza.reservada;
                    
                    let estilos = '';
                    let titulo = '';
                    
                    if (estaDisponible) {
                      estilos = 'border-green-500 bg-green-50 cursor-pointer hover:bg-green-100';
                      titulo = 'Disponible';
                    } else if (estaReservada) {
                      estilos = 'border-red-500 bg-red-50 cursor-pointer';
                      titulo = 'Reservada';
                    } else {
                      estilos = 'border-red-500 bg-red-50 cursor-pointer';
                      titulo = 'Ocupada';
                    }

                    return (
                      <div
                        key={plaza.id}
                        className={`
                          relative aspect-square rounded-lg border-2 p-2
                          flex flex-col items-center justify-center
                          transition-colors duration-200
                          ${estilos}
                        `}
                        title={titulo}
                        onClick={() => handleClickPlaza(plaza)}
                      >
                        <span className={`text-lg font-medium ${
                          estaDisponible ? 'text-green-700' : 
                          estaReservada ? 'text-red-700' : 
                          'text-red-700'
                        }`}>
                          {plaza.codigo}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {plazaSeleccionada && (
        <PlazaInfoModal
          isOpen={modalAbierto}
          onClose={() => {
            setModalAbierto(false);
            setPlazaSeleccionada(null);
            setPagoInfo(undefined);
          }}
          plaza={plazaSeleccionada}
          reservaInfo={getReservaActual(plazaSeleccionada.id)}
          pagoInfo={pagoInfo}
          onCrearReserva={handleCrearReserva}
          onEliminarReserva={handleEliminarReserva}
          tarifas={tarifas}
        />
      )}
    </div>
  );
} 
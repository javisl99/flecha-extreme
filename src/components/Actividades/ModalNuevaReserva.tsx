import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useActividades, ActividadDB, TarifaActividad } from '@/hooks/useActividades';
import PagoReservaModal from './PagoReservaModal';

interface ModalNuevaReservaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    empresa: 'Flecha Extreme' | 'Rober';
    tipoActividad: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
    actividad: string;
    cantidadReservada: number;
    numeroPersonas: number;
    precio: number;
    fechaInicio: string;
    fechaFin: string;
    horaInicio: string;
    horaFin: string;
    nota?: string;
  }) => void;
  onToast: (toast: { visible: boolean; message: string; type: 'success' | 'error' }) => void;
}

export default function ModalNuevaReserva({ 
  isOpen, 
  onClose, 
  onSubmit,
  onToast
}: ModalNuevaReservaProps) {
  const { obtenerActividadesPorTipo, obtenerTarifasActividad, consultarStockDisponible, loadingActividades, error: errorActividades } = useActividades();
  
  const [formData, setFormData] = useState({
    empresa: 'Flecha Extreme' as 'Flecha Extreme' | 'Rober',
    tipoActividad: 'alquiler' as 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros',
    actividad: '',
    duracion: '',
    cantidadReservada: 1,
    numeroPersonas: 1,
    precio: 0,
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '09:00',
    horaFin: '',
    nota: ''
  });

  const [actividadesExistentes, setActividadesExistentes] = useState<ActividadDB[]>([]);
  const [tipoCargado, setTipoCargado] = useState<string>('');
  const [tarifasActividad, setTarifasActividad] = useState<TarifaActividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadDB | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [stockInfo, setStockInfo] = useState<{
    stockDisponible: number;
    stockTotal: number;
    reservadas: number;
  } | null>(null);
  const [consultandoStock, setConsultandoStock] = useState(false);

  // Función para consultar stock disponible
  const consultarStock = async (actividadId: string, fecha: string, horaInicio?: string, horaFin?: string) => {
    if (!actividadId || !fecha) {
      setStockInfo(null);
      return;
    }

    try {
      setConsultandoStock(true);
      const resultado = await consultarStockDisponible(actividadId, fecha, horaInicio, horaFin);
      
      if (resultado.success && resultado.stockDisponible !== undefined) {
        setStockInfo({
          stockDisponible: resultado.stockDisponible,
          stockTotal: resultado.stockTotal || 0,
          reservadas: resultado.reservadas || 0
        });
      } else {
        setStockInfo(null);
        console.error('Error al consultar stock:', resultado.message);
      }
    } catch (error) {
      console.error('Error al consultar stock:', error);
      setStockInfo(null);
    } finally {
      setConsultandoStock(false);
    }
  };

  // Función para generar datos de actividad para PagoReservaModal
  const generarDatosActividad = () => {
    return {
      id: actividadSeleccionada?.id || `actividad-${Date.now()}`,
      nombre: formData.actividad,
      precio: formData.precio,
      cantidad: formData.cantidadReservada,
      duracion: formData.duracion,
      empresa: formData.empresa,
      numeroPersonas: formData.numeroPersonas,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      nota: formData.nota
    };
  };

  // Función para calcular la hora de fin basándose en la duración
  const calcularHoraFin = (horaInicio: string, duracion: string): string => {
    if (!horaInicio || !duracion) return '';

    const [duracionValor, duracionUnidad] = duracion.split('-');
    const valor = parseInt(duracionValor);
    const unidad = duracionUnidad.toLowerCase();

    // Convertir hora de inicio a minutos desde medianoche
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const minutosInicio = horas * 60 + minutos;

    // Calcular duración en minutos
    let duracionMinutos = 0;
    if (unidad === 'hora' || unidad === 'horas') {
      duracionMinutos = valor * 60;
    } else if (unidad === 'minuto' || unidad === 'minutos') {
      duracionMinutos = valor;
    }

    // Calcular hora de fin
    const minutosFin = minutosInicio + duracionMinutos;
    const horasFin = Math.floor(minutosFin / 60);
    const minutosRestantes = minutosFin % 60;

    // Formatear la hora de fin
    const horaFormateada = horasFin.toString().padStart(2, '0');
    const minutosFormateados = minutosRestantes.toString().padStart(2, '0');

    return `${horaFormateada}:${minutosFormateados}`;
  };

  // Cargar actividades cuando cambie el tipo
  useEffect(() => {
    const cargarActividades = async () => {
      if (formData.tipoActividad && isOpen && formData.tipoActividad !== tipoCargado) {
        try {
          const actividades = await obtenerActividadesPorTipo(formData.tipoActividad);
          setActividadesExistentes(actividades);
          setTipoCargado(formData.tipoActividad);
        } catch (error) {
          setActividadesExistentes([]);
        }
      }
    };

    cargarActividades();
  }, [formData.tipoActividad, isOpen, obtenerActividadesPorTipo, tipoCargado]);

  const handleInputChange = async (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calcular hora de fin si cambia la duración o la hora de inicio
      if ((field === 'duracion' || field === 'horaInicio') && newData.duracion && newData.horaInicio) {
        newData.horaFin = calcularHoraFin(newData.horaInicio, newData.duracion);
      } else if (field === 'duracion' && !newData.duracion) {
        newData.horaFin = '';
      }
      
      // Calcular precio cuando se selecciona una duración
      if (field === 'duracion' && newData.duracion) {
        const tarifaSeleccionada = tarifasActividad.find(tarifa => 
          `${tarifa.duracion_valor}-${tarifa.duracion_unidad}` === newData.duracion
        );
        if (tarifaSeleccionada) {
          newData.precio = tarifaSeleccionada.precio * newData.numeroPersonas;
        }
      } else if (field === 'duracion' && !newData.duracion) {
        newData.precio = 0;
      }
      
      return newData;
    });
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Si cambia el tipo de actividad, limpiar la actividad seleccionada y resetear el tipo cargado
    if (field === 'tipoActividad') {
      setFormData(prev => ({ ...prev, actividad: '', duracion: '', horaFin: '', precio: 0 }));
      setTipoCargado('');
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setStockInfo(null);
    }
    
    // Si cambia el nombre de la actividad, cargar las tarifas
    if (field === 'actividad' && value) {
      const actividad = actividadesExistentes.find(a => a.nombre === value);
      if (actividad) {
        setActividadSeleccionada(actividad);
        const tarifas = await obtenerTarifasActividad(actividad.id);
        setTarifasActividad(tarifas);
        
        // Consultar stock si ya hay fecha, hora de inicio y duración seleccionadas
        if (formData.fechaInicio && formData.horaInicio && formData.duracion) {
          const horaFinCalculada = calcularHoraFin(formData.horaInicio, formData.duracion);
          if (horaFinCalculada) {
            await consultarStock(actividad.id, formData.fechaInicio, formData.horaInicio, horaFinCalculada);
          }
        }
        
        // El precio se calculará cuando se seleccione una duración
        
        // Si solo hay una tarifa, establecerla automáticamente
        if (tarifas.length === 1) {
          const duracion = `${tarifas[0].duracion_valor}-${tarifas[0].duracion_unidad}`;
          const precioCalculado = tarifas[0].precio * formData.numeroPersonas;
          setFormData(prev => {
            const newData = { ...prev, duracion, precio: precioCalculado };
            // Calcular hora de fin si ya hay hora de inicio
            if (newData.horaInicio) {
              newData.horaFin = calcularHoraFin(newData.horaInicio, duracion);
            }
            return newData;
          });
        }
      }
    } else if (field === 'actividad' && !value) {
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setStockInfo(null);
      setFormData(prev => ({ ...prev, duracion: '', horaFin: '', precio: 0 }));
    }
    
    // Si cambia la fecha de inicio, consultar stock si hay actividad, hora de inicio y duración seleccionadas
    if (field === 'fechaInicio' && value && actividadSeleccionada) {
      if (formData.horaInicio && formData.duracion) {
        const horaFinCalculada = calcularHoraFin(formData.horaInicio, formData.duracion);
        if (horaFinCalculada) {
          await consultarStock(actividadSeleccionada.id, value, formData.horaInicio, horaFinCalculada);
        }
      }
    } else if (field === 'fechaInicio' && !value) {
      setStockInfo(null);
    }
    
    // Si cambia la hora de inicio, consultar stock si hay actividad, fecha y duración seleccionadas
    if (field === 'horaInicio' && value && actividadSeleccionada && formData.fechaInicio && formData.duracion) {
      // Calcular la hora de fin basada en la duración y la nueva hora de inicio
      const nuevaHoraFin = calcularHoraFin(value, formData.duracion);
      if (nuevaHoraFin) {
        await consultarStock(actividadSeleccionada.id, formData.fechaInicio, value, nuevaHoraFin);
      }
    }
    
    // Si cambia la hora de fin manualmente, consultar stock si hay actividad, fecha y duración seleccionadas
    if (field === 'horaFin' && value && actividadSeleccionada && formData.fechaInicio && formData.duracion) {
      if (formData.horaInicio && value) {
        await consultarStock(actividadSeleccionada.id, formData.fechaInicio, formData.horaInicio, value);
      }
    }
    
    // Si cambia la duración, consultar stock si hay actividad, fecha y hora seleccionadas
    if (field === 'duracion' && value && actividadSeleccionada && formData.fechaInicio && formData.horaInicio) {
      // Calcular la nueva hora de fin basada en la duración
      const nuevaHoraFin = calcularHoraFin(formData.horaInicio, value);
      if (nuevaHoraFin) {
        await consultarStock(actividadSeleccionada.id, formData.fechaInicio, formData.horaInicio, nuevaHoraFin);
      }
    } else if (field === 'duracion' && !value) {
      setStockInfo(null);
    }
    
    // Si cambia el número de personas, recalcular precio
    if (field === 'numeroPersonas' && formData.duracion) {
      const tarifaSeleccionada = tarifasActividad.find(tarifa => 
        `${tarifa.duracion_valor}-${tarifa.duracion_unidad}` === formData.duracion
      );
      if (tarifaSeleccionada) {
        const precioCalculado = tarifaSeleccionada.precio * value;
        setFormData(prev => ({ ...prev, precio: precioCalculado }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresa) {
      newErrors.empresa = 'La empresa es obligatoria';
    }

    if (!formData.tipoActividad) {
      newErrors.tipoActividad = 'El tipo de actividad es obligatorio';
    }

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es obligatoria';
    }

    if (tarifasActividad.length > 1 && !formData.duracion) {
      newErrors.duracion = 'La duración es obligatoria';
    } else if (tarifasActividad.length === 1 && !formData.duracion) {
      newErrors.duracion = 'Error al cargar la duración de la actividad';
    }

    if (!formData.cantidadReservada || formData.cantidadReservada < 1) {
      newErrors.cantidadReservada = 'La cantidad debe ser al menos 1';
    }

    if (!formData.numeroPersonas || formData.numeroPersonas < 1) {
      newErrors.numeroPersonas = 'El número de personas debe ser al menos 1';
    }

    if (formData.numeroPersonas > 15) {
      newErrors.numeroPersonas = 'El número máximo de personas es 15';
    }

    // Validación de stock disponible
    if (stockInfo && stockInfo.stockDisponible < formData.cantidadReservada) {
      newErrors.cantidadReservada = `Solo hay ${stockInfo.stockDisponible} unidades disponibles. Stock total: ${stockInfo.stockTotal}, Reservadas: ${stockInfo.reservadas}`;
    }

    if (stockInfo && stockInfo.stockDisponible === 0) {
      newErrors.actividad = 'No hay stock disponible para esta actividad en la fecha seleccionada';
    }

    // El precio se calcula automáticamente, no necesita validación

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es obligatoria';
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es obligatoria';
    } else if (formData.fechaInicio === new Date().toISOString().split('T')[0]) {
      // Si la fecha seleccionada es hoy, validar que la hora no sea anterior a la actual
      const horaActual = new Date().toTimeString().substring(0, 5);
      if (formData.horaInicio < horaActual) {
        newErrors.horaInicio = 'No se puede seleccionar una hora anterior a la hora actual';
      }
    }

    // Validar que la fecha de fin sea posterior o igual a la fecha de inicio
    if (formData.fechaInicio && formData.fechaFin && formData.fechaFin < formData.fechaInicio) {
      newErrors.fechaFin = 'La fecha de fin debe ser igual o posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Abrir modal de pago
    setShowModalPago(true);
  };

  // Función para manejar el envío del pago desde PagoReservaModal
  const handlePagoSubmit = async (data: {
    actividad: {
      id: string;
      nombre: string;
      precio: number;
      cantidad: number;
      duracion: string;
      empresa: string;
      numeroPersonas: number;
      fechaInicio: string;
      fechaFin: string;
      horaInicio: string;
      horaFin: string;
      nota?: string;
    };
    subtotal: number;
    descuento: number;
    descuentoPorcentaje: number;
    iva: number;
    total: number;
    concepto: string;
    pago: {
      metodo: string;
      estado: string;
    };
  }) => {
    try {
      // Aquí iría la lógica para crear la reserva y el pago en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mostrar notificación de éxito
      const toastData = {
        visible: true,
        message: 'Reserva y pago creados exitosamente',
        type: 'success' as const
      };
      onToast(toastData);

      // Llamar al callback del componente padre
      onSubmit({
        empresa: formData.empresa,
        tipoActividad: formData.tipoActividad,
        actividad: formData.actividad,
        cantidadReservada: formData.cantidadReservada,
        numeroPersonas: formData.numeroPersonas,
        precio: formData.precio,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        nota: formData.nota || undefined
      });

      // Resetear formulario
      setFormData({
        empresa: 'Flecha Extreme',
        tipoActividad: 'alquiler',
        actividad: '',
        duracion: '',
        cantidadReservada: 1,
        numeroPersonas: 1,
        precio: 0,
        fechaInicio: '',
        fechaFin: '',
        horaInicio: '09:00',
        horaFin: '',
        nota: ''
      });
      setActividadesExistentes([]);
      setTipoCargado('');
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setStockInfo(null);
      setErrors({});
      
      // No cerrar automáticamente - dejar que el usuario cierre el ticket manualmente
      // setShowModalPago(false);
      // onClose();
    } catch (error) {
      console.error('Error al procesar el pago:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      empresa: 'Flecha Extreme',
      tipoActividad: 'alquiler',
      actividad: '',
      duracion: '',
      cantidadReservada: 1,
      numeroPersonas: 1,
      precio: 0,
      fechaInicio: '',
      fechaFin: '',
      horaInicio: '09:00',
      horaFin: '',
      nota: ''
    });
    setActividadesExistentes([]);
    setTipoCargado('');
    setTarifasActividad([]);
    setActividadSeleccionada(null);
    setStockInfo(null);
    setErrors({});
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header azul */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
                  >
                    Nueva Reserva
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 cursor-pointer"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Contenido del modal */}
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Primera fila - Empresa y Tipo de Actividad */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Empresa */}
                      <div>
                        <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Empresa *
                        </label>
                        <select
                          id="empresa"
                          value={formData.empresa}
                          onChange={(e) => handleInputChange('empresa', e.target.value as 'Flecha Extreme' | 'Rober')}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            errors.empresa 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
                        >
                          <option value="Flecha Extreme">Flecha Extreme</option>
                          <option value="Rober">Rober</option>
                        </select>
                        {errors.empresa && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>
                        )}
                      </div>

                      {/* Tipo de Actividad */}
                      <div>
                        <label htmlFor="tipoActividad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de Actividad *
                        </label>
                        <select
                          id="tipoActividad"
                          value={formData.tipoActividad}
                          onChange={(e) => handleInputChange('tipoActividad', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            errors.tipoActividad 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
                        >
                          <option value="alquiler">Alquiler</option>
                          <option value="curso">Curso</option>
                          <option value="ruta">Ruta</option>
                          <option value="campamento">Campamento</option>
                          <option value="sport">Sport</option>
                          <option value="parking">Parking</option>
                          <option value="otros">Otros</option>
                        </select>
                        {errors.tipoActividad && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipoActividad}</p>
                        )}
                      </div>
                    </div>

                    {/* Segunda fila - Duración y Actividad */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Duración */}
                      <div>
                        {tarifasActividad.length >= 1 ? (
                          <>
                            <label htmlFor="duracion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Duración *
                            </label>
                            <select
                              id="duracion"
                              value={formData.duracion || ''}
                              onChange={(e) => handleInputChange('duracion', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer ${
                                errors.duracion 
                                  ? 'border-red-300 dark:border-red-600' 
                                  : 'border-gray-300 dark:border-gray-600'
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                            >
                              <option value="">Selecciona una duración</option>
                              {tarifasActividad.map((tarifa, index) => {
                                const unidad = tarifa.duracion_valor > 1 
                                  ? tarifa.duracion_unidad + 's' 
                                  : tarifa.duracion_unidad;
                                return (
                                  <option key={index} value={`${tarifa.duracion_valor}-${tarifa.duracion_unidad}`}>
                                    {tarifa.duracion_valor} {unidad}
                                    {tarifa.descuento && ` (Descuento: ${tarifa.descuento}%)`}
                                  </option>
                                );
                              })}
                            </select>
                            {errors.duracion && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duracion}</p>
                            )}
                          </>
                        ) : (
                          <>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Duración *
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                              Seleccione una actividad
                            </div>
                          </>
                        )}
                      </div>

                      {/* Actividad */}
                      <div>
                        <label htmlFor="actividad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Actividad *
                        </label>
                        <select
                          id="actividad"
                          value={formData.actividad}
                          onChange={(e) => handleInputChange('actividad', e.target.value)}
                          disabled={loadingActividades}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            errors.actividad 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="">
                            {loadingActividades 
                              ? 'Cargando actividades...' 
                              : actividadesExistentes.length === 0 
                                ? 'No hay actividades de este tipo' 
                                : 'Selecciona una actividad'
                            }
                          </option>
                          {actividadesExistentes.map((actividad) => (
                            <option key={actividad.id} value={actividad.nombre}>
                              {actividad.nombre}
                            </option>
                          ))}
                        </select>
                        {errors.actividad && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actividad}</p>
                        )}
                        {errorActividades && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            Error al cargar actividades: {errorActividades}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tercera fila - Fechas */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Fecha de Inicio */}
                      <div>
                        <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          id="fechaInicio"
                          value={formData.fechaInicio}
                          onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            errors.fechaInicio 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                        />
                        {errors.fechaInicio && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p>
                        )}
                      </div>

                      {/* Fecha de Fin */}
                      <div>
                        <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Fin *
                        </label>
                        <input
                          type="date"
                          id="fechaFin"
                          value={formData.fechaFin}
                          onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                          min={formData.fechaInicio || undefined}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            errors.fechaFin 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                        />
                        {errors.fechaFin && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaFin}</p>
                        )}
                      </div>
                    </div>

                    {/* Cuarta fila - Horas */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Hora de Inicio */}
                      <div>
                        <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Hora de Inicio *
                        </label>
                        <input
                          type="time"
                          id="horaInicio"
                          value={formData.horaInicio}
                          onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                          disabled={!formData.fechaInicio}
                          min={formData.fechaInicio === new Date().toISOString().split('T')[0] ? new Date().toTimeString().substring(0, 5) : undefined}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            !formData.fechaInicio 
                              ? 'cursor-not-allowed opacity-50' 
                              : 'cursor-pointer'
                          } ${
                            errors.horaInicio 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                        {errors.horaInicio && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaInicio}</p>
                        )}
                      </div>

                       {/* Hora de Fin */}
                       <div>
                         <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Hora de Fin
                         </label>
                         <input
                           type="text"
                           id="horaFin"
                           value={formData.horaFin || ''}
                           disabled
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                           placeholder="09:00"
                         />
                       </div>
                    </div>

                    {/* Quinta fila - Cantidad Reservada, Número de Personas y Precio */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* Cantidad Reservada */}
                      <div>
                        <label htmlFor="cantidadReservada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cantidad Reservada *
                        </label>
                        <input
                          type="number"
                          id="cantidadReservada"
                          min="1"
                          value={formData.cantidadReservada}
                          onChange={(e) => handleInputChange('cantidadReservada', parseInt(e.target.value) || 1)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            errors.cantidadReservada 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                          placeholder="1"
                        />
                        {errors.cantidadReservada && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cantidadReservada}</p>
                        )}
                        
                        {/* Información de stock */}
                        {stockInfo && (
                          <div className={`mt-2 p-2 rounded-md ${
                            stockInfo.stockDisponible > 0 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          }`}>
                            <div className={`text-xs ${
                              stockInfo.stockDisponible > 0 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              <div className="flex justify-between">
                                <span>Stock disponible:</span>
                                <span className={`font-medium ${stockInfo.stockDisponible > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {stockInfo.stockDisponible}
                                </span>
                              </div>
                              <div className={`flex justify-between ${
                                stockInfo.stockDisponible > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                <span>Total:</span>
                                <span>{stockInfo.stockTotal}</span>
                              </div>
                              <div className={`flex justify-between ${
                                stockInfo.stockDisponible > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                <span>Reservadas:</span>
                                <span>{stockInfo.reservadas}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {consultandoStock && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Consultando stock disponible...
                          </div>
                        )}
                      </div>

                      {/* Número de Personas */}
                      <div>
                        <label htmlFor="numeroPersonas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número de Personas *
                        </label>
                        <input
                          type="number"
                          id="numeroPersonas"
                          min="1"
                          max="15"
                          value={formData.numeroPersonas}
                          onChange={(e) => handleInputChange('numeroPersonas', parseInt(e.target.value) || 1)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                            errors.numeroPersonas 
                              ? 'border-red-300 dark:border-red-600' 
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                          placeholder="1"
                        />
                        {errors.numeroPersonas && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numeroPersonas}</p>
                        )}
                      </div>

                      {/* Precio */}
                      <div>
                        <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Precio Total (€)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="precio"
                            value={formData.precio > 0 ? formData.precio.toFixed(2) : '0.00'}
                            disabled
                            className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            placeholder="0.00"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nota */}
                    <div>
                      <label htmlFor="nota" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nota
                      </label>
                      <textarea
                        id="nota"
                        rows={3}
                        value={formData.nota}
                        onChange={(e) => handleInputChange('nota', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Notas adicionales sobre la reserva..."
                      />
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Creando...' : 'Crear Reserva'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      {/* Modal de Pago de Reserva */}
      <PagoReservaModal
        isOpen={showModalPago}
        onClose={() => setShowModalPago(false)}
        onSubmit={handlePagoSubmit}
        actividad={generarDatosActividad()}
      />
    </Transition>
  );
}

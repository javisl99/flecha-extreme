import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useActividades, ActividadDB, TarifaActividad } from '@/hooks/useActividades';
import { Toast } from '@/shared/components';
import { SelectorCliente } from './SelectorCliente';

interface ModalNuevaActividadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
    numeroPersonas: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    requiereReserva: boolean;
    precioReserva?: number;
    clienteId?: string | null;
  }) => void;
  onToast: (toast: { visible: boolean; message: string; type: 'success' | 'error' }) => void;
}

export default function ModalNuevaActividad({ 
  isOpen, 
  onClose, 
  onSubmit,
  onToast
}: ModalNuevaActividadProps) {
  const { crearActividad, obtenerActividadesPorTipo, obtenerTarifasActividad, loading, loadingActividades, error: errorActividades } = useActividades();
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'alquiler' as 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros',
    numeroPersonas: 1,
    duracion: '',
    fecha: '',
    horaInicio: '09:00',
    horaFin: ''
  });

  const [actividadesExistentes, setActividadesExistentes] = useState<ActividadDB[]>([]);
  const [tipoCargado, setTipoCargado] = useState<string>('');
  const [tarifasActividad, setTarifasActividad] = useState<TarifaActividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadDB | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  // Cargar actividades cuando cambie el tipo
  useEffect(() => {
    const cargarActividades = async () => {
      if (formData.tipo && isOpen && formData.tipo !== tipoCargado) {
        try {
          const actividades = await obtenerActividadesPorTipo(formData.tipo);
          setActividadesExistentes(actividades);
          setTipoCargado(formData.tipo);
        } catch (error) {
          setActividadesExistentes([]);
        }
      }
    };

    cargarActividades();
  }, [formData.tipo, isOpen, obtenerActividadesPorTipo, tipoCargado]);

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

  const handleInputChange = async (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calcular hora de fin si cambia la duración o la hora de inicio
      if ((field === 'duracion' || field === 'horaInicio') && newData.duracion && newData.horaInicio) {
        newData.horaFin = calcularHoraFin(newData.horaInicio, newData.duracion);
      } else if (field === 'duracion' && !newData.duracion) {
        newData.horaFin = '';
      }
      
      return newData;
    });
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Si cambia el tipo, limpiar el nombre seleccionado y resetear el tipo cargado
    if (field === 'tipo') {
      setFormData(prev => ({ ...prev, nombre: '', duracion: '', horaFin: '' }));
      setTipoCargado('');
      setTarifasActividad([]);
      setActividadSeleccionada(null);
    }
    
    // Si cambia el nombre de la actividad, cargar las tarifas
    if (field === 'nombre' && value) {
      const actividad = actividadesExistentes.find(a => a.nombre === value);
      if (actividad) {
        setActividadSeleccionada(actividad);
        const tarifas = await obtenerTarifasActividad(actividad.id);
        setTarifasActividad(tarifas);
        
        // Si solo hay una tarifa, establecerla automáticamente
        if (tarifas.length === 1) {
          const duracion = `${tarifas[0].duracion_valor}-${tarifas[0].duracion_unidad}`;
          setFormData(prev => {
            const newData = { ...prev, duracion };
            // Calcular hora de fin si ya hay hora de inicio
            if (newData.horaInicio) {
              newData.horaFin = calcularHoraFin(newData.horaInicio, duracion);
            }
            return newData;
          });
        }
      }
    } else if (field === 'nombre' && !value) {
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setFormData(prev => ({ ...prev, duracion: '', horaFin: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.numeroPersonas || formData.numeroPersonas < 1) {
      newErrors.numeroPersonas = 'El número de personas debe ser al menos 1';
    }

    if (formData.numeroPersonas > 15) {
      newErrors.numeroPersonas = 'El número máximo de personas es 15';
    }

    if (tarifasActividad.length > 1 && !formData.duracion) {
      newErrors.duracion = 'La duración es obligatoria';
    } else if (tarifasActividad.length === 1 && !formData.duracion) {
      newErrors.duracion = 'Error al cargar la duración de la actividad';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es obligatoria';
    }

    if (!formData.horaFin) {
      newErrors.horaFin = 'La hora de fin es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Preparar datos para la base de datos
    const actividadData = {
      nombre: formData.nombre,
      tipo: formData.tipo,
      numeroPersonas: formData.numeroPersonas,
      fecha: formData.fecha,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      clienteId: clienteId
    };

    // Crear actividad en la base de datos
    const result = await crearActividad(actividadData);

    // Mostrar notificación
    const toastData = {
      visible: true,
      message: result.message,
      type: result.success ? 'success' as const : 'error' as const
    };
    setToast(toastData);
    onToast(toastData);

    if (result.success) {
      // Resetear formulario solo si fue exitoso
      setFormData({
        nombre: '',
        tipo: 'alquiler',
        numeroPersonas: 1,
        duracion: '',
        fecha: '',
        horaInicio: '09:00',
        horaFin: ''
      });
      setActividadesExistentes([]);
      setTipoCargado('');
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setClienteId(null);
      setErrors({});
      
      // Llamar al callback del componente padre
      onSubmit({
        nombre: formData.nombre,
        tipo: formData.tipo,
        numeroPersonas: formData.numeroPersonas,
        fecha: formData.fecha,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        requiereReserva: false,
        precioReserva: undefined,
        clienteId: clienteId
      });
      
      // Cerrar modal inmediatamente
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      tipo: 'alquiler',
      numeroPersonas: 1,
      duracion: '',
      fecha: '',
      horaInicio: '09:00',
      horaFin: ''
    });
    setActividadesExistentes([]);
    setTipoCargado('');
    setTarifasActividad([]);
    setActividadSeleccionada(null);
    setClienteId(null);
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header azul */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
                  >
                    Nueva Actividad
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
                  {/* Selector de Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cliente *
                    </label>
                    <SelectorCliente
                      selectedClienteId={clienteId}
                      onClienteChange={setClienteId}
                      placeholder="Seleccionar cliente (opcional)"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Actividad *
                    </label>
                    <select
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer"
                    >
                      <option value="alquiler">Alquiler</option>
                      <option value="curso">Curso</option>
                      <option value="ruta">Ruta</option>
                      <option value="campamento">Campamento</option>
                      <option value="sport">Sport</option>
                      <option value="parking">Parking</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>
                  
                  {/* Nombre */}
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Actividad *
                    </label>
                    <select
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      disabled={loadingActividades}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.nombre 
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
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
                    )}
                    {errorActividades && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        Error al cargar actividades: {errorActividades}
                      </p>
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

                  {/* Duración */}
                  {tarifasActividad.length > 1 && (
                    <div>
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
                              {tarifa.duracion_valor} {unidad} - €{tarifa.precio}
                              {tarifa.descuento && ` (Descuento: ${tarifa.descuento}%)`}
                            </option>
                          );
                        })}
                      </select>
                      {errors.duracion && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duracion}</p>
                      )}
                    </div>
                  )}

                  {/* Fecha */}
                  <div>
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      id="fecha"
                      value={formData.fecha}
                      onChange={(e) => handleInputChange('fecha', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.fecha 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    />
                    {errors.fecha && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fecha}</p>
                    )}
                  </div>

                  {/* Horas */}
                  <div className="grid grid-cols-2 gap-4">
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
                        disabled={!formData.fecha}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                          !formData.fecha 
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
                         Hora de Fin *
                       </label>
                       <input
                         type="text"
                         id="horaFin"
                         value={formData.horaFin || '09:00'}
                         disabled
                         className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                           errors.horaFin 
                             ? 'border-red-300 dark:border-red-600' 
                             : 'border-gray-300 dark:border-gray-600'
                         } bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
                         placeholder="Se calcula automáticamente"
                       />
                       {errors.horaFin && (
                         <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaFin}</p>
                       )}
                     </div>
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
                      {loading ? 'Creando...' : 'Crear Actividad'}
                    </button>
                  </div>
                </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

    </Transition>
  );
}

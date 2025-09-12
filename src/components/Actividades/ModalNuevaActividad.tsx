import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useActividades } from '@/hooks/useActividades';
import { Toast } from '@/shared/components';

interface ModalNuevaActividadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento';
    requiereReserva: boolean;
    precioReserva?: number;
  }) => void;
  onToast: (toast: { visible: boolean; message: string; type: 'success' | 'error' }) => void;
}

export default function ModalNuevaActividad({ 
  isOpen, 
  onClose, 
  onSubmit,
  onToast
}: ModalNuevaActividadProps) {
  const { crearActividad, loading } = useActividades();
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'alquiler' as 'alquiler' | 'curso' | 'ruta' | 'campamento',
    requiereReserva: false,
    precioReserva: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (formData.requiereReserva && (!formData.precioReserva || formData.precioReserva <= 0)) {
      newErrors.precioReserva = 'El precio de reserva debe ser mayor a 0';
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
      reserva: formData.requiereReserva,
      precio_reserva: formData.requiereReserva ? formData.precioReserva : undefined
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
        requiereReserva: false,
        precioReserva: 0
      });
      setErrors({});
      
      // Llamar al callback del componente padre
      onSubmit({
        nombre: formData.nombre,
        tipo: formData.tipo,
        requiereReserva: formData.requiereReserva,
        precioReserva: formData.requiereReserva ? formData.precioReserva : undefined
      });
      
      // Cerrar modal inmediatamente
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      tipo: 'alquiler',
      requiereReserva: false,
      precioReserva: 0
    });
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Nueva Actividad
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre de la Actividad *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.nombre 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                      placeholder="Ej: Kayak"
                    />
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
                    )}
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
                    </select>
                  </div>

                  {/* Requiere Reserva */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="requiereReserva" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Requiere Reserva
                      </label>
                      <button
                        type="button"
                        onClick={() => handleInputChange('requiereReserva', !formData.requiereReserva)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer ${
                          formData.requiereReserva ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.requiereReserva ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Activar si esta actividad requiere reserva previa
                    </p>
                  </div>

                  {/* Precio de Reserva (solo si requiere reserva) */}
                  {formData.requiereReserva && (
                    <div>
                      <label htmlFor="precioReserva" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Precio de Reserva (€) *
                      </label>
                      <input
                        type="number"
                        id="precioReserva"
                        min="0"
                        step="0.01"
                        value={formData.precioReserva}
                        onChange={(e) => handleInputChange('precioReserva', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors.precioReserva 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                        placeholder="0.00"
                      />
                      {errors.precioReserva && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precioReserva}</p>
                      )}
                    </div>
                  )}

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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

    </Transition>
  );
}

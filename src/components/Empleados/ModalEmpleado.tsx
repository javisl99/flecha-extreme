import { useState, useEffect } from 'react';
import { Card, Button } from '@/shared/components';
import { useEmpleados, type Empleado } from '@/hooks/useEmpleados';
import { toast } from 'react-hot-toast';

interface ModalEmpleadoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (empleado: Empleado) => void;
  modo: 'nuevo' | 'editar';
  empleado?: Empleado;
}

export default function ModalEmpleado({ isOpen, onClose, onSuccess, modo, empleado }: ModalEmpleadoProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const { crearEmpleado, actualizarEmpleado } = useEmpleados();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isOpen) {
      setShouldRender(true);
      // Pequeño retraso para asegurar que el DOM se actualice antes de la animación
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  // Inicializa el formulario si es edición
  useEffect(() => {
    if (modo === 'editar' && empleado) {
      setFormData({
        nombre: String(empleado.nombre || ''),
        apellidos: String(empleado.apellidos || ''),
        email: String(empleado.email || ''),
        movil: String(empleado.movil || ''),
        dni: String(empleado.dni || '')
      });
    } else if (modo === 'nuevo') {
      setFormData({ nombre: '', apellidos: '', email: '', movil: '', dni: '' });
    }
  }, [modo, empleado, isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son obligatorios';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!formData.movil.trim()) {
      newErrors.movil = 'El teléfono es obligatorio';
    } else if (!/^\d{9}$/.test(formData.movil)) {
      newErrors.movil = 'El teléfono debe tener 9 dígitos';
    }
    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es obligatorio';
    } else if (!/^\d{8}[A-Z]$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 8 números y una letra mayúscula';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      let error;
      let data = null;
      if (modo === 'nuevo') {
        const result = await crearEmpleado({ ...formData });
        error = result.error;
        data = result.data;
      } else if (modo === 'editar' && empleado) {
        const result = await actualizarEmpleado(empleado.id, { ...formData });
        error = result.error;
        data = result.data;
      }
      if (error) throw error;
      
      toast.success(modo === 'nuevo' ? 'Empleado creado correctamente' : 'Empleado actualizado correctamente');
      if (data) onSuccess(data);
      handleClose();
    } catch (err) {
      console.error(modo === 'nuevo' ? 'Error al crear el empleado:' : 'Error al actualizar el empleado:', err);
      setErrors({ submit: modo === 'nuevo' ? 'Error al crear el empleado.' : 'Error al actualizar el empleado.' });
      toast.error(modo === 'nuevo' ? 'Error al crear el empleado.' : 'Error al actualizar el empleado.');
    } finally {
      setLoading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div
        className={`fixed inset-0 z-50 overflow-y-auto`}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all w-full max-w-lg ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <form onSubmit={handleSubmit}>
              <div className="bg-primary px-6 py-4 flex justify-between items-center rounded-t-lg">
                <h3 className="text-xl font-bold text-white">
                  {modo === 'nuevo' ? 'Nuevo Empleado' : 'Editar Empleado'}
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.nombre
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                      } dark:bg-gray-700`}
                    />
                    {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.apellidos
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                      } dark:bg-gray-700`}
                    />
                    {errors.apellidos && <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                      } dark:bg-gray-700`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Móvil */}
                  <div>
                    <label htmlFor="movil" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="movil"
                      value={formData.movil}
                      onChange={(e) => setFormData({ ...formData, movil: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.movil
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                      } dark:bg-gray-700`}
                    />
                    {errors.movil && <p className="mt-1 text-sm text-red-600">{errors.movil}</p>}
                  </div>

                  {/* DNI */}
                  <div>
                    <label htmlFor="dni" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      DNI
                    </label>
                    <input
                      type="text"
                      id="dni"
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.dni
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                      } dark:bg-gray-700`}
                    />
                    {errors.dni && <p className="mt-1 text-sm text-red-600">{errors.dni}</p>}
                  </div>

                  {errors.submit && (
                    <p className="text-sm text-red-600 mt-2">{errors.submit}</p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={loading}
                >
                  {modo === 'nuevo' ? 'Crear' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 
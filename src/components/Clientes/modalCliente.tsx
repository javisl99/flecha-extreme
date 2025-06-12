import { useState, useEffect } from 'react';
import { Card, Button, Toast } from '@/shared/components';
import { useClientes } from '@/hooks/useClientes';
import { Cliente } from '@/shared/types';

interface ModalClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cliente: Cliente) => void;
  modo: 'nuevo' | 'editar';
  cliente?: Cliente;
}

// Validación de teléfono español (9 dígitos)
const validarTelefono = (movil: string): boolean => {
  const regexTelefono = /^[6-9]\d{8}$/;
  return regexTelefono.test(movil);
};

// Validación de DNI/NIF español
const validarDNI = (dni: string): boolean => {
  const regexDNI = /^[0-9]{8}[A-Z]$/;
  const regexNIF = /^[A-Z][0-9]{7}[A-Z]$/;
  return regexDNI.test(dni) || regexNIF.test(dni);
};

export default function ModalCliente({ isOpen, onClose, onSuccess, modo, cliente }: ModalClienteProps) {
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
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });

  // Inicializar el hook con filtros vacíos ya que solo lo necesitamos para crear
  const { crearCliente, actualizarCliente } = useClientes({
    busqueda: '',
    ordenarPor: 'nombre',
    direccion: 'asc'
  });

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
    if (modo === 'editar' && cliente) {
      setFormData({
        nombre: String(cliente.nombre || ''),
        apellidos: String(cliente.apellidos || ''),
        email: String(cliente.email || ''),
        movil: String(cliente.movil || ''),
        dni: String(cliente.dni || '')
      });
    } else if (modo === 'nuevo') {
      setFormData({ nombre: '', apellidos: '', email: '', movil: '', dni: '' });
    }
  }, [modo, cliente, isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Solo cerrar si el clic fue directamente en el backdrop
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar campos requeridos
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son obligatorios';
    if (!formData.email.trim()) newErrors.email = 'El email es obligatorio';
    if (!formData.movil.trim()) newErrors.movil = 'El móvil es obligatorio';
    
    // Validar formato de email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }
    
    // Validar formato de móvil
    if (formData.movil && !validarTelefono(formData.movil)) {
      newErrors.movil = 'El formato del móvil no es válido (9 dígitos empezando por 6, 7, 8 o 9)';
    }
    
    // Validar DNI si se ha proporcionado
    if (formData.dni && !validarDNI(formData.dni)) {
      newErrors.dni = 'El formato del DNI/NIF no es válido';
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
        const result = await crearCliente({ ...formData, movil: formData.movil, fechaRegistro: new Date().toISOString() });
        error = result.error;
        data = result.data;
      } else if (modo === 'editar' && cliente) {
        const result = await actualizarCliente(cliente.id, { ...formData, movil: formData.movil });
        error = result.error;
        data = result.data;
      }
      if (error) throw error;
      setToast({
        message: modo === 'nuevo' ? 'Cliente creado correctamente' : 'Cliente actualizado correctamente',
        type: 'success',
        visible: true
      });
      if (data) onSuccess(data);
      handleClose();
    } catch (err) {
      console.error(modo === 'nuevo' ? 'Error al crear el cliente:' : 'Error al actualizar el cliente:', err);
      setErrors({ submit: modo === 'nuevo' ? 'Error al crear el cliente.' : 'Error al actualizar el cliente.' });
      setToast({
        message: modo === 'nuevo' ? 'Error al crear el cliente.' : 'Error al actualizar el cliente.',
        type: 'error',
        visible: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      >
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg w-full max-w-md transform transition-all duration-300 ease-out shadow-xl ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ 
            transformOrigin: 'center',
            willChange: 'transform, opacity'
          }}
        >
          <Card title={modo === 'nuevo' ? 'Nuevo Cliente' : 'Editar Cliente'} className="m-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Apellidos *
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.apellidos ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
                {errors.apellidos && (
                  <p className="mt-1 text-sm text-red-500">{errors.apellidos}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="movil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Móvil *
                </label>
                <input
                  type="tel"
                  id="movil"
                  name="movil"
                  value={formData.movil}
                  onChange={handleChange}
                  placeholder="6XXXXXXXX"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.movil ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
                {errors.movil && (
                  <p className="mt-1 text-sm text-red-500">{errors.movil}</p>
                )}
              </div>

              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  DNI/NIF
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  placeholder="12345678A o A1234567B"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.dni ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
                {errors.dni && (
                  <p className="mt-1 text-sm text-red-500">{errors.dni}</p>
                )}
              </div>

              {errors.submit && (
                <p className="text-sm text-red-500 text-center">{errors.submit}</p>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (modo === 'nuevo' ? 'Creando...' : 'Guardando...') : (modo === 'nuevo' ? 'Crear Cliente' : 'Guardar Cambios')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
} 
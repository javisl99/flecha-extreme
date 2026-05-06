import { useEffect, useState } from 'react';
import {
  EnvelopeIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  PhoneIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
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
const validarTelefono = (telefono: string): boolean => {
  const regex = /^[6789]\d{8}$/;
  return regex.test(telefono);
};

// Validación de DNI/NIF español
const validarDNI = (dni: string): boolean => {
  const regex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  return regex.test(dni);
};

export default function ModalCliente({ isOpen, onClose, onSuccess, modo, cliente }: ModalClienteProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: '',
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
    visible: false,
  });

  const { crearCliente, actualizarCliente } = useClientes();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen) {
      setShouldRender(true);
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

  useEffect(() => {
    if (modo === 'editar' && cliente) {
      setFormData({
        nombre: String(cliente.nombre || ''),
        apellidos: String(cliente.apellidos || ''),
        email: String(cliente.email || ''),
        movil: String(cliente.movil || ''),
        dni: String(cliente.dni || ''),
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
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'movil') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === 'dni') {
      const upperValue = value.toUpperCase();
      const cleanValue = upperValue.replace(/[^0-9A-Z]/g, '');
      let finalValue = cleanValue;
      if (cleanValue.length > 8) {
        const numbers = cleanValue.slice(0, 8);
        const letter = cleanValue.slice(8, 9).replace(/[^A-Z]/g, '');
        finalValue = numbers + letter;
      }
      setFormData((prev) => ({ ...prev, [name]: finalValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son obligatorios';
    if (!formData.email.trim()) newErrors.email = 'El email es obligatorio';
    if (!formData.movil.trim()) newErrors.movil = 'El móvil es obligatorio';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (formData.movil && !validarTelefono(formData.movil)) {
      newErrors.movil = 'El formato del móvil no es válido (9 dígitos empezando por 6, 7, 8 o 9)';
    }

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
        const result = await crearCliente({
          ...formData,
          movil: formData.movil,
          fechaRegistro: new Date().toISOString(),
        });
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
        visible: true,
      });
      if (data) onSuccess(data);
      handleClose();
    } catch (err) {
      console.error(modo === 'nuevo' ? 'Error al crear el cliente:' : 'Error al actualizar el cliente:', err);
      setErrors({ submit: modo === 'nuevo' ? 'Error al crear el cliente.' : 'Error al actualizar el cliente.' });
      setToast({
        message: modo === 'nuevo' ? 'Error al crear el cliente.' : 'Error al actualizar el cliente.',
        type: 'error',
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!shouldRender) return null;

  const titulo = modo === 'nuevo' ? 'Nuevo Cliente' : 'Editar Cliente';
  const ctaLabel = modo === 'nuevo' ? 'Crear Cliente' : 'Guardar Cambios';

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const inputBaseClassName =
    'h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const inputWithIconClassName = `${inputBaseClassName} pl-10`;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm transition-all duration-300 ease-out sm:items-center ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      >
        <div
          className={`max-h-[90svh] w-full max-w-2xl transform overflow-y-auto rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest shadow-xl transition-all duration-300 ease-out sm:rounded-2xl ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          style={{
            transformOrigin: 'center',
            willChange: 'transform, opacity',
          }}
        >
          <div className="primary-gradient flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-white" />
              <h3 className="font-headline text-xl font-extrabold uppercase tracking-[0.04em] text-white">{titulo}</h3>
            </div>
            <button
              type="button"
              className="rounded-md text-white transition hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              onClick={handleClose}
            >
              <span className="sr-only">Cerrar</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="nombre" className={labelClassName}>
                  Nombre *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`${inputBaseClassName} ${errors.nombre ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="Ej. Alejandro"
                />
                {errors.nombre ? <p className="mt-1 text-xs text-red-600">{errors.nombre}</p> : null}
              </div>

              <div>
                <label htmlFor="apellidos" className={labelClassName}>
                  Apellidos *
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className={`${inputBaseClassName} ${errors.apellidos ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="Ej. Martínez Ruiz"
                />
                {errors.apellidos ? <p className="mt-1 text-xs text-red-600">{errors.apellidos}</p> : null}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClassName}>
                Email *
              </label>
              <div className="relative">
                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputWithIconClassName} ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  placeholder="nombre@ejemplo.com"
                />
              </div>
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="movil" className={labelClassName}>
                  Móvil *
                </label>
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline" />
                  <input
                    type="tel"
                    id="movil"
                    name="movil"
                    value={formData.movil}
                    onChange={handleChange}
                    placeholder="6XXXXXXXX"
                    className={`${inputWithIconClassName} ${errors.movil ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  />
                </div>
                {errors.movil ? <p className="mt-1 text-xs text-red-600">{errors.movil}</p> : null}
              </div>

              <div>
                <label htmlFor="dni" className={labelClassName}>
                  DNI/NIF
                </label>
                <div className="relative">
                  <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="12345678A"
                    className={`${inputWithIconClassName} ${errors.dni ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  />
                </div>
                {errors.dni ? <p className="mt-1 text-xs text-red-600">{errors.dni}</p> : null}
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-accent" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-primary">Aviso de privacidad</p>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    Al crear el cliente se genera su perfil para gestión operativa de clases y pagos, conforme al RGPD vigente.
                  </p>
                </div>
              </div>
            </div>

            {errors.submit ? <p className="text-center text-sm text-red-600">{errors.submit}</p> : null}

            <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="primary-gradient min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-110"
              >
                {ctaLabel}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}

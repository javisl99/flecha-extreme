'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useClientes } from '@/hooks/useClientes';
import type { Cliente } from '@/shared/types';

interface ModalNuevoClientePagoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cliente: Cliente) => void;
}

const DNI_REGEX = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[6789]\d{8}$/;

export default function ModalNuevoClientePago({
  isOpen,
  onClose,
  onSuccess
}: ModalNuevoClientePagoProps) {
  const { crearCliente, buscarClienteDuplicado } = useClientes({ eagerLoad: false });
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    movil: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: '',
        apellidos: '',
        dni: '',
        movil: '',
        email: ''
      });
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let processedValue = value;

    if (field === 'dni') {
      processedValue = value.replace(/[^0-9A-Za-z]/g, '').slice(0, 9).toUpperCase();
    } else if (field === 'movil') {
      processedValue = value.replace(/\D/g, '').slice(0, 9);
    } else if (field === 'email') {
      processedValue = value.trimStart().toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellidos.trim()) {
      nextErrors.apellidos = 'Los apellidos son obligatorios';
    }

    if (!formData.dni.trim()) {
      nextErrors.dni = 'El DNI es obligatorio';
    } else if (!DNI_REGEX.test(formData.dni.trim())) {
      nextErrors.dni = 'El DNI debe tener 8 números y una letra válida';
    }

    if (formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = 'El email no es válido';
    }

    if (formData.movil.trim() && !TELEFONO_REGEX.test(formData.movil.trim())) {
      nextErrors.movil = 'El teléfono debe tener 9 dígitos válidos';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const duplicate = await buscarClienteDuplicado({
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        dni: formData.dni
      });

      if (duplicate.cliente && duplicate.motivo) {
        setErrors({
          general: duplicate.motivo === 'dni'
            ? 'Ya existe un cliente con ese DNI. Revisa los datos antes de guardar.'
            : 'Ya existe un cliente con el mismo nombre y apellidos. Revisa los datos antes de guardar.'
        });
        return;
      }

      const result = await crearCliente({
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        dni: formData.dni.trim().toUpperCase(),
        movil: formData.movil.trim(),
        email: formData.email.trim(),
        fechaRegistro: new Date().toISOString()
      });

      if (result.error || !result.data) {
        setErrors({
          general: result.error instanceof Error ? result.error.message : 'Error al crear el cliente'
        });
        return;
      }

      onSuccess(result.data);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={isSaving ? () => undefined : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Nuevo cliente
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Añade el cliente y selecciónalo para este pago.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-md p-1 text-gray-500 transition hover:bg-black/5 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200 cursor-pointer"
                >
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nuevo-cliente-nombre" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre *
                    </label>
                    <input
                      id="nuevo-cliente-nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 ${
                        errors.nombre ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.nombre ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nombre}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="nuevo-cliente-apellidos" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apellidos *
                    </label>
                    <input
                      id="nuevo-cliente-apellidos"
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 ${
                        errors.apellidos ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.apellidos ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.apellidos}</p> : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nuevo-cliente-dni" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      DNI *
                    </label>
                    <input
                      id="nuevo-cliente-dni"
                      type="text"
                      value={formData.dni}
                      onChange={(e) => handleInputChange('dni', e.target.value)}
                      maxLength={9}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 ${
                        errors.dni ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.dni ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dni}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="nuevo-cliente-telefono" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teléfono
                    </label>
                    <input
                      id="nuevo-cliente-telefono"
                      type="tel"
                      value={formData.movil}
                      onChange={(e) => handleInputChange('movil', e.target.value)}
                      maxLength={9}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 ${
                        errors.movil ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.movil ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.movil}</p> : null}
                  </div>
                </div>

                <div>
                  <label htmlFor="nuevo-cliente-email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    id="nuevo-cliente-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 ${
                      errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.email ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p> : null}
                </div>

                {errors.general ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                    {errors.general}
                  </div>
                ) : null}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cliente'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

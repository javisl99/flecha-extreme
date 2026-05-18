'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCampamentoParticipantes } from '@/hooks/useCampamentoParticipantes';
import type { CampamentoParticipanteCatalogo } from '@/lib/campamento';

interface ModalNuevoParticipanteCampamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (participante: CampamentoParticipanteCatalogo) => void | Promise<void>;
}

export default function ModalNuevoParticipanteCampamento({
  isOpen,
  onClose,
  onSuccess
}: ModalNuevoParticipanteCampamentoProps) {
  const { crearParticipante, buscarParticipanteDuplicado } = useCampamentoParticipantes();
  const [formData, setFormData] = useState({
    nombre: '',
    dni: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ nombre: '', dni: '' });
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const processedValue = field === 'dni'
      ? value.replace(/[^0-9A-Za-z]/g, '').slice(0, 12).toUpperCase()
      : value;

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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const duplicate = await buscarParticipanteDuplicado({
        nombre: formData.nombre,
        dni: formData.dni
      });

      if (duplicate.participante) {
        await onSuccess(duplicate.participante);
        onClose();
        return;
      }

      const result = await crearParticipante({
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim()
      });

      if (result.error || !result.data) {
        setErrors({
          general: result.error instanceof Error ? result.error.message : 'No se pudo crear el participante'
        });
        return;
      }

      await onSuccess(result.data);
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
                    Nuevo participante
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Guárdalo una vez y podrás reutilizarlo en futuras inscripciones.
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
                <div>
                  <label htmlFor="nuevo-participante-nombre" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre *
                  </label>
                  <input
                    id="nuevo-participante-nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(event) => handleInputChange('nombre', event.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 ${
                      errors.nombre ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.nombre ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nombre}</p> : null}
                </div>

                <div>
                  <label htmlFor="nuevo-participante-dni" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    DNI
                  </label>
                  <input
                    id="nuevo-participante-dni"
                    type="text"
                    value={formData.dni}
                    onChange={(event) => handleInputChange('dni', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
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
                    {isSaving ? 'Guardando...' : 'Guardar participante'}
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

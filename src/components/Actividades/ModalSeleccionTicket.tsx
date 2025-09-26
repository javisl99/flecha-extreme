'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';

interface ModalSeleccionTicketProps {
  isOpen: boolean;
  onClose: () => void;
  onSeleccionarTicketReserva: () => void;
  onSeleccionarTicketPago: () => void;
}

export default function ModalSeleccionTicket({ 
  isOpen, 
  onClose, 
  onSeleccionarTicketReserva,
  onSeleccionarTicketPago 
}: ModalSeleccionTicketProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header con fondo azul */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-white"
                      >
                        Seleccionar Ticket
                      </Dialog.Title>
                      <p className="text-sm text-white/80">
                        Elige el tipo de ticket a descargar
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 cursor-pointer"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                {/* Contenido del modal */}
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        Esta reserva tiene tickets disponibles. ¿Qué ticket deseas descargar?
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Botón Ticket de Reserva */}
                      <button
                        onClick={onSeleccionarTicketReserva}
                        className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors">
                            <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                              Ticket de la Reserva
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                              Ticket del importe de la reserva
                            </div>
                          </div>
                          <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                      
                      {/* Botón Ticket de Pago */}
                      <button
                        onClick={onSeleccionarTicketPago}
                        className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-700 transition-colors">
                            <ReceiptPercentIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-900 dark:group-hover:text-green-100 transition-colors">
                              Ticket del Pago de Actividad
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                              Ticket del importe de la actividad
                            </div>
                          </div>
                          <div className="text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Botón Cancelar */}
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={onClose}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

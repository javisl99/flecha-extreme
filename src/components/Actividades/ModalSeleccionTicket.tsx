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
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest text-left align-middle shadow-xl transition-all">
                <div className="primary-gradient flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/15 p-2">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="font-headline text-xl font-extrabold leading-6 text-white"
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
                
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        Esta reserva tiene tickets disponibles. ¿Qué ticket deseas descargar?
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={onSeleccionarTicketReserva}
                        className="group w-full rounded-xl border border-blue-200 bg-blue-50 p-4 transition-all duration-200 hover:border-blue-300 hover:bg-blue-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-blue-100 p-3 transition-colors group-hover:bg-blue-200">
                            <DocumentTextIcon className="h-6 w-6 text-blue-700" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-blue-900 transition-colors">
                              Ticket de la Reserva
                            </div>
                            <div className="text-sm text-blue-700/80 transition-colors">
                              Ticket del importe de la reserva
                            </div>
                          </div>
                          <div className="text-blue-700 transition-colors">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={onSeleccionarTicketPago}
                        className="group w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-emerald-100 p-3 transition-colors group-hover:bg-emerald-200">
                            <ReceiptPercentIcon className="h-6 w-6 text-emerald-700" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-emerald-900 transition-colors">
                              Ticket del Pago de Actividad
                            </div>
                            <div className="text-sm text-emerald-700/80 transition-colors">
                              Ticket del importe de la actividad
                            </div>
                          </div>
                          <div className="text-emerald-700 transition-colors">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-outline-variant/40 bg-surface-container-low py-2.5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
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

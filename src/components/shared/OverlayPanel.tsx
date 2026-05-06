'use client';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, ReactNode } from 'react';

interface OverlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'bottom' | 'right';
  panelClassName?: string;
  bodyClassName?: string;
}

export default function OverlayPanel({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  panelClassName = '',
  bodyClassName = '',
}: OverlayPanelProps) {
  const isRight = position === 'right';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={`flex min-h-full ${
              isRight ? 'items-stretch justify-end' : 'items-end sm:items-center sm:justify-center'
            }`}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom={isRight ? 'translate-x-full opacity-0' : 'translate-y-full opacity-0 sm:translate-y-4'}
              enterTo="translate-x-0 translate-y-0 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0 translate-y-0 opacity-100"
              leaveTo={isRight ? 'translate-x-full opacity-0' : 'translate-y-full opacity-0 sm:translate-y-4'}
            >
              <Dialog.Panel
                className={`w-full border border-outline-variant/35 bg-surface-container-lowest shadow-xl ${
                  isRight
                    ? 'app-safe-bottom h-full max-w-md rounded-none sm:max-w-lg'
                    : 'app-safe-bottom max-h-[88svh] rounded-t-[1.5rem] sm:max-h-[90svh] sm:max-w-2xl sm:rounded-[1.5rem]'
                } ${panelClassName}`}
              >
                {title ? (
                  <div className="primary-gradient flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
                    <Dialog.Title className="font-headline text-lg font-extrabold tracking-tight text-white sm:text-xl">
                      {title}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md text-white/90 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                ) : null}

                <div
                  className={`overflow-y-auto ${
                    isRight
                      ? title
                        ? 'h-[calc(100%-4.5rem)] max-h-none'
                        : 'h-full max-h-none'
                      : title
                        ? 'max-h-[calc(88svh-4.5rem)] sm:max-h-[calc(90svh-4.5rem)]'
                        : 'max-h-[88svh] sm:max-h-[90svh]'
                  } ${bodyClassName}`}
                >
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

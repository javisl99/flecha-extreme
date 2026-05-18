'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCampamentoParticipantes } from '@/hooks/useCampamentoParticipantes';
import type { CampamentoParticipanteCatalogo } from '@/lib/campamento';

interface SelectorParticipanteProps {
  selectedParticipanteId: string | null;
  onParticipanteChange: (participante: CampamentoParticipanteCatalogo | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  participantesOverride?: CampamentoParticipanteCatalogo[];
  loadingOverride?: boolean;
  selectedDisplayName?: string;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export function SelectorParticipante({
  selectedParticipanteId,
  onParticipanteChange,
  placeholder = 'Buscar por nombre o DNI',
  className = '',
  disabled = false,
  participantesOverride,
  loadingOverride,
  selectedDisplayName
}: SelectorParticipanteProps) {
  const { participantes: catalogoParticipantes, loading: catalogoLoading } = useCampamentoParticipantes();
  const participantes = participantesOverride ?? catalogoParticipantes;
  const loading = loadingOverride ?? catalogoLoading;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedParticipante = useMemo(
    () => participantes.find((participante) => participante.id === selectedParticipanteId) ?? null,
    [participantes, selectedParticipanteId]
  );

  const filteredParticipantes = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(searchTerm);
    if (!normalizedSearch) {
      return participantes;
    }

    return participantes.filter((participante) => {
      const nombre = normalizeSearchValue(participante.nombre);
      const dni = normalizeSearchValue(participante.dni ?? '');
      return nombre.includes(normalizedSearch) || dni.includes(normalizedSearch);
    });
  }, [participantes, searchTerm]);

  useEffect(() => {
    if (isOpen) return;
    if (selectedParticipante?.nombre) {
      setSearchTerm(selectedParticipante.nombre);
      return;
    }

    if (selectedParticipanteId && selectedDisplayName) {
      setSearchTerm(selectedDisplayName);
      return;
    }

    if (!selectedParticipanteId) {
      setSearchTerm('');
    }
  }, [isOpen, selectedParticipante, selectedParticipanteId, selectedDisplayName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (participante: CampamentoParticipanteCatalogo | null) => {
    onParticipanteChange(participante);
    setSearchTerm(participante?.nombre ?? '');
    setIsOpen(false);
  };

  const handleClear = () => {
    onParticipanteChange(null);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
            disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-400' : ''
          }`}
        />
        {!disabled && searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            aria-label="Limpiar selección de participante"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-[75] mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${
                selectedParticipanteId === null ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              Sin participante seleccionado
            </button>

            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Cargando participantes...</div>
            ) : filteredParticipantes.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No se encontraron participantes</div>
            ) : (
              filteredParticipantes.map((participante) => (
                <button
                  key={participante.id}
                  type="button"
                  onClick={() => handleSelect(participante)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${
                    selectedParticipanteId === participante.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="font-medium">{participante.nombre}</div>
                  {participante.dni ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">DNI: {participante.dni}</div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/shared/components';
import { Cliente } from '@/shared/types';
import { useClientes } from '@/hooks/useClientes';
import ModalCliente from '@/components/Clientes/modalCliente';
import { FiltrosClientes, type FiltrosClienteState } from '@/components/Clientes/FiltrosClientes';
import { toast } from 'react-hot-toast';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';
import OverlayPanel from '@/components/shared/OverlayPanel';

const NewItemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const initials = (nombre: string, apellidos: string) => {
  const first = nombre?.charAt(0) || '';
  const second = apellidos?.charAt(0) || '';
  return `${first}${second}`.toUpperCase() || 'CL';
};

function ClienteDetailsContent({
  cliente,
  onEdit,
  onDelete,
}: {
  cliente: Cliente | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!cliente) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
        Selecciona un cliente para ver sus detalles.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-2xl font-black text-white">
          {initials(cliente.nombre, cliente.apellidos)}
        </div>
        <h3 className="mt-2 text-lg font-bold text-on-surface">
          {cliente.nombre} {cliente.apellidos}
        </h3>
      </div>

      <div className="space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-semibold text-outline">Email:</span>
          <span className="text-right text-on-surface">{cliente.email}</span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-semibold text-outline">Móvil:</span>
          <span className="text-right text-on-surface">{cliente.movil || 'No especificado'}</span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-semibold text-outline">DNI:</span>
          <span className="text-right text-on-surface">{cliente.dni || 'No especificado'}</span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-semibold text-outline">Fecha de registro:</span>
          <span className="text-right text-on-surface">{new Date(cliente.fechaRegistro).toLocaleDateString()}</span>
        </div>
      </div>

      {cliente.notas ? (
        <div>
          <h4 className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-outline">Notas</h4>
          <p className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3 text-sm text-on-surface-variant">
            {cliente.notas}
          </p>
        </div>
      ) : null}

      <div className="mt-2 flex flex-col gap-2 border-t border-outline-variant/25 pt-4 sm:flex-row">
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 flex-1 rounded-full border-outline-variant/45 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
        >
          Ver Reservas
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 flex-1 rounded-full border-outline-variant/45 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
        >
          Ver Pagos
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="primary"
          size="sm"
          className="primary-gradient min-h-11 flex-1 rounded-full border border-primary-light/10 text-white shadow-lg shadow-primary/20 hover:brightness-110"
          onClick={onEdit}
        >
          Editar
        </Button>
        <Button
          variant="accent"
          size="sm"
          className="min-h-11 flex-1 rounded-full bg-red-600 text-white hover:bg-red-700"
          onClick={onDelete}
          icon={<TrashIcon />}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [filtros, setFiltros] = useState<FiltrosClienteState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: '',
  });
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');
  const { clientes, loading, error, refreshClientes, eliminarCliente } = useClientes();

  const clientesFiltrados = clientes.filter((cliente) => {
    const cumpleNombre = !filtros.nombre || cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
    const cumpleApellidos = !filtros.apellidos || cliente.apellidos.toLowerCase().includes(filtros.apellidos.toLowerCase());
    const cumpleEmail = !filtros.email || cliente.email.toLowerCase().includes(filtros.email.toLowerCase());
    const cumpleMovil = !filtros.movil || String(cliente.movil).includes(filtros.movil);
    const cumpleDni = !filtros.dni || (cliente.dni && cliente.dni.toLowerCase().includes(filtros.dni.toLowerCase()));

    return cumpleNombre && cumpleApellidos && cumpleEmail && cumpleMovil && cumpleDni;
  });

  const handleNuevoClienteSuccess = async (updatedClient: Cliente) => {
    await refreshClientes();
    setClienteSeleccionado(updatedClient);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    if (window.innerWidth < 1280) {
      setIsDetailOpen(true);
    }
  };

  const handleEditarCliente = () => {
    setModoModal('editar');
    setIsDetailOpen(false);
    setIsModalOpen(true);
  };

  const handleEliminarCliente = () => {
    if (!clienteSeleccionado) return;
    setIsModalConfirmacionOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!clienteSeleccionado) return;

    try {
      const result = await eliminarCliente(clienteSeleccionado.id);
      if (!result.error) {
        toast.success('Cliente eliminado correctamente');
        setClienteSeleccionado(null);
        setIsDetailOpen(false);
        await refreshClientes();
      } else {
        toast.error('Error al eliminar el cliente');
      }
    } catch (deleteError) {
      console.error('Error al eliminar cliente:', deleteError);
      toast.error('Error al eliminar el cliente');
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Clientes</h1>
        <Button
          variant="primary"
          icon={<NewItemIcon />}
          className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
          onClick={() => {
            setModoModal('nuevo');
            setIsModalOpen(true);
          }}
        >
          Nuevo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient xl:col-span-2">
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <FiltrosClientes onFiltrosChange={setFiltros} />
          </div>

          <div className="border-t border-outline-variant/20" />

          <div className="hidden overflow-x-auto md:block">
            {loading ? (
              <TableSkeleton columns={4} rows={5} />
            ) : (
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low/70 backdrop-blur-md">
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Cliente</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Email</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Móvil</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">DNI</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente, index) => (
                    <tr
                      key={cliente.id}
                      className={`cursor-pointer border-b border-outline-variant/10 transition ${
                        clienteSeleccionado?.id === cliente.id
                          ? 'bg-primary/10 hover:bg-primary/15'
                          : index % 2
                            ? 'bg-surface-container-low/25 hover:bg-surface-container-low'
                            : 'hover:bg-surface-container-low'
                      }`}
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-black text-white">
                            {initials(cliente.nombre, cliente.apellidos)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-on-surface">
                              {cliente.nombre} {cliente.apellidos}
                            </div>
                            <div className="text-xs text-outline">Cliente</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-on-surface-variant">{cliente.email}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-on-surface-variant">{cliente.movil || 'No especificado'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-on-surface-variant">{cliente.dni || 'No especificado'}</td>
                    </tr>
                  ))}

                  {clientesFiltrados.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-outline">
                        No se encontraron clientes con esos criterios.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {loading ? (
              <TableSkeleton columns={1} rows={4} />
            ) : clientesFiltrados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
                No se encontraron clientes con esos criterios.
              </div>
            ) : (
              clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => handleSelectCliente(cliente)}
                  className={`w-full rounded-[1.25rem] border px-4 py-4 text-left transition ${
                    clienteSeleccionado?.id === cliente.id
                      ? 'border-primary/25 bg-primary/10'
                      : 'border-outline-variant/20 bg-surface-container-low hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-black text-white">
                      {initials(cliente.nombre, cliente.apellidos)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {cliente.nombre} {cliente.apellidos}
                          </p>
                          <p className="mt-0.5 text-xs text-outline">Cliente</p>
                        </div>
                        <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-primary">
                          Ver
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-on-surface-variant">
                        <p className="truncate">{cliente.email}</p>
                        <p>{cliente.movil || 'No especificado'}</p>
                        <p>{cliente.dni || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card-ambient xl:block">
          <h2 className="font-headline text-xl font-extrabold text-primary-dark">Detalles del Cliente</h2>
          <div className="mt-5">
            <ClienteDetailsContent
              cliente={clienteSeleccionado}
              onEdit={handleEditarCliente}
              onDelete={handleEliminarCliente}
            />
          </div>
        </section>
      </div>

      <OverlayPanel
        isOpen={isDetailOpen && !!clienteSeleccionado}
        onClose={() => setIsDetailOpen(false)}
        title="Detalles del cliente"
        bodyClassName="p-5 sm:p-6 xl:hidden"
      >
        <ClienteDetailsContent
          cliente={clienteSeleccionado}
          onEdit={handleEditarCliente}
          onDelete={handleEliminarCliente}
        />
      </OverlayPanel>

      <ModalCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleNuevoClienteSuccess}
        modo={modoModal}
        cliente={modoModal === 'editar' && clienteSeleccionado ? clienteSeleccionado : undefined}
      />

      <ModalConfirmacion
        isOpen={isModalConfirmacionOpen}
        onClose={() => setIsModalConfirmacionOpen(false)}
        onConfirm={handleConfirmarEliminacion}
        titulo="Eliminar Cliente"
        mensaje={`¿Estás seguro de que quieres eliminar al cliente ${clienteSeleccionado?.nombre} ${clienteSeleccionado?.apellidos}? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        variante="clientes-v2"
      />
    </div>
  );
}

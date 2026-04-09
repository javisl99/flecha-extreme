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

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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

export default function ClientesPage() {
  const [filtros, setFiltros] = useState<FiltrosClienteState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: ''
  });
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');
  const { clientes, loading, error, refreshClientes, eliminarCliente } = useClientes();
  
  const clientesFiltrados = clientes.filter(cliente => {
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
        await refreshClientes();
      } else {
        toast.error('Error al eliminar el cliente');
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Clientes</h1>
        <Button
          variant="primary"
          icon={<UserIcon />}
          className="primary-gradient rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
          onClick={() => {
            setModoModal('nuevo');
            setIsModalOpen(true);
          }}
        >
          Nuevo Cliente
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="xl:col-span-2 overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
          <div className="px-6 py-6">
            <FiltrosClientes onFiltrosChange={setFiltros} />
          </div>

          <div className="border-t border-outline-variant/20" />

          <div className="overflow-x-auto">
            {loading ? (
              <TableSkeleton columns={4} rows={5} />
            ) : (
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low/70 backdrop-blur-md">
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                        Cliente
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                        Email
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                        Móvil
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                        DNI
                    </th>
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
                      onClick={() => setClienteSeleccionado(cliente)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
                        {cliente.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
                        {cliente.movil || 'No especificado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
                        {cliente.dni || 'No especificado'}
                      </td>
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
        </section>
        
        <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card-ambient">
          <h2 className="font-headline text-xl font-extrabold text-primary-dark">Detalles del Cliente</h2>

          <div className="mt-5">
            {clienteSeleccionado ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-2xl font-black text-white">
                    {initials(clienteSeleccionado.nombre, clienteSeleccionado.apellidos)}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-on-surface">
                    {clienteSeleccionado.nombre} {clienteSeleccionado.apellidos}
                  </h3>
                </div>
                
                <div className="space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-outline">Email:</span>
                    <span className="text-right text-on-surface">{clienteSeleccionado.email}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-outline">Móvil:</span>
                    <span className="text-right text-on-surface">{clienteSeleccionado.movil || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-outline">DNI:</span>
                    <span className="text-right text-on-surface">{clienteSeleccionado.dni || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-outline">Fecha de registro:</span>
                    <span className="text-right text-on-surface">
                      {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {clienteSeleccionado.notas && (
                  <div>
                    <h4 className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-outline">Notas</h4>
                    <p className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3 text-sm text-on-surface-variant">
                      {clienteSeleccionado.notas}
                    </p>
                  </div>
                )}
                
                <div className="mt-2 flex gap-2 border-t border-outline-variant/25 pt-4">
                  <Button variant="outline" size="sm" className="flex-1 rounded-full border-outline-variant/45 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-primary">
                    Ver Reservas
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 rounded-full border-outline-variant/45 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-primary">
                    Ver Pagos
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="primary-gradient flex-1 rounded-full border border-primary-light/10 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                    onClick={() => {
                      setModoModal('editar');
                      setIsModalOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="accent" 
                    size="sm" 
                    className="flex-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                    onClick={handleEliminarCliente}
                    icon={<TrashIcon />}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
                Selecciona un cliente para ver sus detalles.
              </div>
            )}
          </div>
        </section>
      </div>

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

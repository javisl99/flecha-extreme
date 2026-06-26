'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/shared/components';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';
import ModalEmpleado from '@/components/Empleados/ModalEmpleado';
import { FiltrosEmpleados, type FiltrosEmpleadoState } from '@/components/Empleados/FiltrosEmpleados';
import SwitchVistaEmpleados, { type VistaEmpleadosTipo } from '@/components/Empleados/SwitchVistaEmpleados';
import HorarioEmpleadoCard from '@/components/Empleados/HorarioEmpleadoCard';
import ModalSemanaHorario from '@/components/Empleados/ModalSemanaHorario';
import ModalCopiarSemanaHorario from '@/components/Empleados/ModalCopiarSemanaHorario';
import ModalAgregarEmpleadoSemana from '@/components/Empleados/ModalAgregarEmpleadoSemana';
import { useEmpleados, type Empleado } from '@/hooks/useEmpleados';
import { useHorariosEmpleados } from '@/hooks/useHorariosEmpleados';
import { addDays, formatDateInputValue, formatWeekRangeLabel, getStartOfWeekMonday } from '@/lib/empleadoHorarios';

const NewItemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const calendarDayIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const todayWeekStart = formatDateInputValue(getStartOfWeekMonday(new Date()));

const initials = (nombre: string, apellidos: string) => {
  const first = nombre?.charAt(0) || '';
  const second = apellidos?.charAt(0) || '';
  return `${first}${second}`.toUpperCase() || 'EM';
};

const formatRegisterDate = (createdAt?: string) => {
  if (!createdAt) return 'No disponible';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return date.toLocaleDateString('es-ES');
};

const empleadoHorarioTieneDatos = (empleadoSemana: {
  aperturas: number;
  cierres: number;
  horas_fin_semana: number;
  nota: string | null;
  dias: Array<{
    manana_inicio: string | null;
    manana_fin: string | null;
    tarde_inicio: string | null;
    tarde_fin: string | null;
  }>;
}) => (
  empleadoSemana.aperturas > 0
  || empleadoSemana.cierres > 0
  || empleadoSemana.horas_fin_semana > 0
  || Boolean(empleadoSemana.nota?.trim())
  || empleadoSemana.dias.some((day) => (
    Boolean(day.manana_inicio)
    || Boolean(day.manana_fin)
    || Boolean(day.tarde_inicio)
    || Boolean(day.tarde_fin)
  ))
);

function EmployeeListView({
  empleados,
  loading,
  filtros,
  onFiltrosChange,
  onNuevo,
  onEditar,
  onEliminar,
}: {
  empleados: Empleado[];
  loading: boolean;
  filtros: FiltrosEmpleadoState;
  onFiltrosChange: (filtros: FiltrosEmpleadoState) => void;
  onNuevo: () => void;
  onEditar: (empleado: Empleado) => void;
  onEliminar: (empleado: Empleado) => void;
}) {
  const empleadosFiltrados = useMemo(() => (
    empleados.filter((empleado) => {
      const coincideNombre = !filtros.nombre || empleado.nombre?.toLowerCase().includes(filtros.nombre.toLowerCase());
      const coincideApellidos = !filtros.apellidos || empleado.apellidos?.toLowerCase().includes(filtros.apellidos.toLowerCase());
      const coincideEmail = !filtros.email || empleado.email?.toLowerCase().includes(filtros.email.toLowerCase());
      const coincideMovil = !filtros.movil || empleado.movil?.toLowerCase().includes(filtros.movil.toLowerCase());
      const coincideDni = !filtros.dni || empleado.dni?.toLowerCase().includes(filtros.dni.toLowerCase());

      return coincideNombre && coincideApellidos && coincideEmail && coincideMovil && coincideDni;
    })
  ), [empleados, filtros]);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-outline">Directorio</p>
          <h2 className="mt-1 font-headline text-2xl font-extrabold text-primary-dark">Empleados</h2>
        </div>

        <Button
          variant="primary"
          icon={<NewItemIcon />}
          className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
          onClick={onNuevo}
        >
          Nuevo
        </Button>
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <FiltrosEmpleados onFiltrosChange={onFiltrosChange} />
      </div>

      <div className="border-t border-outline-variant/20" />

      <div className="hidden overflow-x-auto md:block">
        {loading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : (
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low/70 backdrop-blur-md">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Empleado</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Email</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Móvil</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">DNI</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Alta</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-outline">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map((empleado, index) => (
                <tr
                  key={empleado.id}
                  className={`border-b border-outline-variant/10 transition hover:bg-surface-container-low ${
                    index % 2 ? 'bg-surface-container-low/25' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-black text-white">
                        {initials(empleado.nombre, empleado.apellidos)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-on-surface">
                          {empleado.nombre} {empleado.apellidos}
                        </div>
                        <div className="text-xs text-outline">Empleado</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{empleado.email || 'No especificado'}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{empleado.movil || 'No especificado'}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{empleado.dni || 'No especificado'}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{formatRegisterDate(empleado.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-lowest text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                        onClick={() => onEditar(empleado)}
                        title="Editar"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                        onClick={() => onEliminar(empleado)}
                        title="Eliminar"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {empleadosFiltrados.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-outline">
                    No se encontraron empleados con esos criterios.
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
        ) : empleadosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
            No se encontraron empleados con esos criterios.
          </div>
        ) : (
          empleadosFiltrados.map((empleado) => (
            <div
              key={empleado.id}
              className="w-full rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4 text-left transition hover:bg-surface-container-high"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-black text-white">
                  {initials(empleado.nombre, empleado.apellidos)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-on-surface">
                    {empleado.nombre} {empleado.apellidos}
                  </p>
                  <p className="mt-0.5 text-xs text-outline">Empleado</p>
                  <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-on-surface-variant">
                    <p className="truncate">{empleado.email || 'No especificado'}</p>
                    <p>{empleado.movil || 'No especificado'}</p>
                    <p>{empleado.dni || 'No especificado'}</p>
                    <p>Alta: {formatRegisterDate(empleado.created_at)}</p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="min-h-11 flex-1 cursor-pointer rounded-full border border-outline-variant/35 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                      onClick={() => onEditar(empleado)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="min-h-11 flex-1 cursor-pointer rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                      onClick={() => onEliminar(empleado)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function EmpleadosPage() {
  const [vistaActual, setVistaActual] = useState<VistaEmpleadosTipo>('horarios');
  const [filtros, setFiltros] = useState<FiltrosEmpleadoState>({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: '',
  });
  const [selectedWeekStart, setSelectedWeekStart] = useState(todayWeekStart);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [isModalConfirmacionQuitarHorarioOpen, setIsModalConfirmacionQuitarHorarioOpen] = useState(false);
  const [isModalEmpleadoOpen, setIsModalEmpleadoOpen] = useState(false);
  const [isCreateWeekModalOpen, setIsCreateWeekModalOpen] = useState(false);
  const [isCopyWeekModalOpen, setIsCopyWeekModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [empleadoSemanaPendienteEliminar, setEmpleadoSemanaPendienteEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [modoModal, setModoModal] = useState<'nuevo' | 'editar'>('nuevo');

  const {
    empleados,
    loading: empleadosLoading,
    error: empleadosError,
    eliminarEmpleado,
    refreshEmpleados,
  } = useEmpleados();
  const {
    semana,
    loading: horariosLoading,
    saving: horariosSaving,
    error: horariosError,
    cargarSemana,
    crearSemana,
    actualizarDia,
    actualizarResumenSemanaEmpleado,
    agregarEmpleadoASemana,
    eliminarEmpleadoDeSemana,
  } = useHorariosEmpleados();

  useEffect(() => {
    void cargarSemana(selectedWeekStart);
  }, [cargarSemana, selectedWeekStart]);

  useEffect(() => {
    if (!semana) {
      setCollapsedCards({});
      return;
    }

    const initialCollapsedState = semana.empleados.reduce<Record<string, boolean>>((accumulator, empleadoSemana) => {
      accumulator[empleadoSemana.id] = empleadoHorarioTieneDatos(empleadoSemana);
      return accumulator;
    }, {});

    setCollapsedCards(initialCollapsedState);
  }, [semana?.id]);

  const empleadosDisponiblesParaSemana = useMemo(() => {
    const scheduledIds = new Set((semana?.empleados || []).map((item) => item.empleado_id));
    return empleados.filter((empleado) => !scheduledIds.has(empleado.id));
  }, [empleados, semana]);

  const cambiarSemana = (days: number) => {
    const nextDate = addDays(getStartOfWeekMonday(selectedWeekStart), days);
    setSelectedWeekStart(formatDateInputValue(nextDate));
  };

  const handleNuevoEmpleadoSuccess = async () => {
    await refreshEmpleados();
  };

  const handleEditarEmpleado = (empleado: Empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModoModal('editar');
    setIsModalEmpleadoOpen(true);
  };

  const handleEliminarEmpleado = (empleado: Empleado) => {
    setEmpleadoSeleccionado(empleado);
    setIsModalConfirmacionOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!empleadoSeleccionado) return;

    try {
      const result = await eliminarEmpleado(empleadoSeleccionado.id);
      if (!result.error) {
        toast.success('Empleado eliminado correctamente');
        setEmpleadoSeleccionado(null);
        await refreshEmpleados();
      } else {
        toast.error('Error al eliminar el empleado');
      }
    } catch (deleteError) {
      console.error('Error al eliminar empleado:', deleteError);
      toast.error('Error al eliminar el empleado');
    }
  };

  const handleCreateWeek = async ({ semanaInicio, employeeIds }: { semanaInicio: string; employeeIds: string[] }) => {
    try {
      setSelectedWeekStart(semanaInicio);
      await crearSemana({ semanaInicio, employeeIds });
      setIsCreateWeekModalOpen(false);
      toast.success('Semana creada correctamente');
    } catch (error) {
      console.error('Error creando semana de horarios:', error);
      toast.error('No se pudo crear la semana');
    }
  };

  const handleCopyWeek = async ({ sourceWeekStart, targetWeekStart }: { sourceWeekStart: string; targetWeekStart: string }) => {
    try {
      setSelectedWeekStart(targetWeekStart);
      await crearSemana({
        semanaInicio: targetWeekStart,
        employeeIds: [],
        copyFromSemanaInicio: sourceWeekStart,
      });
      setIsCopyWeekModalOpen(false);
      toast.success('Semana copiada correctamente');
    } catch (error) {
      console.error('Error copiando semana:', error);
      toast.error('No se pudo copiar la semana');
    }
  };

  const handleAddEmployeeToWeek = async (empleadoIds: string[]) => {
    if (!semana) return;

    try {
      await agregarEmpleadoASemana({ semanaId: semana.id, empleadoIds });
      setIsAddEmployeeModalOpen(false);
      toast.success(
        empleadoIds.length === 1
          ? 'Empleado añadido a la semana'
          : 'Empleados añadidos a la semana',
      );
    } catch (error) {
      console.error('Error añadiendo empleado a la semana:', error);
      toast.error('No se pudieron añadir los empleados');
    }
  };

  const handleSolicitarRemoveEmployeeFromWeek = async (semanaEmpleadoId: string, nombreCompleto: string) => {
    setEmpleadoSemanaPendienteEliminar({ id: semanaEmpleadoId, nombre: nombreCompleto });
    setIsModalConfirmacionQuitarHorarioOpen(true);
  };

  const handleConfirmarRemoveEmployeeFromWeek = async () => {
    if (!empleadoSemanaPendienteEliminar) return;

    try {
      await eliminarEmpleadoDeSemana(empleadoSemanaPendienteEliminar.id);
      toast.success('Empleado retirado de la semana');
    } catch (error) {
      console.error('Error eliminando empleado de la semana:', error);
      toast.error('No se pudo quitar el empleado');
    } finally {
      setEmpleadoSemanaPendienteEliminar(null);
      setIsModalConfirmacionQuitarHorarioOpen(false);
    }
  };

  if (empleadosError && !empleados.length) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center">
        <div className="text-lg text-red-500">{empleadosError}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="page-container space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Empleados</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Organiza fichas de personal y la planificación semanal del equipo.
            </p>
          </div>

          <SwitchVistaEmpleados vistaActual={vistaActual} onVistaChange={setVistaActual} />
        </div>

        {vistaActual === 'horarios' ? (
          <>
            <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-card-ambient sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface">
                    {calendarDayIcon}
                    <span>{formatWeekRangeLabel(selectedWeekStart)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cambiarSemana(-7)}
                      className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-low text-on-surface-variant transition hover:border-primary/20 hover:text-primary"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <input
                      type="date"
                      value={selectedWeekStart}
                      onChange={(event) => setSelectedWeekStart(formatDateInputValue(getStartOfWeekMonday(event.target.value)))}
                      className="h-10 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    />
                    <button
                      type="button"
                      onClick={() => cambiarSemana(7)}
                      className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-low text-on-surface-variant transition hover:border-primary/20 hover:text-primary"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {!semana ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high"
                      onClick={() => setIsCreateWeekModalOpen(true)}
                    >
                      Crear semana
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high"
                    onClick={() => setIsCopyWeekModalOpen(true)}
                  >
                    Copiar semana
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                    onClick={() => setIsAddEmployeeModalOpen(true)}
                    disabled={!semana || !empleadosDisponiblesParaSemana.length}
                  >
                    Añadir empleado
                  </Button>
                </div>
              </div>
            </section>

            {horariosError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {horariosError}
              </div>
            ) : null}

            {horariosLoading ? (
              <div className="space-y-4">
                <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
                  <TableSkeleton columns={6} rows={8} />
                </section>
                <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
                  <TableSkeleton columns={6} rows={8} />
                </section>
              </div>
            ) : semana ? (
              <div className="space-y-5">
                {semana.empleados.length === 0 ? (
                  <section className="rounded-[1.5rem] border border-dashed border-outline-variant/35 bg-surface-container-low px-6 py-12 text-center shadow-card-ambient">
                    <h3 className="font-headline text-xl font-extrabold text-primary-dark">Semana creada sin empleados</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Añade empleados a esta semana para empezar a organizar sus turnos.
                    </p>
                  </section>
                ) : (
                  semana.empleados.map((empleadoSemana) => (
                    <HorarioEmpleadoCard
                      key={empleadoSemana.id}
                      empleadoSemana={empleadoSemana}
                      isCollapsed={Boolean(collapsedCards[empleadoSemana.id])}
                      onToggleCollapse={() => {
                        setCollapsedCards((current) => ({
                          ...current,
                          [empleadoSemana.id]: !current[empleadoSemana.id],
                        }));
                      }}
                      onDayChange={async (payload) => {
                        try {
                          await actualizarDia(payload);
                        } catch {
                          toast.error('No se pudo guardar el turno');
                        }
                      }}
                      onSummaryChange={async (payload) => {
                        try {
                          await actualizarResumenSemanaEmpleado(payload);
                        } catch {
                          toast.error('No se pudo guardar el resumen');
                        }
                      }}
                      onRemove={async (semanaEmpleadoId) => {
                        await handleSolicitarRemoveEmployeeFromWeek(
                          semanaEmpleadoId,
                          `${empleadoSemana.empleado.nombre} ${empleadoSemana.empleado.apellidos}`,
                        );
                      }}
                      saving={horariosSaving}
                    />
                  ))
                )}
              </div>
            ) : (
              <section className="rounded-[1.5rem] border border-dashed border-outline-variant/35 bg-surface-container-low px-6 py-12 text-center shadow-card-ambient">
                <div className="mx-auto max-w-2xl">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {calendarDayIcon}
                  </div>
                  <h2 className="mt-4 font-headline text-2xl font-extrabold text-primary-dark">
                    No hay una semana creada para {formatWeekRangeLabel(selectedWeekStart)}
                  </h2>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Crea una semana vacía con los empleados iniciales o copia una semana existente para reutilizar turnos.
                  </p>
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="primary"
                      className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                      onClick={() => setIsCreateWeekModalOpen(true)}
                    >
                      Crear semana
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-lowest px-5 text-on-surface-variant hover:bg-surface-container-high"
                      onClick={() => setIsCopyWeekModalOpen(true)}
                    >
                      Copiar semana
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <EmployeeListView
            empleados={empleados}
            loading={empleadosLoading}
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onNuevo={() => {
              setModoModal('nuevo');
              setEmpleadoSeleccionado(null);
              setIsModalEmpleadoOpen(true);
            }}
            onEditar={handleEditarEmpleado}
            onEliminar={handleEliminarEmpleado}
          />
        )}

        <ModalEmpleado
          isOpen={isModalEmpleadoOpen}
          onClose={() => setIsModalEmpleadoOpen(false)}
          onSuccess={handleNuevoEmpleadoSuccess}
          modo={modoModal}
          empleado={modoModal === 'editar' && empleadoSeleccionado ? empleadoSeleccionado : undefined}
        />

        <ModalConfirmacion
          isOpen={isModalConfirmacionOpen}
          onClose={() => setIsModalConfirmacionOpen(false)}
          onConfirm={handleConfirmarEliminacion}
          titulo="Eliminar Empleado"
          mensaje={`¿Estás seguro de que quieres eliminar a ${empleadoSeleccionado?.nombre} ${empleadoSeleccionado?.apellidos}? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
          variante="empleados-v2"
        />

        <ModalConfirmacion
          isOpen={isModalConfirmacionQuitarHorarioOpen}
          onClose={() => {
            setIsModalConfirmacionQuitarHorarioOpen(false);
            setEmpleadoSemanaPendienteEliminar(null);
          }}
          onConfirm={handleConfirmarRemoveEmployeeFromWeek}
          titulo="Quitar Empleado del Horario"
          mensaje={`¿Seguro que quieres quitar a ${empleadoSemanaPendienteEliminar?.nombre || 'este empleado'} de esta semana?`}
          textoConfirmar="Quitar"
          textoCancelar="Cancelar"
          variante="empleados-v2"
        />

        <ModalSemanaHorario
          isOpen={isCreateWeekModalOpen}
          onClose={() => setIsCreateWeekModalOpen(false)}
          onSubmit={handleCreateWeek}
          empleados={empleados}
          initialWeekStart={selectedWeekStart}
          loading={horariosSaving}
        />

        <ModalCopiarSemanaHorario
          isOpen={isCopyWeekModalOpen}
          onClose={() => setIsCopyWeekModalOpen(false)}
          onSubmit={handleCopyWeek}
          initialTargetWeekStart={selectedWeekStart}
          loading={horariosSaving}
        />

        <ModalAgregarEmpleadoSemana
          isOpen={isAddEmployeeModalOpen}
          onClose={() => setIsAddEmployeeModalOpen(false)}
          onSubmit={handleAddEmployeeToWeek}
          empleadosDisponibles={empleadosDisponiblesParaSemana}
          loading={horariosSaving}
        />
      </div>
    </ProtectedRoute>
  );
}

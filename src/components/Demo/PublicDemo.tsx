'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  demoClients,
  demoReservations,
  initialDemoPayments,
  type DemoPayment,
  type DemoSection,
} from './demo-data';

const navigation = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: Squares2X2Icon },
  { id: 'reservas' as const, label: 'Reservas', icon: CalendarDaysIcon },
  { id: 'clientes' as const, label: 'Clientes', icon: UsersIcon },
  { id: 'pagos' as const, label: 'Pagos', icon: CreditCardIcon },
];

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function Status({ children, success = false }: { children: React.ReactNode; success?: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
      success ? 'bg-emerald-100 text-emerald-700' : 'bg-accent/20 text-[#8a6200]'
    }`}>
      {children}
    </span>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">{title}</h1>
      <p className="mt-1 text-sm font-semibold text-on-surface-variant">{description}</p>
    </div>
  );
}

function DashboardView({ payments, balance }: { payments: DemoPayment[]; balance: number }) {
  const pending = payments.filter((payment) => payment.status === 'Pendiente');
  const latestCompleted = payments.find((payment) => payment.status === 'Completado');

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard" description="Resumen operativo de hoy · datos ficticios" />

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-card-ambient lg:col-span-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/25 text-primary">
                <BanknotesIcon className="h-7 w-7" />
              </div>
              <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-outline">Caja efectivo</p>
              <p className="mt-2 font-headline text-5xl font-black text-primary-dark">{currency.format(balance)}</p>
            </div>
            <span className="w-fit rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-primary">
              Vista gerencia
            </span>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-emerald-700">Ingresos</p>
              <p className="mt-2 font-headline text-xl font-black">{currency.format(balance + 275)}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-rose-700">Gastos</p>
              <p className="mt-2 font-headline text-xl font-black">{currency.format(275)}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-primary">Último movimiento</p>
              <p className="mt-2 truncate text-sm font-bold">{latestCompleted?.concept ?? 'Sin movimientos'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-primary-container p-6 text-white shadow-card-ambient lg:col-span-4">
          <CheckCircleIcon className="h-12 w-12 rounded-2xl bg-white/15 p-2.5 text-accent" />
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Actividades completadas</p>
          <p className="mt-2 font-headline text-5xl font-black">3/7</p>
          <p className="mt-3 text-sm font-semibold text-white/75">43% de la jornada cerrada</p>
          <div className="mt-12 h-3 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[43%] rounded-full bg-accent" />
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="rounded-[1.5rem] bg-white p-5 shadow-card-ambient sm:p-6 xl:col-span-8">
          <h2 className="font-headline text-xl font-extrabold text-primary-dark">Próximas reservas</h2>
          <div className="mt-5 space-y-3">
            {demoReservations.slice(0, 3).map((reservation) => (
              <article className="grid gap-3 rounded-xl bg-surface-container-low px-4 py-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center" key={reservation.id}>
                <p className="font-headline text-lg font-black text-primary-dark">{reservation.time}</p>
                <div>
                  <p className="font-black text-on-surface">{reservation.activity}</p>
                  <p className="mt-1 text-xs font-semibold text-outline">{reservation.client}</p>
                </div>
                <p className="text-sm font-black text-primary">{reservation.people} pers.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-white p-5 shadow-card-ambient sm:p-6 xl:col-span-4">
          <h2 className="font-headline text-xl font-extrabold text-primary-dark">Cobros pendientes</h2>
          <p className="text-xs font-semibold text-outline">Se actualizan desde la pestaña Pagos</p>
          <div className="mt-5 space-y-3">
            {pending.length ? pending.map((payment) => (
              <article className="rounded-xl bg-surface-container-low px-4 py-3" key={payment.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{payment.concept}</p>
                    <p className="mt-1 text-xs font-semibold text-outline">{payment.client}</p>
                  </div>
                  <p className="font-black text-primary">{currency.format(payment.amount)}</p>
                </div>
              </article>
            )) : <p className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Todos los cobros están conciliados.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReservationsView() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Reservas" description="Agenda operativa de actividades y alquileres" />
      <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-card-ambient">
        <div className="border-b border-outline-variant/20 px-5 py-4 text-sm font-bold text-primary">Hoy · Costa Demo</div>
        <div className="divide-y divide-outline-variant/15">
          {demoReservations.map((reservation) => (
            <article className="grid gap-4 px-5 py-5 sm:grid-cols-[5rem_1fr_auto] sm:items-center" key={reservation.id}>
              <div>
                <p className="font-headline text-xl font-black text-primary-dark">{reservation.time}</p>
                <p className="text-xs font-bold text-outline">{reservation.id}</p>
              </div>
              <div>
                <p className="font-black text-on-surface">{reservation.activity}</p>
                <p className="mt-1 text-sm font-semibold text-on-surface-variant">{reservation.client} · {reservation.people} personas</p>
              </div>
              <Status success={reservation.status === 'Confirmada'}>{reservation.status}</Status>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ClientsView() {
  const [query, setQuery] = useState('');
  const visibleClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return demoClients;
    return demoClients.filter((client) => `${client.name} ${client.email}`.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Clientes" description="CRM de alumnos, participantes y responsables" />
      <label className="flex max-w-lg items-center gap-3 rounded-xl border border-outline-variant/45 bg-white px-4 py-3 shadow-sm">
        <MagnifyingGlassIcon className="h-5 w-5 text-outline" />
        <span className="sr-only">Buscar clientes</span>
        <input className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo" type="search" value={query} />
      </label>
      <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-card-ambient">
        <div className="divide-y divide-outline-variant/15">
          {visibleClients.map((client) => (
            <article className="grid gap-4 px-5 py-5 md:grid-cols-[1.2fr_1.4fr_0.7fr] md:items-center" key={client.id}>
              <div>
                <p className="font-black text-on-surface">{client.name}</p>
                <p className="mt-1 text-xs font-bold text-outline">{client.id} · {client.bookings} reservas</p>
              </div>
              <div className="text-sm font-semibold text-on-surface-variant">
                <p>{client.email}</p>
                <p className="mt-1">{client.phone}</p>
              </div>
              <p className="text-sm font-bold text-primary md:text-right">{client.lastActivity}</p>
            </article>
          ))}
          {!visibleClients.length ? <p className="p-8 text-center text-sm font-bold text-outline">No hay coincidencias en los datos de demostración.</p> : null}
        </div>
      </section>
    </div>
  );
}

function PaymentsView({ payments, onComplete }: { payments: DemoPayment[]; onComplete: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Pagos" description="Prueba a completar el cobro pendiente y vuelve al dashboard" />
      <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-card-ambient">
        <div className="divide-y divide-outline-variant/15">
          {payments.map((payment) => (
            <article className="grid gap-4 px-5 py-5 lg:grid-cols-[1.4fr_1fr_0.7fr_auto] lg:items-center" key={payment.id}>
              <div>
                <p className="font-black text-on-surface">{payment.concept}</p>
                <p className="mt-1 text-xs font-bold text-outline">{payment.id} · {payment.client}</p>
              </div>
              <p className="text-sm font-semibold text-on-surface-variant">{payment.method}</p>
              <p className="font-headline text-lg font-black text-primary-dark">{currency.format(payment.amount)}</p>
              <div className="flex min-w-[9rem] justify-start lg:justify-end">
                {payment.status === 'Pendiente' ? (
                  <button className="rounded-full bg-primary px-4 py-2 text-sm font-black text-white transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" onClick={() => onComplete(payment.id)} type="button">
                    Completar cobro
                  </button>
                ) : <Status success>Completado</Status>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function PublicDemo() {
  const [section, setSection] = useState<DemoSection>('dashboard');
  const [payments, setPayments] = useState(initialDemoPayments);
  const [balance, setBalance] = useState(1340);
  const [notice, setNotice] = useState('');

  const completePayment = (id: string) => {
    const payment = payments.find((item) => item.id === id && item.status === 'Pendiente');
    if (!payment) return;
    setPayments((current) => current.map((item) => item.id === id ? { ...item, status: 'Completado' } : item));
    setBalance((current) => current + payment.amount);
    setNotice(`Cobro de ${currency.format(payment.amount)} completado. El movimiento ya aparece en caja.`);
  };

  const resetDemo = () => {
    setPayments(initialDemoPayments);
    setBalance(1340);
    setNotice('La demostración ha vuelto a su estado inicial.');
    setSection('dashboard');
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden min-h-screen flex-col bg-primary-dark p-5 text-white lg:flex">
        <Image alt="Flecha Extreme" className="mx-auto" height={77} priority src="/cropped-lgo.png" width={170} />
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-accent">Modo demostración</p>
          <p className="mt-2 text-xs leading-5 text-white/70">Datos sintéticos. Ninguna acción se conecta a la base real.</p>
        </div>
        <nav aria-label="Secciones de la demostración" className="mt-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${section === item.id ? 'bg-white text-primary-dark' : 'text-white/75 hover:bg-white/10 hover:text-white'}`} key={item.id} onClick={() => setSection(item.id)} type="button">
                <Icon className="h-5 w-5" />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 pt-8">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white" onClick={resetDemo} type="button"><ArrowPathIcon className="h-5 w-5" />Reiniciar demo</button>
          <Link className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white" href="/login"><ArrowLeftIcon className="h-5 w-5" />Salir de la demo</Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-outline-variant/20 bg-white/95 px-4 py-3 backdrop-blur-xl lg:px-7">
          <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
              <p className="text-xs font-black text-primary-dark sm:text-sm">Entorno seguro · datos ficticios</p>
            </div>
            <button className="rounded-full bg-surface-container-low px-3 py-2 text-xs font-black text-primary lg:hidden" onClick={resetDemo} type="button">Reiniciar</button>
          </div>
        </header>

        <nav aria-label="Secciones de la demostración" className="border-b border-outline-variant/20 bg-white px-2 py-2 lg:hidden">
          <div className="grid grid-cols-4 gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return <button className={`flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[11px] font-black ${section === item.id ? 'bg-primary text-white' : 'bg-surface-container-low text-primary'}`} key={item.id} onClick={() => setSection(item.id)} type="button"><Icon className="h-4 w-4 shrink-0" />{item.id === 'dashboard' ? 'Inicio' : item.label}</button>;
            })}
          </div>
        </nav>

        <main className="mx-auto max-w-[92rem] p-4 sm:p-6 lg:p-8">
          {notice ? (
            <div aria-live="polite" className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              <span>{notice}</span><button aria-label="Cerrar aviso" className="text-emerald-700" onClick={() => setNotice('')} type="button">×</button>
            </div>
          ) : null}
          {section === 'dashboard' ? <DashboardView balance={balance} payments={payments} /> : null}
          {section === 'reservas' ? <ReservationsView /> : null}
          {section === 'clientes' ? <ClientsView /> : null}
          {section === 'pagos' ? <PaymentsView onComplete={completePayment} payments={payments} /> : null}
        </main>
      </div>
    </div>
  );
}

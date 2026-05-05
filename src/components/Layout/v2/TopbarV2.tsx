import Link from 'next/link';
import { BellIcon, PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface TopbarV2Props {
  title: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function TopbarV2({ title, badge, ctaLabel, ctaHref = '#' }: TopbarV2Props) {
  return (
    <header className="sticky top-0 z-20 glass-surface">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-primary-dark">{title}</h1>

          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#c78a00]">{badge}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Ayuda"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-surface-container-low hover:text-primary"
              title="Notificaciones"
            >
              <div className="relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" />
              </div>
            </button>
          </div>

          {ctaLabel ? (
            <Link
              href={ctaHref}
              className="primary-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03] active:scale-[0.98] sm:px-6"
            >
              <PlusIcon className="h-4 w-4" />
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

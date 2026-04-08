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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between glass-surface px-10">
      <div className="flex items-center gap-4">
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-primary-dark">{title}</h1>

        {badge && (
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#c78a00]">{badge}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Ayuda"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-surface-container-low hover:text-primary"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              title="Notificaciones"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <BellIcon className="h-5 w-5" />
            </button>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </div>
        </div>

        {ctaLabel ? (
          <Link
            href={ctaHref}
            className="primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            <PlusIcon className="h-4 w-4" />
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

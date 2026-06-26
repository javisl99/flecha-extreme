interface TopbarV2Props {
  title: string;
  badge?: string;
}

export default function TopbarV2({ title, badge }: TopbarV2Props) {
  return (
    <header className="sticky top-0 z-20 glass-surface">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-primary-dark">{title}</h1>

          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#c78a00]">{badge}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

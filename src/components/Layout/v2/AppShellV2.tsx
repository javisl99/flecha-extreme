import SidebarV2 from './SidebarV2';

interface AppShellV2Props {
  children: React.ReactNode;
}

export default function AppShellV2({ children }: AppShellV2Props) {
  return (
    <div className="min-h-screen-safe bg-surface text-on-surface [--sidebar-width:16rem]">
      <SidebarV2 />
      <div className="min-h-screen-safe ml-[var(--sidebar-width)]">{children}</div>
    </div>
  );
}

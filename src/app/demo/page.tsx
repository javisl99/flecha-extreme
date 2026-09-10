import type { Metadata } from 'next';
import PublicDemo from '@/components/Demo/PublicDemo';

export const metadata: Metadata = {
  title: 'Demo segura - Flecha Extreme',
  description: 'Demostración interactiva de Flecha Extreme con datos completamente ficticios.',
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <PublicDemo />;
}

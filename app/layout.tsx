import type { Metadata } from 'next';
import './theme.css';
import './platform.css';
import './rich.css';
import './soul.css';
import './storefront.css';

export const metadata: Metadata = {
  title: 'Stocky Downy | Mode circulaire',
  description: 'Du stock dormant au style circulaire.',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}

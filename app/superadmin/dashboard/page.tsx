import { redirect } from 'next/navigation';
import Platform from '@/components/platform';
import { identity } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export default async function SuperadminDashboard() {
  const user = await identity();
  if (!user || user.role !== 'superadmin') redirect('/superadmin');
  return <Platform initialView="admin" />;
}

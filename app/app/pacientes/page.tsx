import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/session';
import PacientesClient from './PacientesClient';

export default async function PacientesPage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn || !session.nutricionista) redirect('/');
  return <PacientesClient nutricionista={session.nutricionista} />;
}

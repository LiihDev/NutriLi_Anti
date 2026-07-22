import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/session';
import NovoPacienteClient from './NovoPacienteClient';

export default async function NovoPacientePage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn || !session.nutricionista) redirect('/');
  return <NovoPacienteClient nutricionista={session.nutricionista} />;
}

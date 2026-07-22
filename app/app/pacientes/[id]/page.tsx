import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData } from '@/lib/session';
import PerfilPacienteClient from './PerfilPacienteClient';

export default async function PerfilPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn || !session.nutricionista) {
    redirect('/');
  }

  const { id } = await params;

  return <PerfilPacienteClient nutricionista={session.nutricionista} pacienteId={id} />;
}

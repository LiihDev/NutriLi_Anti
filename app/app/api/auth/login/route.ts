import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT id, nome, email, senha_hash FROM nutricionistas WHERE email = ${email} LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 });
    }

    const nutricionista = result[0];
    const senhaCorreta = await bcrypt.compare(senha, nutricionista.senha_hash);

    if (!senhaCorreta) {
      return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    session.isLoggedIn = true;
    session.nutricionista = {
      id: nutricionista.id,
      nome: nutricionista.nome,
      email: nutricionista.email,
    };
    await session.save();

    return res;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { nome, email, senha } = await req.json();

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
  }

  if (senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
  }

  try {
    // Verifica se email já existe
    const existing = await sql`SELECT id FROM nutricionistas WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 409 });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const result = await sql`
      INSERT INTO nutricionistas (nome, email, senha_hash)
      VALUES (${nome}, ${email}, ${senhaHash})
      RETURNING id, nome, email
    `;

    const nutricionista = result[0];

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
    console.error('Erro no cadastro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn || !session.nutricionista) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const nid = session.nutricionista.id;
  const body = await req.json();

  const {
    data_consulta,
    peso,
    cintura,
    quadril,
    percentual_gordura,
    observacoes,
    proximo_retorno,
  } = body;

  if (!data_consulta) {
    return NextResponse.json({ error: 'Data da consulta é obrigatória.' }, { status: 400 });
  }

  try {
    // Valida se o paciente pertence a esta nutricionista
    const check = await sql`
      SELECT id FROM pacientes WHERE id = ${id} AND nutricionista_id = ${nid} LIMIT 1
    `;
    if (check.length === 0) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });
    }

    const result = await sql`
      INSERT INTO consultas (
        paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
      ) VALUES (
        ${id},
        ${data_consulta},
        ${peso ? parseFloat(peso) : null},
        ${cintura ? parseFloat(cintura) : null},
        ${quadril ? parseFloat(quadril) : null},
        ${percentual_gordura ? parseFloat(percentual_gordura) : null},
        ${observacoes || null},
        ${proximo_retorno || null}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar consulta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

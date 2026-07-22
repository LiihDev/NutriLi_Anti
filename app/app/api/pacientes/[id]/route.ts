import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET(
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

  try {
    // Busca paciente
    const patientRows = await sql`
      SELECT * FROM pacientes
      WHERE id = ${id} AND nutricionista_id = ${nid}
      LIMIT 1
    `;

    if (patientRows.length === 0) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });
    }

    const paciente = patientRows[0];

    // Busca consultas
    const consultas = await sql`
      SELECT * FROM consultas
      WHERE paciente_id = ${id}
      ORDER BY data_consulta DESC, created_at DESC
    `;

    // Busca planos alimentares
    const planos = await sql`
      SELECT id, conteudo, created_at FROM planos_alimentares
      WHERE paciente_id = ${id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ paciente, consultas, planos });
  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(
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
    nome, data_nascimento, sexo, telefone, whatsapp, email,
    peso_inicial, altura,
    objetivos, objetivo_texto, nivel_atividade,
    patologias, restricoes_alimentares, alergias,
    medicamentos, suplementos,
    refeicoes_por_dia, horario_acorda, horario_dorme,
    litros_agua, atividade_fisica, atividade_fisica_descricao,
    observacoes,
  } = body;

  if (!nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  }

  try {
    // Garante que o paciente pertence à nutricionista
    const check = await sql`
      SELECT id FROM pacientes WHERE id = ${id} AND nutricionista_id = ${nid} LIMIT 1
    `;
    if (check.length === 0) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });
    }

    await sql`
      UPDATE pacientes SET
        nome = ${nome.trim()},
        data_nascimento = ${data_nascimento || null},
        sexo = ${sexo || null},
        telefone = ${telefone || null},
        whatsapp = ${whatsapp || null},
        email = ${email || null},
        peso_inicial = ${peso_inicial || null}, -- Atualiza com o valor editado do peso
        altura = ${altura || null},
        objetivos = ${objetivos?.length ? objetivos : null},
        objetivo_texto = ${objetivo_texto || null},
        nivel_atividade = ${nivel_atividade || null},
        patologias = ${patologias?.length ? patologias : null},
        restricoes_alimentares = ${restricoes_alimentares?.length ? restricoes_alimentares : null},
        alergias = ${alergias?.length ? alergias : null},
        medicamentos = ${medicamentos || null},
        suplementos = ${suplementos || null},
        refeicoes_por_dia = ${refeicoes_por_dia || null},
        horario_acorda = ${horario_acorda || null},
        horario_dorme = ${horario_dorme || null},
        litros_agua = ${litros_agua || null},
        atividade_fisica = ${atividade_fisica ?? null},
        atividade_fisica_descricao = ${atividade_fisica_descricao || null},
        observacoes = ${observacoes || null}
      WHERE id = ${id} AND nutricionista_id = ${nid}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

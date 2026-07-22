import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

// GET — lista todos os pacientes da nutricionista logada
export async function GET() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn || !session.nutricionista)
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const nid = session.nutricionista.id;

  const rows = await sql`
    SELECT
      p.id,
      p.nome,
      p.objetivos,
      p.objetivo_texto,
      p.email,
      p.telefone,
      p.created_at,
      (
        SELECT MAX(c.data_consulta)
        FROM consultas c
        WHERE c.paciente_id = p.id
      ) AS ultima_consulta
    FROM pacientes p
    WHERE p.nutricionista_id = ${nid}
    ORDER BY p.nome ASC
  `;

  return NextResponse.json(rows);
}

// POST — cria um novo paciente
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn || !session.nutricionista)
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

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

  if (!nome?.trim())
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });

  const result = await sql`
    INSERT INTO pacientes (
      nutricionista_id, nome, data_nascimento, sexo, telefone, whatsapp, email,
      peso_inicial, altura,
      objetivos, objetivo_texto, nivel_atividade,
      patologias, restricoes_alimentares, alergias,
      medicamentos, suplementos,
      refeicoes_por_dia, horario_acorda, horario_dorme,
      litros_agua, atividade_fisica, atividade_fisica_descricao,
      observacoes
    ) VALUES (
      ${nid},
      ${nome.trim()},
      ${data_nascimento || null},
      ${sexo || null},
      ${telefone || null},
      ${whatsapp || null},
      ${email || null},
      ${peso_inicial || null},
      ${altura || null},
      ${objetivos?.length ? objetivos : null},
      ${objetivo_texto || null},
      ${nivel_atividade || null},
      ${patologias?.length ? patologias : null},
      ${restricoes_alimentares?.length ? restricoes_alimentares : null},
      ${alergias?.length ? alergias : null},
      ${medicamentos || null},
      ${suplementos || null},
      ${refeicoes_por_dia || null},
      ${horario_acorda || null},
      ${horario_dorme || null},
      ${litros_agua || null},
      ${atividade_fisica ?? null},
      ${atividade_fisica_descricao || null},
      ${observacoes || null}
    )
    RETURNING id
  `;

  return NextResponse.json({ id: result[0].id }, { status: 201 });
}

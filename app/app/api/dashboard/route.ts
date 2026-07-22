import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn || !session.nutricionista) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const nutricionistaId = session.nutricionista.id;

  try {
    // Card 1 — Total de pacientes
    const totalResult = await sql`
      SELECT COUNT(*) AS total
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}
    `;
    const totalPacientes = Number(totalResult[0]?.total ?? 0);

    // Card 2 — Consultas da semana atual
    const consultasResult = await sql`
      SELECT COUNT(*) AS total
      FROM consultas c
      INNER JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
        AND c.data_consulta < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    `;
    const consultasSemana = Number(consultasResult[0]?.total ?? 0);

    // Card 3 — Pacientes sem retorno (última consulta > 30 dias e sem próximo retorno)
    const semRetornoResult = await sql`
      SELECT DISTINCT ON (p.id) p.id, p.nome,
             c.data_consulta AS ultima_consulta
      FROM pacientes p
      INNER JOIN consultas c ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.proximo_retorno IS NULL
      ORDER BY p.id, c.data_consulta DESC
    `;

    const semRetorno = semRetornoResult.filter((row: any) => {
      const ultima = new Date(row.ultima_consulta);
      const diffDias = (Date.now() - ultima.getTime()) / (1000 * 60 * 60 * 24);
      return diffDias > 30;
    }).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      ultimaConsulta: row.ultima_consulta,
    }));

    // Consultas recentes do nutricionista
    const consultasRecentes = await sql`
      SELECT c.id, c.data_consulta, p.nome AS paciente_nome, p.id AS paciente_id
      FROM consultas c
      INNER JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
      ORDER BY c.data_consulta DESC, c.created_at DESC
      LIMIT 5
    `;

    // Card 4 — Planos gerados (total)
    const planosResult = await sql`
      SELECT COUNT(*) AS total
      FROM planos_alimentares pl
      INNER JOIN pacientes p ON pl.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
    `;
    const planosGerados = Number(planosResult[0]?.total ?? 0);

    // Gamificação — Novos pacientes nesta semana
    const novosPacientesResult = await sql`
      SELECT COUNT(*) AS total
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}
        AND created_at >= date_trunc('week', CURRENT_DATE)
    `;
    const novosPacientesSemana = Number(novosPacientesResult[0]?.total ?? 0);

    return NextResponse.json({
      totalPacientes,
      consultasSemana,
      semRetorno,
      consultasRecentes,
      planosGerados,
      novosPacientesSemana,
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

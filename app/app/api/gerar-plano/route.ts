import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

function gerarPlanoMock(paciente: any) {
  const dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  
  // Customizações baseadas em restrições
  const rests = paciente.restricoes_alimentares || [];
  const algs = paciente.alergias || [];
  const isZeroLactose = rests.some((r: string) => r.toLowerCase().includes('lactose')) || algs.some((a: string) => a.toLowerCase().includes('leite'));
  const isGlutenFree = rests.some((r: string) => r.toLowerCase().includes('glúten')) || algs.some((a: string) => a.toLowerCase().includes('trigo'));
  
  const pao = isGlutenFree ? 'Pão de fôrma sem glúten' : 'Pão integral torrado';
  const leite = isZeroLactose ? 'Leite de amêndoas ou zero lactose' : 'Leite desnatado';
  const queijo = isZeroLactose ? 'Queijo tofu ou zero lactose' : 'Queijo minas frescal';
  const aveia = isGlutenFree ? 'Aveia sem glúten' : 'Aveia integral';

  return dias.map(dia => ({
    dia,
    refeicoes: {
      cafe_da_manha: [
        `1 copo de ${leite} com café (sem açúcar)`,
        `2 fatias de ${pao} com 1 fatia de ${queijo}`,
        `1/2 mamão papaia com 1 colher de sopa de chia`,
        `Omelete de 2 ovos com espinafre e orégano`,
        `Suco verde detox (couve, limão e gengibre)`
      ],
      lanche_manha: [
        `1 maçã média picada com canela`,
        `Mix de castanhas (3 castanhas-do-pará e 4 amêndoas)`,
        `1 pote de iogurte natural ${isZeroLactose ? 'zero lactose' : 'desnatado'}`,
        `1 banana de prata média`,
        `3 colheres de sopa de abacate amassado com limão`
      ],
      almoco: [
        `150g de peito de frango grelhado em tiras`,
        `3 colheres de sopa de arroz integral cozido`,
        `1 concha média de feijão carioca`,
        `Prato de salada de alface crespa, tomate cereja e pepino`,
        `Sobremesa: 1 fatia média de abacaxi`
      ],
      lanche_tarde: [
        `1 xícara de chá verde morno`,
        `2 torradas ${isGlutenFree ? 'sem glúten' : 'integrais'} com homus de grão-de-bico`,
        `1 pera madura`,
        `1 banana picada com 1 colher de sobremesa de farelo de aveia`,
        `1 copo de água de coco natural`
      ],
      jantar: [
        `140g de filé de tilápia grelhada no azeite`,
        `100g de purê de batata doce com noz-moscada`,
        `Brócolis e cenoura cozidos no vapor com alho e ervas`,
        `Prato de folhas verdes escuras com rúcula e agrião`,
        `Sobremesa: 1/2 laranja bahia`
      ]
    }
  }));
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn || !session.nutricionista) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { pacienteId } = await req.json();
  if (!pacienteId) {
    return NextResponse.json({ error: 'ID do paciente é obrigatório.' }, { status: 400 });
  }

  const nid = session.nutricionista.id;

  try {
    // 1. Busca paciente
    const patientRows = await sql`
      SELECT * FROM pacientes
      WHERE id = ${pacienteId} AND nutricionista_id = ${nid}
      LIMIT 1
    `;

    if (patientRows.length === 0) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });
    }

    const paciente = patientRows[0];

    // 2. Verifica se a API Key está configurada. Se não, retorna plano customizado de fallback.
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'insira-sua-api-key-do-groq-aqui' || apiKey.trim() === '') {
      console.warn('GROQ_API_KEY não configurada no servidor. Utilizando plano de fallback customizado.');
      const planoMock = gerarPlanoMock(paciente);
      return NextResponse.json({ plano_semanal: planoMock });
    }

    // 3. Monta descrição detalhada dos dados do paciente para a IA
    const infoPaciente = `
      Nome: ${paciente.nome}
      Sexo: ${paciente.sexo || 'Não informado'}
      Peso Inicial: ${paciente.peso_inicial || 'Não informado'} kg
      Altura: ${paciente.altura || 'Não informado'} cm
      Objetivos: ${paciente.objetivos?.join(', ') || 'Não informados'}
      Objetivo Adicional: ${paciente.objetivo_texto || 'Não informado'}
      Nível de Atividade: ${paciente.nivel_atividade || 'Não informado'}
      Patologias/Condições: ${paciente.patologias?.join(', ') || 'Nenhuma'}
      Restrições Alimentares: ${paciente.restricoes_alimentares?.join(', ') || 'Nenhuma'}
      Alergias: ${paciente.alergias?.join(', ') || 'Nenhuma'}
      Medicamentos: ${paciente.medicamentos || 'Nenhum'}
      Suplementos: ${paciente.suplementos || 'Nenhum'}
      Refeições ao dia desejadas: ${paciente.refeicoes_por_dia || 'Não informado'}
      Horários: Acorda às ${paciente.horario_acorda || 'Não informado'}, Dorme às ${paciente.horario_dorme || 'Não informado'}
      Meta de Água: ${paciente.litros_agua || 'Não informado'} litros/dia
      Atividade física atual: ${paciente.atividade_fisica ? 'Sim' : 'Não'} (${paciente.atividade_fisica_descricao || '—'})
      Observações gerais: ${paciente.observacoes || 'Nenhuma'}
    `;

    // 4. Executa a chamada para a API do Groq (compatível com OpenAI SDK format)
    const systemPrompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos.
# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    ... (repita para Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado e Domingo)
  ]
}`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Dados do Paciente:\n${infoPaciente}` }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('Erro na API do Groq:', errorData);
      throw new Error('Falha ao conectar com a API do Groq.');
    }

    const data = await groqResponse.json();
    let responseText = data.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Retorno vazio da API de Inteligência Artificial.');
    }

    // Valida se é um JSON parseável
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Erro ao gerar plano alimentar:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar o plano com IA no momento. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

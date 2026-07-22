'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

interface Nutricionista { id: string; nome: string; email: string; }

interface Paciente {
  id: string;
  nome: string;
  data_nascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  peso_inicial: string | null;
  altura: string | null;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  nivel_atividade: string | null;
  patologias: string[] | null;
  restricoes_alimentares: string[] | null;
  alergias: string[] | null;
  medicamentos: string | null;
  suplementos: string | null;
  refeicoes_por_dia: number | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
  created_at?: string;
  litros_agua: string | null;
  atividade_fisica: boolean | null;
  atividade_fisica_descricao: string | null;
  observacoes: string | null;
}

interface Consulta {
  id: string;
  data_consulta: string;
  peso: string | null;
  cintura: string | null;
  quadril: string | null;
  percentual_gordura: string | null;
  observacoes: string | null;
  proximo_retorno: string | null;
}

interface PlanoAlimentar {
  id: string;
  created_at: string;
  conteudo?: any;
}

// ── Helpers ──────────────────────────────────
function iniciais(nome: string) {
  return nome ? nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
}

function calcIdade(dataNasc: string | null): number | null {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function calcIMC(peso: string | null, altura: string | null) {
  if (!peso || !altura) return null;
  const p = parseFloat(peso);
  const a = parseFloat(altura) / 100;
  if (!p || !a) return null;
  const imc = p / (a * a);
  let label = '', color = '';
  if (imc < 18.5)      { label = 'Abaixo do peso'; color = '#3b82f6'; }
  else if (imc < 25)   { label = 'Peso normal';    color = '#22c55e'; }
  else if (imc < 30)   { label = 'Sobrepeso';       color = '#f59e0b'; }
  else if (imc < 35)   { label = 'Obesidade I';     color = '#ef4444'; }
  else if (imc < 40)   { label = 'Obesidade II';    color = '#dc2626'; }
  else                 { label = 'Obesidade III';   color = '#991b1b'; }
  return { valor: Math.round(imc * 10) / 10, label, color };
}

function calcGastoEnergetico(peso: string | null, altura: string | null, idade: number | null, sexo: string | null, nivelAtividade: string | null) {
  if (!peso || !altura || idade === null || !sexo) return null;
  const w = parseFloat(peso);
  const h = parseFloat(altura);
  if (!w || !h) return null;

  // Mifflin-St Jeor
  let tmb = 0;
  const isMasculino = sexo.toLowerCase().startsWith('m') || sexo.toLowerCase().includes('masc');
  if (isMasculino) {
    tmb = 10 * w + 6.25 * h - 5 * idade + 5;
  } else {
    tmb = 10 * w + 6.25 * h - 5 * idade - 161;
  }

  let fator = 1.2;
  const act = nivelAtividade || '';
  if (act.includes('Levemente')) fator = 1.375;
  else if (act.includes('Moderadamente')) fator = 1.55;
  else if (act.includes('Muito') || act.includes('Ativo')) fator = 1.725;
  else if (act.includes('Extremamente')) fator = 1.9;

  const get = tmb * fator;

  return {
    tmb: Math.round(tmb),
    get: Math.round(get),
    fator
  };
}

function calcMacros(get: number, peso: string | null, objetivos: string[] | null) {
  const w = peso ? parseFloat(peso) : 70;
  const objs = objetivos || [];
  
  let protGg = 2.0; 
  let gordGg = 1.0; 
  let kcalTarget = get;

  const isEmagrecimento = objs.some(o => o.toLowerCase().includes('perda') || o.toLowerCase().includes('emagrecer') || o.toLowerCase().includes('peso'));
  const isGanho = objs.some(o => o.toLowerCase().includes('ganho') || o.toLowerCase().includes('massa') || o.toLowerCase().includes('hipertrofia'));

  if (isEmagrecimento) {
    protGg = 2.2;
    gordGg = 0.8;
    kcalTarget = Math.max(1200, get - 500); 
  } else if (isGanho) {
    protGg = 2.0;
    gordGg = 1.0;
    kcalTarget = get + 300; 
  }

  const protG = Math.round(w * protGg);
  const protKcal = protG * 4;

  const gordG = Math.round(w * gordGg);
  const gordKcal = gordG * 9;

  const carbKcal = Math.max(0, kcalTarget - (protKcal + gordKcal));
  const carbG = Math.round(carbKcal / 4);

  return {
    kcalTarget: Math.round(kcalTarget),
    protG,
    protKcal,
    gordG,
    gordKcal,
    carbG,
    carbKcal: Math.round(carbKcal)
  };
}

function formatData(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatHora(raw: string): string {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return raw;
  if (n < 100) return `${String(n).padStart(2, '0')}:00`;
  const h = Math.floor(n / 100);
  const m = n % 100;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const OBJETIVOS_OPTS = ['Emagrecer','Ganhar massa','Controlar diabetes','Saúde geral','Performance esportiva','Reeducação alimentar'];
const ATIVIDADE_OPTS = ['Sedentário','Levemente ativo','Moderadamente ativo','Muito ativo','Extremamente ativo'];
const PATOLOGIAS_OPTS = ['Diabetes','Hipertensão','Hipotireoidismo','Hipertireoidismo','Síndrome do ovário policístico','Doença celíaca','Colesterol alto'];
const RESTRICOES_OPTS = ['Lactose','Glúten','Açúcar','Carne vermelha','Frutos do mar'];
const ALERGIAS_OPTS = ['Amendoim','Leite','Ovo','Soja','Trigo','Frutos do mar'];
const SEXO_OPTS = ['Feminino','Masculino','Outro'];

// ── Sidebar ─────────────────────
function Sidebar({ nutricionista, onLogout }: { nutricionista: Nutricionista; onLogout: () => void }) {
  const pathname = usePathname();
  const navItems = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/pacientes',  icon: 'group', label: 'Pacientes' },
  ];
  const av = iniciais(nutricionista.nome);
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">Nutri<span>Li</span></span>
        <span className="sidebar-logo-sub">Clinical Nutrition</span>
      </div>

      <div style={{ padding: '0 1.5rem 1rem' }}>
        <Link
          href="/pacientes/novo"
          id="btn-sidebar-novo-paciente"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.8rem 1rem',
            background: 'var(--brand-500)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background 0.2s',
            boxShadow: 'var(--shadow-brand)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--brand-600)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--brand-500)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Novo Paciente
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={`sidebar-nav-item${pathname === item.href ? ' active' : ''}`}>
            <span className="material-symbols-outlined sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-promo-card">
          <div className="promo-img-wrapper">
            <Image src="/sidebar-promo.png" alt="Promo" width={64} height={64} style={{ objectFit: 'contain' }} />
          </div>
          <div className="promo-title">Jornada NutriLi</div>
          <div className="promo-text">Gere cardápios e receitas personalizadas com IA em segundos.</div>
          <Link href="/pacientes" className="promo-btn">Começar</Link>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{nutricionista.nome}</div>
            <div className="sidebar-user-email">{nutricionista.email}</div>
          </div>
          <button className="btn-logout" onClick={onLogout} title="Sair">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function PerfilPacienteClient({
  nutricionista,
  pacienteId,
}: {
  nutricionista: Nutricionista;
  pacienteId: string;
}) {
  const router = useRouter();

  // Data fetching state
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState('');
  const [selectedMealOptions, setSelectedMealOptions] = useState<Record<string, number>>({});

  // Navigation tabs state
  const [activeMainTab, setActiveMainTab] = useState(0); // 0: Dados, 1: Consultas, 2: Planos
  const [tab, setTab] = useState(0); // sub-tabs under Dados (0: Pessoal, 1: Clínico, 2: Hábitos)
  const [editMode, setEditMode] = useState(false);

  // Form Fields State
  const [nome, setNome] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmailPac] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [objs, setObjs] = useState<string[]>([]);
  const [objTexto, setObjTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [pats, setPats] = useState<string[]>([]);
  const [rests, setRests] = useState<string[]>([]);
  const [algs, setAlgs] = useState<string[]>([]);
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');
  const [refeicoes, setRefeicoes] = useState('');
  const [acorda, setAcorda] = useState('');
  const [dorme, setDorme] = useState('');
  const [agua, setAgua] = useState('');
  const [atividadeFisica, setAtividadeFisica] = useState(false);
  const [atividadeFisicaDesc, setAtividadeFisicaDesc] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Consultation modal form state
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [cData, setCData] = useState(new Date().toISOString().split('T')[0]);
  const [cPeso, setCPeso] = useState('');
  const [cCintura, setCCintura] = useState('');
  const [cQuadril, setCQuadril] = useState('');
  const [cGordura, setCGordura] = useState('');
  const [cObs, setCObs] = useState('');
  const [cProximo, setCProximo] = useState('');
  const [savingConsult, setSavingConsult] = useState(false);

  // Plan content viewer modal state
  const [selectedPlan, setSelectedPlan] = useState<PlanoAlimentar | null>(null);
  const [activeViewPlanDay, setActiveViewPlanDay] = useState(0);

  // Plan generator state
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [planEditorData, setPlanEditorData] = useState<any[]>([]);
  const [activePlanDay, setActivePlanDay] = useState(0);
  const [planGenerationStep, setPlanGenerationStep] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Plan helpers and templates
  const DIA_TEMPLATE = (dia: string) => ({
    dia,
    refeicoes: {
      cafe_da_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', ''],
    }
  });

  const WEEKLY_PLAN_TEMPLATE = () => [
    DIA_TEMPLATE('Segunda-feira'),
    DIA_TEMPLATE('Terça-feira'),
    DIA_TEMPLATE('Quarta-feira'),
    DIA_TEMPLATE('Quinta-feira'),
    DIA_TEMPLATE('Sexta-feira'),
    DIA_TEMPLATE('Sábado'),
    DIA_TEMPLATE('Domingo'),
  ];

  const sanitizePlanData = (raw: any): any[] => {
    const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const refeicoesChaves = ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'];
    const rawPlan = raw?.plano_semanal || raw || [];

    return diasSemana.map(diaName => {
      const rawDay = Array.isArray(rawPlan)
        ? rawPlan.find((d: any) => d?.dia?.toLowerCase().includes(diaName.split('-')[0].toLowerCase()))
        : null;

      const refeicoes: Record<string, string[]> = {};
      refeicoesChaves.forEach(refKey => {
        let options: string[] = [];
        if (rawDay?.refeicoes && rawDay.refeicoes[refKey]) {
          options = Array.isArray(rawDay.refeicoes[refKey])
            ? rawDay.refeicoes[refKey].map((o: any) => String(o || ''))
            : [String(rawDay.refeicoes[refKey])];
        }
        while (options.length < 5) options.push('');
        options = options.slice(0, 5);
        refeicoes[refKey] = options;
      });

      return { dia: diaName, refeicoes };
    });
  };

  const handleStartPlanGeneration = async () => {
    setIsGeneratingPlan(true);
    setIsEditingPlan(false);
    setShowErrorModal(false);
    setPlanGenerationStep('🔍 Analisando perfil do paciente...');

    const steps = [
      '🔍 Analisando perfil do paciente...',
      '🧬 Cruzando restrições alimentares...',
      '🤖 Chamando o Gemini 2.5 Flash...',
      '🥦 Elaborando opções saudáveis...',
      '✨ Finalizando plano semanal...'
    ];
    let currentStepIdx = 0;
    const interval = setInterval(() => {
      currentStepIdx = (currentStepIdx + 1) % steps.length;
      setPlanGenerationStep(steps[currentStepIdx]);
    }, 2000);

    try {
      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId }),
      });

      clearInterval(interval);

      if (!res.ok) throw new Error();
      const data = await res.json();

      const sanitized = sanitizePlanData(data);
      setPlanEditorData(sanitized);
      setIsEditingPlan(true);
      showNotification('✅ Plano alimentar gerado com sucesso!');
    } catch {
      clearInterval(interval);
      setShowErrorModal(true);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleStartManualPlan = () => {
    setPlanEditorData(WEEKLY_PLAN_TEMPLATE());
    setIsEditingPlan(true);
    setShowErrorModal(false);
  };

  const handleSavePlan = async () => {
    setSavingPlan(true);
    try {
      const res = await fetch(`/api/pacientes/${pacienteId}/planos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: { plano_semanal: planEditorData }
        }),
      });

      if (!res.ok) throw new Error();
      showNotification('✅ Plano alimentar salvo com sucesso!');
      setIsEditingPlan(false);
      loadData();
    } catch {
      showNotification('❌ Erro ao salvar plano alimentar.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleUpdateOption = (dayIdx: number, mealKey: string, optionIdx: number, value: string) => {
    const newData = [...planEditorData];
    newData[dayIdx].refeicoes[mealKey][optionIdx] = value;
    setPlanEditorData(newData);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/pacientes/${pacienteId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPaciente(data.paciente);
      setConsultas(data.consultas);
      setPlanos(data.planos);

      // Populate form state
      const p = data.paciente;
      setNome(p.nome || '');
      setDataNasc(p.data_nascimento ? p.data_nascimento.split('T')[0] : '');
      setSexo(p.sexo || '');
      setTelefone(p.telefone || '');
      setWhatsapp(p.whatsapp || '');
      setEmailPac(p.email || '');
      setPeso(p.peso_inicial || '');
      setAltura(p.altura || '');
      setObjs(p.objetivos || []);
      setObjTexto(p.objetivo_texto || '');
      setNivelAtividade(p.nivel_atividade || '');
      setPats(p.patologias || []);
      setRests(p.restricoes_alimentares || []);
      setAlgs(p.alergias || []);
      setMedicamentos(p.medicamentos || '');
      setSuplementos(p.suplementos || '');
      setRefeicoes(p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '');
      setAcorda(p.horario_acorda || '');
      setDorme(p.horario_dorme || '');
      setAgua(p.litros_agua || '');
      setAtividadeFisica(p.atividade_fisica || false);
      setAtividadeFisicaDesc(p.atividade_fisica_descricao || '');
      setObservacoes(p.observacoes || '');
    } catch {
      setErro('Erro ao carregar dados do paciente.');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpdateProfile = async () => {
    if (!nome.trim()) {
      showNotification('❌ Nome é obrigatório.');
      return;
    }

    try {
      const res = await fetch(`/api/pacientes/${pacienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          data_nascimento: dataNasc || null,
          sexo: sexo || null,
          telefone: telefone || null,
          whatsapp: whatsapp || null,
          email: email || null,
          peso: peso || null,
          altura: altura || null,
          objetivos: objs,
          objetivo_texto: objTexto || null,
          nivel_atividade: nivelAtividade || null,
          patologias: pats,
          restricoes_alimentares: rests,
          alergias: algs,
          medicamentos: medicamentos || null,
          suplementos: suplementos || null,
          refeicoes: refeicoes ? parseInt(refeicoes, 10) : null,
          horario_acorda: acorda || null,
          horario_dorme: dorme || null,
          litros_agua: agua || null,
          atividade_fisica: atividadeFisica,
          atividade_fisica_descricao: atividadeFisicaDesc || null,
          observacoes: observacoes || null,
        }),
      });

      if (!res.ok) throw new Error();
      showNotification('✅ Dados do paciente atualizados!');
      setEditMode(false);
      loadData();
    } catch {
      showNotification('❌ Erro ao atualizar os dados.');
    }
  };

  const handleCreateConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cPeso) {
      showNotification('❌ Peso é obrigatório.');
      return;
    }
    setSavingConsult(true);

    try {
      const res = await fetch(`/api/pacientes/${pacienteId}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_consulta: cData,
          peso: cPeso,
          cintura: cCintura || null,
          quadril: cQuadril || null,
          percentual_gordura: cGordura || null,
          observacoes: cObs || null,
          proximo_retorno: cProximo || null,
        }),
      });

      if (!res.ok) throw new Error();
      showNotification('✅ Nova consulta registrada!');
      setShowConsultModal(false);
      // Reset form
      setCPeso('');
      setCCintura('');
      setCQuadril('');
      setCGordura('');
      setCObs('');
      setCProximo('');
      loadData();
    } catch {
      showNotification('❌ Erro ao salvar consulta.');
    } finally {
      setSavingConsult(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  // ── Computed states ──────────────────────────
  const age = calcIdade(dataNasc);
  const imcVal = calcIMC(peso, altura);
  const av = iniciais(paciente?.nome || '');
  const gastoEnergetico = calcGastoEnergetico(peso, altura, age, sexo, nivelAtividade);
  const macros = gastoEnergetico ? calcMacros(gastoEnergetico.get, peso, objs) : null;

  // SVG Chart data formatting
  const chartPoints = useMemo(() => {
    const pts = [...consultas]
      .filter(c => c.peso !== null)
      .reverse()
      .map(c => ({
        date: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        weight: parseFloat(c.peso as string),
      }));
    if (pts.length === 0 && paciente?.peso_inicial) {
      pts.push({
        date: 'Início',
        weight: parseFloat(paciente.peso_inicial),
      });
    }
    return pts;
  }, [consultas, paciente]);

  // Render weight evolution chart dynamically using SVG
  const renderChart = () => {
    if (chartPoints.length === 0) {
      return (
        <div className="chart-empty">
          <span className="material-symbols-outlined icon-warning" style={{ fontSize: '32px', color: '#9CA3AF' }}>warning</span>
          <p style={{ marginTop: '0.5rem' }}>Nenhuma consulta registrada ainda</p>
        </div>
      );
    }

    const width = 600;
    const height = 200;
    const paddingX = 40;
    const paddingY = 30;

    const weights = chartPoints.map(p => p.weight);
    const maxWeight = Math.max(...weights) + 5;
    const minWeight = Math.max(0, Math.min(...weights) - 5);
    const weightRange = maxWeight - minWeight || 10;

    const points = chartPoints.map((p, idx) => {
      const x = paddingX + (idx / (chartPoints.length - 1 || 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((p.weight - minWeight) / weightRange) * (height - paddingY * 2);
      return { x, y, label: p.date, weight: p.weight };
    });

    let pathD = '';
    let areaD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
    }

    return (
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {points.map((p, i) => (
          <line key={i} x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="var(--gray-200)" strokeWidth={1} strokeDasharray="4 4" />
        ))}
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="var(--gray-200)" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--gray-300)" strokeWidth={1.5} />
        {points.length > 1 && (
          <>
            <path d={areaD} className="chart-area" />
            <path d={pathD} className="chart-line" />
          </>
        )}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={5} className="chart-point" />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--gray-800)">{p.weight} kg</text>
            <text x={p.x} y={height - 12} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--gray-400)">{p.label}</text>
          </g>
        ))}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar nutricionista={nutricionista} onLogout={handleLogout} />
        <main className="dashboard-main">
          <div className="dashboard-topbar">
            <div className="skeleton" style={{ height: '2.5rem', width: '30%' }} />
          </div>
          <div className="dashboard-body">
            <div className="skeleton" style={{ height: '300px', borderRadius: '12px' }} />
          </div>
        </main>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="dashboard-layout">
        <Sidebar nutricionista={nutricionista} onLogout={handleLogout} />
        <main className="dashboard-main">
          <div className="dashboard-body">
            <div className="alert alert-error">Paciente não encontrado.</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar nutricionista={nutricionista} onLogout={handleLogout} />

      <main className="dashboard-main">
        {/* Topbar */}
        <div className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span className="patient-avatar" style={{ width: '40px', height: '40px', fontSize: '0.95rem' }}>{av}</span>
              {paciente.nome}
            </h1>
            <p>Cadastrado em: {new Date(paciente.created_at || '').toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link href="/pacientes" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Voltar
              </Link>

              {activeMainTab === 0 && !isEditingPlan && !isGeneratingPlan && (
                <button
                  onClick={() => {
                    if (editMode) handleUpdateProfile();
                    else setEditMode(true);
                  }}
                  className="btn-green"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  {editMode ? (
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  )}
                  {editMode ? 'Salvar Alterações' : 'Editar Perfil'}
                </button>
              )}

              {activeMainTab === 1 && (
                <button
                  onClick={() => setShowConsultModal(true)}
                  className="btn-green"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  Nova Consulta
                </button>
              )}

              {activeMainTab === 2 && !isEditingPlan && !isGeneratingPlan && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-outline" onClick={handleStartManualPlan}>
                    Criar Manual
                  </button>
                  <button className="btn-green" onClick={handleStartPlanGeneration} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
                    Gerar com IA
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--gray-500)', cursor: 'pointer', fontSize: '22px' }}>notifications</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--gray-500)', cursor: 'pointer', fontSize: '22px' }}>help</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', borderLeft: '1px solid var(--gray-200)', paddingLeft: '1.25rem', height: '24px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--gray-300)', position: 'relative' }}>
                <Image src="/nutritionist-avatar.png" alt="Nutricionista" fill style={{ objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gray-800)', whiteSpace: 'nowrap' }}>{nutricionista.nome}</span>
              <button 
                onClick={handleLogout} 
                title="Sair do sistema" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--gray-400)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  marginLeft: '0.5rem', 
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'color 0.2s' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-400)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Tabbed Nav (Ficha, Consultas, Planos) ── */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '0 2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { idx: 0, label: 'Ficha do Paciente', icon: 'person' },
              { idx: 1, label: 'Consultas & Evolução', icon: 'calendar_today' },
              { idx: 2, label: 'Planos Alimentares', icon: 'description' }
            ].map(tabItem => (
              <button
                key={tabItem.idx}
                onClick={() => {
                  if (!isGeneratingPlan && !isEditingPlan) {
                    setActiveMainTab(tabItem.idx);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 0.25rem',
                  border: 'none',
                  borderBottom: activeMainTab === tabItem.idx ? '3px solid var(--brand-600)' : '3px solid transparent',
                  background: 'transparent',
                  color: activeMainTab === tabItem.idx ? 'var(--brand-700)' : 'var(--gray-500)',
                  fontWeight: activeMainTab === tabItem.idx ? '700' : '500',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  cursor: (isGeneratingPlan || isEditingPlan) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: (isGeneratingPlan || isEditingPlan) ? 0.5 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tabItem.icon}</span>
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body — Unified View */}
        <div className="dashboard-body" style={{ padding: '1.5rem 2rem' }}>

          {isGeneratingPlan ? (
            <div className="loading-overlay-card">
              <span className="material-symbols-outlined ai-pulse-loader" style={{ fontSize: '32px', color: 'var(--brand-500)', marginBottom: '0.5rem' }}>smart_toy</span>
              <div className="loading-text-headline">Elaborando Plano Alimentar com Inteligência Artificial</div>
              <div className="loading-text-subline">{planGenerationStep}</div>
            </div>
          ) : isEditingPlan ? (
            <div className="plan-editor-card">
              <div className="plan-editor-header">
                <span className="plan-editor-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)' }}>restaurant_menu</span>
                  Editando Plano Alimentar Semanal
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-outline" onClick={() => setIsEditingPlan(false)}>Cancelar</button>
                  <button className="btn-green" onClick={handleSavePlan} disabled={savingPlan}>
                    {savingPlan ? 'Salvando...' : '✓ Salvar Plano Alimentar'}
                  </button>
                </div>
              </div>

              <div className="plan-days-tabs">
                {planEditorData.map((d, idx) => (
                  <button
                    key={idx}
                    className={`plan-day-tab${activePlanDay === idx ? ' active' : ''}`}
                    onClick={() => setActivePlanDay(idx)}
                  >
                    {d.dia}
                  </button>
                ))}
              </div>

              <div className="plan-editor-body">
                <div className="meals-grid">
                  {(() => {
                    const activeDay = planEditorData[activePlanDay];
                    const refNomes: Record<string, string> = {
                      cafe_da_manha: 'Café da Manhã',
                      lanche_manha: 'Lanche da Manhã',
                      almoco: 'Almoço',
                      lanche_tarde: 'Lanche da Tarde',
                      jantar: 'Jantar'
                    };

                    if (!activeDay) return null;

                    return Object.entries(refNomes).map(([mealKey, mealTitle]) => {
                      const options = activeDay.refeicoes[mealKey] || ['', '', '', '', ''];
                      return (
                        <div key={mealKey} className="meal-card-edit">
                          <div className="meal-card-header">{mealTitle}</div>
                          <div className="meal-card-body">
                            {options.map((opt: string, optIdx: number) => (
                              <div key={optIdx} className="meal-option-group">
                                <span className="meal-option-lbl">Opção {optIdx + 1}</span>
                                <input
                                  className="meal-option-input"
                                  type="text"
                                  value={opt}
                                  onChange={e => handleUpdateOption(activePlanDay, mealKey, optIdx, e.target.value)}
                                  placeholder="Digite a opção alimentar..."
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── TAB 0: FICHA DO PACIENTE ──────────────────── */}
              {activeMainTab === 0 && (
                <div className="profile-card">
                  <div className="profile-card-header">
                    <span className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)' }}>person</span>
                      Ficha do Paciente
                    </span>
                  </div>
                <div className="form-tabs" style={{ padding: '0.5rem 1rem 0' }}>
                  {TABS.map((t, idx) => (
                    <button
                      key={t.id}
                      className={`form-tab${tab === idx ? ' active' : ''}`}
                      onClick={() => setTab(idx)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="profile-card-body" style={{ padding: '1.5rem' }}>
                    {tab === 0 && (
                      <div className="form-grid">
                        <div className="form-group form-full">
                          <label className="form-label">Nome completo</label>
                          <input
                            className="form-input"
                            type="text"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            disabled={!editMode}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Data de nascimento</label>
                          <input
                            className="form-input"
                            type="date"
                            value={dataNasc}
                            onChange={e => setDataNasc(e.target.value)}
                            disabled={!editMode}
                          />
                          {age !== null && (
                            <div className="age-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cake</span>
                              {age} anos
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Sexo</label>
                          {editMode ? (
                            <div className="radio-group">
                              {SEXO_OPTS.map(s => (
                                <RadioChip key={s} label={s} checked={sexo === s} onChange={() => setSexo(s)} />
                              ))}
                            </div>
                          ) : (
                            <input className="form-input" type="text" value={sexo || '—'} disabled />
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Telefone</label>
                          <input
                            className="form-input"
                            type="tel"
                            value={telefone}
                            onChange={e => setTelefone(e.target.value)}
                            disabled={!editMode}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">WhatsApp</label>
                          <input
                            className="form-input"
                            type="tel"
                            value={whatsapp}
                            onChange={e => setWhatsapp(e.target.value)}
                            disabled={!editMode}
                          />
                        </div>
                        <div className="form-group form-full">
                          <label className="form-label">Email</label>
                          <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={e => setEmailPac(e.target.value)}
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                    )}

                    {tab === 1 && (
                      <div>
                        <div className="form-grid-3">
                          <div className="form-group">
                            <label className="form-label">Peso inicial</label>
                            <div className="input-with-suffix">
                              <input
                                className="form-input"
                                type="number"
                                step="0.1"
                                value={peso}
                                onChange={e => setPeso(e.target.value)}
                                disabled={!editMode}
                              />
                              <span className="input-suffix">kg</span>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Altura</label>
                            <div className="input-with-suffix">
                              <input
                                className="form-input"
                                type="number"
                                value={altura}
                                onChange={e => setAltura(e.target.value)}
                                disabled={!editMode}
                              />
                              <span className="input-suffix">cm</span>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">IMC</label>
                            <div className="imc-field">
                              {imcVal ? (
                                <>
                                  <span className="imc-value">{imcVal.valor}</span>
                                  <span className="imc-label" style={{ background: imcVal.color + '20', color: imcVal.color }}>{imcVal.label}</span>
                                </>
                              ) : (
                                <span style={{ color: 'var(--gray-400)' }}>—</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Gasto Energético & Macros */}
                        {gastoEnergetico && macros && (
                          <div style={{ marginTop: '1.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--brand-700)', fontWeight: '700', fontSize: '0.95rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calculate</span>
                              Estimativa de Gasto Energético & Macronutrientes
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                              <div style={{ background: '#FFFFFF', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>TMB (Mifflin-St Jeor)</span>
                                <strong style={{ display: 'block', fontSize: '1.25rem', color: '#1E293B', marginTop: '0.25rem' }}>{gastoEnergetico.tmb} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#64748B' }}>kcal</span></strong>
                              </div>
                              <div style={{ background: '#FFFFFF', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>GET (Gasto Total)</span>
                                <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--brand-600)', marginTop: '0.25rem' }}>{gastoEnergetico.get} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#64748B' }}>kcal</span></strong>
                              </div>
                              <div style={{ background: '#FFFFFF', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Meta Calórica Diária</span>
                                <strong style={{ display: 'block', fontSize: '1.25rem', color: '#0EA5E9', marginTop: '0.25rem' }}>{macros.kcalTarget} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#64748B' }}>kcal</span></strong>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>{objs.some(o => o.toLowerCase().includes('perda') || o.toLowerCase().includes('peso')) ? 'Déficit (-500 kcal)' : objs.some(o => o.toLowerCase().includes('ganho') || o.toLowerCase().includes('massa')) ? 'Superávit (+300 kcal)' : 'Manutenção'}</span>
                              </div>
                            </div>

                            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '1rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '0.75rem' }}>Distribuição de Macronutrientes Sugerida</span>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                <div style={{ background: '#FFFDF5', border: '1px solid #FEF08A', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#854D0E', fontWeight: '600', display: 'block' }}>Carboidratos</span>
                                  <strong style={{ fontSize: '1.1rem', color: '#A16207', display: 'block', margin: '0.2rem 0' }}>{macros.carbG}g</strong>
                                  <span style={{ fontSize: '0.7rem', color: '#CA8A04' }}>{macros.carbKcal} kcal</span>
                                </div>
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: '600', display: 'block' }}>Proteínas</span>
                                  <strong style={{ fontSize: '1.1rem', color: '#1D4ED8', display: 'block', margin: '0.2rem 0' }}>{macros.protG}g</strong>
                                  <span style={{ fontSize: '0.7rem', color: '#2563EB' }}>{macros.protKcal} kcal</span>
                                </div>
                                <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#9D174D', fontWeight: '600', display: 'block' }}>Gorduras</span>
                                  <strong style={{ fontSize: '1.1rem', color: '#BE185D', display: 'block', margin: '0.2rem 0' }}>{macros.gordG}g</strong>
                                  <span style={{ fontSize: '0.7rem', color: '#DB2777' }}>{macros.gordKcal} kcal</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="form-section-title">Objetivos</div>
                        <div className="form-group">
                          <label className="form-label">Objetivos da consulta</label>
                          {editMode ? (
                            <div className="checkbox-group">
                              {OBJETIVOS_OPTS.map(o => (
                                <CheckboxChip key={o} label={o} checked={objs.includes(o)} onChange={() => toggleArr(objs, setObjs, o)} />
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                              {objs.length > 0 ? objs.map(o => (
                                <span key={o} className="tag tag-green">{o}</span>
                              )) : '—'}
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Objetivo adicional</label>
                          <input
                            className="form-input"
                            type="text"
                            value={objTexto}
                            onChange={e => setObjTexto(e.target.value)}
                            disabled={!editMode}
                          />
                        </div>

                        <div className="form-section-title">Atividade física</div>
                        <div className="form-group">
                          <label className="form-label">Nível de atividade</label>
                          {editMode ? (
                            <div className="radio-group">
                              {ATIVIDADE_OPTS.map(a => (
                                <RadioChip key={a} label={a} checked={nivelAtividade === a} onChange={() => setNivelAtividade(a)} />
                              ))}
                            </div>
                          ) : (
                            <input className="form-input" type="text" value={nivelAtividade || '—'} disabled />
                          )}
                        </div>

                        <div className="form-section-title">Condições de saúde</div>
                        <div className="form-group">
                          <label className="form-label">Patologias</label>
                          {editMode ? (
                            <div className="checkbox-group">
                              {PATOLOGIAS_OPTS.map(p => (
                                <CheckboxChip key={p} label={p} checked={pats.includes(p)} onChange={() => toggleArr(pats, setPats, p)} />
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                              {pats.length > 0 ? pats.map(p => (
                                <span key={p} className="tag tag-gray" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>{p}</span>
                              )) : '—'}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Restrições alimentares</label>
                          {editMode ? (
                            <div className="checkbox-group">
                              {RESTRICOES_OPTS.map(r => (
                                <CheckboxChip key={r} label={r} checked={rests.includes(r)} onChange={() => toggleArr(rests, setRests, r)} />
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                              {rests.length > 0 ? rests.map(r => (
                                <span key={r} className="tag tag-gray">{r}</span>
                              )) : '—'}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Alergias alimentares</label>
                          {editMode ? (
                            <div className="checkbox-group">
                              {ALERGIAS_OPTS.map(a => (
                                <CheckboxChip key={a} label={a} checked={algs.includes(a)} onChange={() => toggleArr(algs, setAlgs, a)} />
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                              {algs.length > 0 ? algs.map(a => (
                                <span key={a} className="tag tag-gray">{a}</span>
                              )) : '—'}
                            </div>
                          )}
                        </div>

                        <div className="form-section-title">Tratamentos</div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Medicamentos contínuos</label>
                            <textarea
                              className="form-textarea"
                              value={medicamentos}
                              onChange={e => setMedicamentos(e.target.value)}
                              disabled={!editMode}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Suplementos em uso</label>
                            <textarea
                              className="form-textarea"
                              value={suplementos}
                              onChange={e => setSuplementos(e.target.value)}
                              disabled={!editMode}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {tab === 2 && (
                      <div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Refeições por dia</label>
                            <input
                              className="form-input"
                              type="number"
                              value={refeicoes}
                              onChange={e => setRefeicoes(e.target.value)}
                              disabled={!editMode}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Água por dia</label>
                            <div className="input-with-suffix">
                              <input
                                className="form-input"
                                type="number"
                                step="0.1"
                                value={agua}
                                onChange={e => setAgua(e.target.value)}
                                disabled={!editMode}
                              />
                              <span className="input-suffix">litros</span>
                            </div>
                          </div>
                        </div>

                        <div className="form-section-title">Sono</div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Horário que acorda</label>
                            <input
                              className="form-input"
                              type="text"
                              value={acorda}
                              onChange={e => setAcorda(e.target.value)}
                              onBlur={e => setAcorda(formatHora(e.target.value))}
                              disabled={!editMode}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Horário que dorme</label>
                            <input
                              className="form-input"
                              type="text"
                              value={dorme}
                              onChange={e => setDorme(e.target.value)}
                              onBlur={e => setDorme(formatHora(e.target.value))}
                              disabled={!editMode}
                            />
                          </div>
                        </div>

                        <div className="form-section-title">Atividade física</div>
                        <div
                          className="toggle-row"
                          onClick={() => editMode && setAtividadeFisica(!atividadeFisica)}
                          style={{ cursor: editMode ? 'pointer' : 'default' }}
                        >
                          <span className="toggle-label">Pratica atividade física?</span>
                          <div className={`toggle-switch${atividadeFisica ? ' on' : ''}`}>
                            <div className="toggle-knob" />
                          </div>
                        </div>
                        {atividadeFisica && (
                          <div className="form-group" style={{ marginTop: '0.875rem' }}>
                            <label className="form-label">Qual atividade e frequência</label>
                            <textarea
                              className="form-textarea"
                              value={atividadeFisicaDesc}
                              onChange={e => setAtividadeFisicaDesc(e.target.value)}
                              disabled={!editMode}
                            />
                          </div>
                        )}

                        <div className="form-section-title">Outros</div>
                        <div className="form-group">
                          <label className="form-label">Observações gerais</label>
                          <textarea
                            className="form-textarea"
                            value={observacoes}
                            onChange={e => setObservacoes(e.target.value)}
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                    )}

                    {editMode && (
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn-outline" onClick={() => setEditMode(false)}>Cancelar</button>
                        <button className="btn-green" onClick={handleUpdateProfile}>Salvar alterações</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB 1: CONSULTAS & EVOLUÇÃO ───────────────── */}
              {activeMainTab === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Evolução de Peso */}
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <span className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)' }}>trending_up</span>
                        Evolução de Peso
                      </span>
                    </div>
                    <div className="profile-card-body">
                      <div className="chart-container" style={{ padding: '1rem' }}>
                        {renderChart()}
                      </div>
                    </div>
                  </div>

                  {/* Histórico de Consultas */}
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <span className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)' }}>history</span>
                        Histórico de Consultas
                      </span>
                    </div>
                    <div className="profile-card-body">
                      <div className="consultations-list">
                        {consultas.length === 0 ? (
                          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray-400)', padding: '2rem 0' }}>
                            Nenhuma consulta cadastrada.
                          </p>
                        ) : (
                          consultas.map(c => (
                            <div key={c.id} className="consultation-item">
                              <div className="consultation-meta">
                                <span className="consultation-date" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
                                  {formatData(c.data_consulta)}
                                </span>
                                {c.proximo_retorno && (
                                  <span className="consultation-retorno" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event_repeat</span>
                                    Retorno: {formatData(c.proximo_retorno)}
                                  </span>
                                )}
                              </div>
                              <div className="consultation-metrics">
                                <div className="metric-box">
                                  <span className="metric-val">{c.peso ? `${c.peso} kg` : '—'}</span>
                                  <span className="metric-lbl">Peso</span>
                                </div>
                                <div className="metric-box">
                                  <span className="metric-val">{c.cintura ? `${c.cintura} cm` : '—'}</span>
                                  <span className="metric-lbl">Cintura</span>
                                </div>
                                <div className="metric-box">
                                  <span className="metric-val">{c.quadril ? `${c.quadril} cm` : '—'}</span>
                                  <span className="metric-lbl">Quadril</span>
                                </div>
                                <div className="metric-box">
                                  <span className="metric-val">{c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}</span>
                                  <span className="metric-lbl">% Gord.</span>
                                </div>
                              </div>
                              {c.observacoes && (
                                <p className="consultation-obs">{c.observacoes}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: PLANOS ALIMENTARES ─────────────────── */}
              {activeMainTab === 2 && (
                <div className="profile-card">
                  <div className="profile-card-header">
                    <span className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)' }}>description</span>
                      Planos Alimentares Salvos
                    </span>
                  </div>
                  <div className="profile-card-body">
                    {planos.length === 0 ? (
                      <div className="empty-state">
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--gray-300)' }}>no_meals</span>
                        <h3>Nenhum plano alimentar gerado ainda</h3>
                        <p>Use a IA do NutriLi ou crie um plano manual para começar.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {planos.map(p => (
                          <div
                            key={p.id}
                            className="plan-item"
                            onClick={() => setSelectedPlan(p)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1.25rem 1.5rem',
                              border: '1px solid var(--gray-200)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              background: 'var(--white)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--brand-300)';
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(79, 111, 82, 0.08)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--gray-200)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(79, 111, 82, 0.15) 0%, rgba(79, 111, 82, 0.05) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--brand-600)',
                                flexShrink: 0,
                                border: '1px solid rgba(79, 111, 82, 0.1)'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>restaurant_menu</span>
                              </div>
                              <div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gray-800)', letterSpacing: '-0.01em' }}>Plano Alimentar Semanal</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                                  Gerado em {new Date(p.created_at).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                            <div style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '20px',
                              background: 'var(--brand-50)',
                              color: 'var(--brand-700)',
                              fontSize: '0.82rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.2s'
                            }}>
                              Visualizar
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ── ERROR CHOICE MODAL ─────────────────────────── */}
      {showErrorModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--danger)' }}>warning</span>
                Erro ao gerar plano
              </span>
              <button className="modal-close" onClick={() => setShowErrorModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                Não foi possível conectar com a IA no momento. Deseja tentar novamente com a IA ou criar o Plano Alimentar Manualmente?
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn-outline" onClick={handleStartManualPlan}>Plano Manual</button>
                <button className="btn-green" onClick={handleStartPlanGeneration}>Tentar com IA</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVA CONSULTA ──────────────────────── */}
      {showConsultModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <span className="modal-title">📝 Registrar Nova Consulta</span>
              <button className="modal-close" onClick={() => setShowConsultModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateConsult}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Data da consulta *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={cData}
                    onChange={e => setCData(e.target.value)}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Peso atual *</label>
                    <div className="input-with-suffix">
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        placeholder="70"
                        value={cPeso}
                        onChange={e => setCPeso(e.target.value)}
                        required
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">% de gordura</label>
                    <div className="input-with-suffix">
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        placeholder="22"
                        value={cGordura}
                        onChange={e => setCGordura(e.target.value)}
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cintura</label>
                    <div className="input-with-suffix">
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        placeholder="80"
                        value={cCintura}
                        onChange={e => setCCintura(e.target.value)}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quadril</label>
                    <div className="input-with-suffix">
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        placeholder="100"
                        value={cQuadril}
                        onChange={e => setCQuadril(e.target.value)}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Próximo retorno</label>
                  <input
                    className="form-input"
                    type="date"
                    value={cProximo}
                    onChange={e => setCProximo(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Observações da consulta</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Anote a evolução, queixas ou feedbacks..."
                    value={cObs}
                    onChange={e => setCObs(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowConsultModal(false)}>Cancelar</button>
                <button type="submit" className="btn-green" disabled={savingConsult}>
                  {savingConsult ? 'Salvando...' : 'Salvar consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW DIETARY PLAN ────────────────────── */}
      {selectedPlan && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)' }}>description</span>
                Plano Alimentar
              </span>
              <button className="modal-close" onClick={() => setSelectedPlan(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                  Criado em {new Date(selectedPlan.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="plan-days-tabs" style={{ background: 'var(--gray-50)', padding: '0 0.5rem 0' }}>
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((diaAbbrev, idx) => (
                  <button
                    key={idx}
                    className={`plan-day-tab${activeViewPlanDay === idx ? ' active' : ''}`}
                    onClick={() => setActiveViewPlanDay(idx)}
                    style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem' }}
                  >
                    {diaAbbrev}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '1rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {(() => {
                  const dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
                  const refNomes: Record<string, string> = {
                    cafe_da_manha: 'Café da Manhã',
                    lanche_manha: 'Lanche da Manhã',
                    almoco: 'Almoço',
                    lanche_tarde: 'Lanche da Tarde',
                    jantar: 'Jantar'
                  };

                  const conteudoPlano = selectedPlan.conteudo?.plano_semanal || selectedPlan.conteudo || [];
                  const diaAtivo = conteudoPlano.find((d: any) =>
                    d?.dia?.toLowerCase().includes(dias[activeViewPlanDay].split('-')[0].toLowerCase())
                  );

                  if (!diaAtivo?.refeicoes) {
                    return <p style={{ fontSize: '0.83rem', color: 'var(--gray-400)', textAlign: 'center', padding: '2rem' }}>Sem refeições cadastradas para este dia.</p>;
                  }

                  // Calculate total calories for the active day based on user selections
                  let totalCalories = 0;
                  Object.keys(refNomes).forEach(refKey => {
                    const options = diaAtivo.refeicoes[refKey] || [];
                    const validOptions = Array.isArray(options) ? options.filter((o: string) => o.trim() !== '') : [];
                    if (validOptions.length > 0) {
                      const selectedIdx = selectedMealOptions[`${activeViewPlanDay}_${refKey}`] ?? 0;
                      const actualIdx = selectedIdx < validOptions.length ? selectedIdx : 0;
                      const chosenOption = validOptions[actualIdx] || '';
                      totalCalories += calcularCalorias(chosenOption, refKey);
                    }
                  });

                  return (
                    <>
                      {/* Calorie Gauge card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #fef6e4, #fdf5ed)',
                        border: '1px solid #fce7bc',
                        borderRadius: 'var(--radius)',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#d4a373' }}>local_fire_department</span>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#78350f', fontWeight: '600' }}>Meta Diária Selecionada</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#78350f' }}>{totalCalories} kcal</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '600', background: 'rgba(255,255,255,0.7)', padding: '0.35rem 0.65rem', borderRadius: '20px', border: '1px solid #fcdb9c' }}>
                          Total das escolhas
                        </div>
                      </div>

                      <div className="plan-viewer-interactive">
                        {Object.entries(refNomes).map(([refKey, refTitle]) => {
                          const options = diaAtivo.refeicoes[refKey] || [];
                          const validOptions = Array.isArray(options) ? options.filter(o => o.trim() !== '') : [];

                          if (validOptions.length === 0) return null;

                          const selectedIdx = selectedMealOptions[`${activeViewPlanDay}_${refKey}`] ?? 0;

                          return (
                            <div key={refKey} className="viewer-meal-item" style={{ marginBottom: '1.5rem' }}>
                              <div className="viewer-meal-title" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--gray-800)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--brand-500)' }}>
                                  {refKey === 'cafe_da_manha' ? 'wb_sunny' : refKey === 'lanche_manha' ? 'nutrition' : refKey === 'almoco' ? 'restaurant' : refKey === 'lanche_tarde' ? 'coffee' : 'bedtime'}
                                </span>
                                {refTitle}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {validOptions.map((opt, oIdx) => {
                                  const isSelected = selectedIdx === oIdx;
                                  const kcal = calcularCalorias(opt, refKey);
                                  return (
                                    <div
                                      key={oIdx}
                                      onClick={() => setSelectedMealOptions(prev => ({ ...prev, [`${activeViewPlanDay}_${refKey}`]: oIdx }))}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.875rem 1rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: isSelected ? '2px solid var(--brand-500)' : '1px solid var(--gray-200)',
                                        background: isSelected ? 'var(--brand-50)' : 'var(--white)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                                      }}
                                      className="viewer-option-row-interactive"
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, paddingRight: '0.5rem' }}>
                                        <div style={{
                                          width: '20px',
                                          height: '20px',
                                          borderRadius: '50%',
                                          border: isSelected ? '6px solid var(--brand-500)' : '2px solid var(--gray-300)',
                                          background: 'var(--white)',
                                          transition: 'all 0.2s',
                                          flexShrink: 0
                                        }} />
                                        <span style={{
                                          fontSize: '0.85rem',
                                          color: isSelected ? 'var(--brand-900)' : 'var(--gray-700)',
                                          fontWeight: isSelected ? '600' : '500',
                                          lineHeight: '1.4'
                                        }}>{opt}</span>
                                      </div>
                                      <span style={{
                                        fontSize: '0.78rem',
                                        fontWeight: '700',
                                        color: isSelected ? 'var(--brand-700)' : 'var(--gray-400)',
                                        background: isSelected ? 'rgba(79,111,82,0.1)' : 'var(--gray-50)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {kcal} kcal
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setSelectedPlan(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

// Sub-Tab definition for Ficha do Paciente
const TABS = [
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'clinico', label: 'Clínico' },
  { id: 'habitos', label: 'Hábitos' },
];

function toggleArr(arr: string[], setArr: (a: string[]) => void, val: string) {
  setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
}

function CheckboxChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`checkbox-chip${checked ? ' selected' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {checked && '✓ '}{label}
    </label>
  );
}

function RadioChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`radio-chip${checked ? ' selected' : ''}`} onClick={onChange}>
      {label}
    </label>
  );
}

function calcularCalorias(texto: string, refKey: string): number {
  if (!texto || texto.trim() === '') return 0;
  
  let kcal = 0;
  const t = texto.toLowerCase();
  
  // Keyword matches
  if (t.includes('ovo')) {
    const numOvosMatch = t.match(/(\d+)\s*ovo/);
    const numOvos = numOvosMatch ? parseInt(numOvosMatch[1], 10) : 2;
    kcal += numOvos * 70;
  }
  if (t.includes('pão') || t.includes('pao') || t.includes('torrada')) {
    kcal += 110;
  }
  if (t.includes('queijo')) {
    kcal += 80;
  }
  if (t.includes('frango') || t.includes('grelhado') || t.includes('peito')) {
    kcal += 180;
  }
  if (t.includes('arroz')) {
    kcal += 130;
  }
  if (t.includes('feijão') || t.includes('feijao')) {
    kcal += 90;
  }
  if (t.includes('leite') || t.includes('iogurte') || t.includes('danone')) {
    kcal += 120;
  }
  if (t.includes('mamão') || t.includes('mamao') || t.includes('banana') || t.includes('maçã') || t.includes('maca') || t.includes('pera') || t.includes('fruta')) {
    kcal += 80;
  }
  if (t.includes('castanhas') || t.includes('amêndoas') || t.includes('amendoas') || t.includes('nozes')) {
    kcal += 140;
  }
  if (t.includes('tilápia') || t.includes('tilapia') || t.includes('peixe') || t.includes('salmão')) {
    kcal += 130;
  }
  if (t.includes('batata') || t.includes('mandioca') || t.includes('purê') || t.includes('pure')) {
    kcal += 150;
  }
  if (t.includes('whey') || t.includes('proteína') || t.includes('suplemento')) {
    kcal += 120;
  }
  if (t.includes('suco')) {
    kcal += 90;
  }
  if (t.includes('azeite') || t.includes('manteiga')) {
    kcal += 60;
  }
  
  // If no keywords matched at all, give a realistic fallback based on the meal type
  if (kcal === 0) {
    if (refKey === 'cafe_da_manha') kcal = 250;
    else if (refKey === 'lanche_manha') kcal = 120;
    else if (refKey === 'almoco') kcal = 480;
    else if (refKey === 'lanche_tarde') kcal = 160;
    else if (refKey === 'jantar') kcal = 420;
    else kcal = 150;
  }
  
  return kcal;
}


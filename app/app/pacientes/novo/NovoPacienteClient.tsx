'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

interface Nutricionista { id: string; nome: string; email: string; }

// ── Helpers ──────────────────────────────────
function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function calcIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function calcIMC(peso: string, altura: string): { valor: number; label: string; color: string } | null {
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

function formatHora(raw: string): string {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return raw;
  if (n < 100) return `${String(n).padStart(2, '0')}:00`;
  const h = Math.floor(n / 100);
  const m = n % 100;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Chip helpers ─────────────────────────────
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

// ── Sidebar (reutilizado) ─────────────────────
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

// ── TABS CONSTANTS ────────────────────────────
const TABS = [
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'clinico', label: 'Clínico' },
  { id: 'habitos', label: 'Hábitos' },
];

const OBJETIVOS_OPTS = ['Emagrecer','Ganhar massa','Controlar diabetes','Saúde geral','Performance esportiva','Reeducação alimentar'];
const ATIVIDADE_OPTS = ['Sedentário','Levemente ativo','Moderadamente ativo','Muito ativo','Extremamente ativo'];
const PATOLOGIAS_OPTS = ['Diabetes','Hipertensão','Hipotireoidismo','Hipertireoidismo','Síndrome do ovário policístico','Doença celíaca','Colesterol alto'];
const RESTRICOES_OPTS = ['Lactose','Glúten','Açúcar','Carne vermelha','Frutos do mar'];
const ALERGIAS_OPTS = ['Amendoim','Leite','Ovo','Soja','Trigo','Frutos do mar'];
const SEXO_OPTS = ['Feminino','Masculino','Outro'];

// ── MAIN COMPONENT ────────────────────────────
export default function NovoPacienteClient({ nutricionista }: { nutricionista: Nutricionista }) {
  const router = useRouter();

  // Tab
  const [tab, setTab] = useState(0);

  // Toast
  const [toast, setToast] = useState('');

  // Loading
  const [saving, setSaving] = useState(false);

  // ── Form state ─────────────
  // Pessoal
  const [nome, setNome] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmailPac] = useState('');

  // Clínico
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [patologiasExtra, setPatologiasExtra] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [restricoesExtra, setRestricoesExtra] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiasExtra, setAlergiasExtra] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Hábitos
  const [refeicoes, setRefeicoes] = useState('');
  const [agua, setAgua] = useState('');
  const [acorda, setAcorda] = useState('');
  const [dorme, setDorme] = useState('');
  const [atividadeFisica, setAtividadeFisica] = useState(false);
  const [atividadeFisicaDesc, setAtividadeFisicaDesc] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Erro
  const [erro, setErro] = useState('');

  // ── Computed ───────────────
  const idade = calcIdade(dataNasc);
  const imc = calcIMC(peso, altura);

  function toggleArr(arr: string[], setArr: (a: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSave() {
    if (!nome.trim()) { setErro('O nome do paciente é obrigatório.'); setTab(0); return; }
    setErro('');
    setSaving(true);
    try {
      const todasPatologias = [...patologias, ...(patologiasExtra ? [patologiasExtra] : [])];
      const todasRestricoes = [...restricoes, ...(restricoesExtra ? [restricoesExtra] : [])];
      const todasAlergias   = [...alergias,   ...(alergiasExtra   ? [alergiasExtra]   : [])];

      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, data_nascimento: dataNasc || null, sexo: sexo || null,
          telefone: telefone || null, whatsapp: whatsapp || null, email: email || null,
          peso_inicial: peso ? parseFloat(peso) : null,
          altura: altura ? parseFloat(altura) : null,
          objetivos: objetivos.length ? objetivos : null,
          objetivo_texto: objetivoTexto || null,
          nivel_atividade: nivelAtividade || null,
          patologias: todasPatologias.length ? todasPatologias : null,
          restricoes_alimentares: todasRestricoes.length ? todasRestricoes : null,
          alergias: todasAlergias.length ? todasAlergias : null,
          medicamentos: medicamentos || null,
          suplementos: suplementos || null,
          refeicoes_por_dia: refeicoes ? parseInt(refeicoes, 10) : null,
          horario_acorda: acorda || null,
          horario_dorme: dorme || null,
          litros_agua: agua || null,
          atividade_fisica: atividadeFisica,
          atividade_fisica_descricao: atividadeFisicaDesc || null,
          observacoes: observacoes || null
        }),
      });

      if (!res.ok) throw new Error();
      const p = await res.json();
      showToast('✓ Paciente cadastrado com sucesso!');
      router.push(`/pacientes/${p.id}`);
      router.refresh();
    } catch {
      setErro('Ocorreu um erro ao salvar o paciente. Verifique se o e-mail já existe.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="dashboard-layout">
      <Sidebar nutricionista={nutricionista} onLogout={handleLogout} />

      <main className="dashboard-main">
        {/* Topbar */}
        <div className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <h1>Cadastrar Novo Paciente</h1>
            <p>Insira as informações do paciente para iniciar o acompanhamento</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/pacientes" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Voltar
            </Link>

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

        {/* Body */}
        <div className="dashboard-body">
          {erro && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
              <span>{erro}</span>
            </div>
          )}

          <div className="form-card">
            {/* TABS */}
            <div className="form-tabs">
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

            {/* ── ABA 1 — PESSOAL ────────────────────── */}
            {tab === 0 && (
              <div className="form-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label className="form-label">Nome completo *</label>
                    <input id="input-nome" className="form-input" type="text" placeholder="Ex: Maria da Silva" value={nome} onChange={e => setNome(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de nascimento</label>
                    <input id="input-nascimento" className="form-input" type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} />
                    {idade !== null && <div className="age-chip">🎂 {idade} anos</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <div className="radio-group">
                      {SEXO_OPTS.map(s => (
                        <RadioChip key={s} label={s} checked={sexo === s} onChange={() => setSexo(s)} />
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input id="input-telefone" className="form-input" type="tel" placeholder="(11) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input id="input-whatsapp" className="form-input" type="tel" placeholder="(11) 99999-9999" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Email</label>
                    <input id="input-email" className="form-input" type="email" placeholder="nome@provedor.com" value={email} onChange={e => setEmailPac(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA 2 — CLÍNICO ────────────────────── */}
            {tab === 1 && (
              <div className="form-body">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Peso inicial</label>
                    <div className="input-with-suffix">
                      <input id="input-peso" className="form-input" type="number" step="0.1" placeholder="Ex: 72.5" value={peso} onChange={e => setPeso(e.target.value)} />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Altura</label>
                    <div className="input-with-suffix">
                      <input id="input-altura" className="form-input" type="number" placeholder="Ex: 165" value={altura} onChange={e => setAltura(e.target.value)} />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">IMC Estimado</label>
                    <div className="imc-field">
                      {imc ? (
                        <>
                          <span className="imc-value">{imc.valor}</span>
                          <span className="imc-label" style={{ background: imc.color + '20', color: imc.color }}>{imc.label}</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>Preencha peso e altura</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-section-title">Objetivos</div>
                <div className="form-group">
                  <label className="form-label">Objetivos principais (selecione quantos desejar)</label>
                  <div className="checkbox-group">
                    {OBJETIVOS_OPTS.map(o => (
                      <CheckboxChip key={o} label={o} checked={objetivos.includes(o)} onChange={() => toggleArr(objetivos, setObjetivos, o)} />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Outro objetivo ou observação adicional</label>
                  <input id="input-objetivo-texto" className="form-input" type="text" placeholder="Ex: Controlar ansiedade alimentar no fim do dia" value={objetivoTexto} onChange={e => setObjetivoTexto(e.target.value)} />
                </div>

                <div className="form-section-title">Atividade Física habitual</div>
                <div className="form-group">
                  <label className="form-label">Nível de atividade diária</label>
                  <div className="radio-group">
                    {ATIVIDADE_OPTS.map(a => (
                      <RadioChip key={a} label={a} checked={nivelAtividade === a} onChange={() => setNivelAtividade(a)} />
                    ))}
                  </div>
                </div>

                <div className="form-section-title">Condições de saúde e Hábitos</div>
                <div className="form-group">
                  <label className="form-label">Patologias (selecione)</label>
                  <div className="checkbox-group">
                    {PATOLOGIAS_OPTS.map(p => (
                      <CheckboxChip key={p} label={p} checked={patologias.includes(p)} onChange={() => toggleArr(patologias, setPatologias, p)} />
                    ))}
                  </div>
                  <input id="input-patologias-extra" className="form-input" type="text" placeholder="Adicionar outra patologia..." value={patologiasExtra} onChange={e => setPatologiasExtra(e.target.value)} style={{ marginTop: '0.625rem' }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Restrições alimentares</label>
                  <div className="checkbox-group">
                    {RESTRICOES_OPTS.map(r => (
                      <CheckboxChip key={r} label={r} checked={restricoes.includes(r)} onChange={() => toggleArr(restricoes, setRestricoes, r)} />
                    ))}
                  </div>
                  <input id="input-restricoes-extra" className="form-input" type="text" placeholder="Adicionar outra restrição..." value={restricoesExtra} onChange={e => setRestricoesExtra(e.target.value)} style={{ marginTop: '0.625rem' }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Alergias alimentares</label>
                  <div className="checkbox-group">
                    {ALERGIAS_OPTS.map(a => (
                      <CheckboxChip key={a} label={a} checked={alergias.includes(a)} onChange={() => toggleArr(alergias, setAlergias, a)} />
                    ))}
                  </div>
                  <input id="input-alergias-extra" className="form-input" type="text" placeholder="Adicionar outra alergia..." value={alergiasExtra} onChange={e => setAlergiasExtra(e.target.value)} style={{ marginTop: '0.625rem' }} />
                </div>

                <div className="form-section-title">Medicamentos e Suplementos</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Medicamentos contínuos</label>
                    <textarea id="input-medicamentos" className="form-textarea" placeholder="Liste os medicamentos..." value={medicamentos} onChange={e => setMedicamentos(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Suplementos em uso</label>
                    <textarea id="input-suplementos" className="form-textarea" placeholder="Liste os suplementos..." value={suplementos} onChange={e => setSuplementos(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA 3 — HÁBITOS ───────────────────── */}
            {tab === 2 && (
              <div className="form-body">
                <div className="form-section-title">Rotina Alimentar</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Refeições por dia</label>
                    <input id="input-refeicoes" className="form-input" type="number" min="1" max="10" placeholder="Ex: 5" value={refeicoes} onChange={e => setRefeicoes(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Água por dia</label>
                    <div className="input-with-suffix">
                      <input id="input-agua" className="form-input" type="number" step="0.1" placeholder="2" value={agua} onChange={e => setAgua(e.target.value)} />
                      <span className="input-suffix">L</span>
                    </div>
                  </div>
                </div>

                <div className="form-section-title">Sono</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Horário que acorda</label>
                    <input
                      id="input-acorda"
                      className="form-input"
                      type="text"
                      placeholder="Ex: 6 → 06:00 | 630 → 06:30"
                      value={acorda}
                      onChange={e => setAcorda(e.target.value)}
                      onBlur={e => setAcorda(formatHora(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário que dorme</label>
                    <input
                      id="input-dorme"
                      className="form-input"
                      type="text"
                      placeholder="Ex: 23 → 23:00 | 2230 → 22:30"
                      value={dorme}
                      onChange={e => setDorme(e.target.value)}
                      onBlur={e => setDorme(formatHora(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-section-title">Atividade Física</div>
                <div
                  className="toggle-row"
                  onClick={() => setAtividadeFisica(!atividadeFisica)}
                  role="button"
                  aria-pressed={atividadeFisica}
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
                      id="input-atividade-desc"
                      className="form-textarea"
                      placeholder="Ex: Musculação 3x por semana, caminhada 2x por semana"
                      value={atividadeFisicaDesc}
                      onChange={e => setAtividadeFisicaDesc(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-section-title">Observações</div>
                <div className="form-group">
                  <label className="form-label">Observações gerais</label>
                  <textarea
                    id="input-observacoes"
                    className="form-textarea"
                    style={{ minHeight: '110px' }}
                    placeholder="Informações adicionais sobre o paciente..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="form-footer">
              <span className="form-progress">Aba {tab + 1} de {TABS.length} — {TABS[tab].label}</span>
              <div className="form-footer-actions">
                {tab > 0 && (
                  <button id="btn-voltar" className="btn-outline" onClick={() => setTab(t => t - 1)}>← Anterior</button>
                )}
                {tab < TABS.length - 1 ? (
                  <button id="btn-proximo" className="btn-green" onClick={() => setTab(t => t + 1)}>Próximo →</button>
                ) : (
                  <button
                    id="btn-salvar"
                    className="btn-green"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="btn-loading"><span className="spinner" />Salvando...</span>
                    ) : '✓ Salvar Paciente'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

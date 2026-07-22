'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

interface Nutricionista { id: string; nome: string; email: string; }
interface PacienteSemRetorno { id: string; nome: string; ultimaConsulta: string; }
interface DashboardData {
  totalPacientes: number;
  consultasSemana: number;
  semRetorno: PacienteSemRetorno[];
  planosGerados: number;
  novosPacientesSemana: number;
  consultasRecentes: any[];
}

function diasAtras(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function formatData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

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

export default function DashboardClient({ nutricionista }: { nutricionista: Nutricionista }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [spin, setSpin] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErro('');
    setSpin(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setErro('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
      setTimeout(() => setSpin(false), 600);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const primeiroNome = nutricionista.nome.split(' ')[0];

  // Gamification Logic
  const pacientesCount = data?.totalPacientes || 0;
  let level = 'Nutri Bronze';
  let levelClass = 'bronze';
  let badgeIcon = 'stars';
  if (pacientesCount >= 50) {
    level = 'Nutri Diamante'; levelClass = 'diamond'; badgeIcon = 'diamond';
  } else if (pacientesCount >= 25) {
    level = 'Nutri Ouro'; levelClass = 'gold'; badgeIcon = 'military_tech';
  } else if (pacientesCount >= 10) {
    level = 'Nutri Prata'; levelClass = 'silver';
  }

  const pacientesSemana = data?.novosPacientesSemana || 0;
  const metaSemana = 5;
  const progressoPorcentagem = Math.min((pacientesSemana / metaSemana) * 100, 100);

  return (
    <div className="dashboard-layout">
      <Sidebar nutricionista={nutricionista} onLogout={handleLogout} />

      <main className="dashboard-main">
        {/* Topbar */}
        <div className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <h1>Dashboard</h1>
            <p>Visão geral da sua clínica</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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
          <div className="dashboard-grid">
            {/* Left/Main Column */}
            <div className="dashboard-main-col">
              {/* Welcome Banner */}
              <div className="dashboard-welcome-banner">
                <div className="banner-content">
                  <div className="banner-text">
                    <h1>Olá, {primeiroNome}!</h1>
                    <p>Aqui está um resumo da sua clínica hoje.</p>
                  </div>
                  {!loading && data && (
                    <div className="banner-badge">
                      <span className="material-symbols-outlined">group</span>
                      <div>
                        <span className="banner-badge-text">Total de pacientes</span>
                        <span className="banner-badge-value">{data.totalPacientes}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="dashboard-stats">
                {/* Card 1 */}
                <div className="stat-card green">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Pacientes ativos</span>
                    <div className="stat-card-icon green">
                      <span className="material-symbols-outlined" style={{ color: 'var(--brand-600)' }}>vital_signs</span>
                    </div>
                  </div>
                  <div className="stat-card-body">
                    {loading
                      ? <div className="skeleton" style={{ height: '2.5rem', width: '50%' }} />
                      : <div className="stat-card-value">{data?.totalPacientes ?? 0}</div>
                    }
                    <div className="stat-card-desc">cadastrados no sistema</div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="stat-card blue">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Consultas da semana</span>
                    <div className="stat-card-icon blue">
                      <span className="material-symbols-outlined" style={{ color: 'var(--blue)' }}>calendar_today</span>
                    </div>
                  </div>
                  <div className="stat-card-body">
                    {loading
                      ? <div className="skeleton" style={{ height: '2.5rem', width: '40%' }} />
                      : <div className="stat-card-value">{data?.consultasSemana ?? 0}</div>
                    }
                    <div className="stat-card-desc">registradas esta semana</div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="stat-card orange">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Sem retorno</span>
                    <div className="stat-card-icon orange">
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>assignment_late</span>
                    </div>
                  </div>
                  <div className="stat-card-body">
                    {loading
                      ? <div className="skeleton" style={{ height: '2.5rem', width: '40%' }} />
                      : (
                        <div
                          className="stat-card-value"
                          style={{ color: (data?.semRetorno.length ?? 0) > 0 ? 'var(--warning)' : 'var(--gray-900)' }}
                        >
                          {data?.semRetorno.length ?? 0}
                        </div>
                      )
                    }
                    <div className="stat-card-desc">há mais de 30 dias sem contato</div>
                  </div>
                </div>

                {/* Card 4 - Planos Gerados */}
                <div className="stat-card purple">
                  <div className="stat-card-header">
                    <span className="stat-card-label">Planos com IA</span>
                    <div className="stat-card-icon purple">
                      <span className="material-symbols-outlined" style={{ color: '#9333ea' }}>auto_awesome</span>
                    </div>
                  </div>
                  <div className="stat-card-body">
                    {loading
                      ? <div className="skeleton" style={{ height: '2.5rem', width: '40%' }} />
                      : <div className="stat-card-value">{data?.planosGerados ?? 0}</div>
                    }
                    <div className="stat-card-desc">cardápios e receitas gerados</div>
                  </div>
                </div>
              </div>

              {/* Erro */}
              {erro && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                  <span>{erro}</span>
                </div>
              )}

              {/* Pacientes sem retorno */}
              <div className="sem-retorno-card">
                <div className="sem-retorno-header">
                  <div className="sem-retorno-header-icon">
                    <span className="material-symbols-outlined text-secondary-container" style={{ color: 'var(--warning)', fontSize: '20px' }}>assignment_late</span>
                  </div>
                  <div className="sem-retorno-header-text">
                    <h3>Pacientes sem retorno agendado</h3>
                    <p>Última consulta há mais de 30 dias, sem próxima data marcada</p>
                  </div>
                  {!loading && data && (
                    <span className="sem-retorno-count">
                      {data.semRetorno.length} {data.semRetorno.length === 1 ? 'paciente' : 'pacientes'}
                    </span>
                  )}
                </div>

                <div className="sem-retorno-body">
                  {loading ? (
                    <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div className="skeleton" style={{ height: '0.875rem', width: `${40 + i * 12}%` }} />
                            <div className="skeleton" style={{ height: '0.75rem', width: '28%' }} />
                          </div>
                          <div className="skeleton" style={{ height: '1.5rem', width: '72px', borderRadius: '999px' }} />
                        </div>
                      ))}
                    </div>
                  ) : data?.semRetorno.length === 0 ? (
                    <div className="sem-retorno-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--brand-600)', fontSize: '24px' }}>check_circle</span>
                      Nenhum paciente sem retorno no momento
                    </div>
                  ) : (
                    data?.semRetorno.map(p => {
                      const dias = diasAtras(p.ultimaConsulta);
                      return (
                        <Link
                          key={p.id}
                          href={`/pacientes/${p.id}`}
                          id={`paciente-row-${p.id}`}
                          className="paciente-row"
                        >
                          <div className="paciente-row-left">
                            <div className="paciente-row-avatar">{iniciais(p.nome)}</div>
                            <div>
                              <div className="paciente-row-nome">{p.nome}</div>
                              <div className="paciente-row-ultima">Última consulta: {formatData(p.ultimaConsulta)}</div>
                            </div>
                          </div>
                          <span className="paciente-row-badge">Há {dias} dias</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right/Side Column (Utilizes empty space) */}
            <div className="dashboard-side-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Gamification Card */}
              <div className="gamification-card">
                <div className="gamification-header">
                  <div className="gamification-title">
                    <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)' }}>trophy</span>
                    Conquistas
                  </div>
                  <div className={`gamification-level-badge ${levelClass}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{badgeIcon}</span>
                    {level}
                  </div>
                </div>
                
                <div className="gamification-goal">
                  <div className="goal-header">
                    <span className="goal-label">Meta da Semana</span>
                    <span className="goal-progress-text">{pacientesSemana} / {metaSemana} Pacientes</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-fill" style={{ width: `${progressoPorcentagem}%` }}></div>
                  </div>
                  <div className="goal-motivation">
                    {pacientesSemana >= metaSemana 
                      ? 'Parabéns! Meta da semana atingida! 🎉' 
                      : `Faltam apenas ${metaSemana - pacientesSemana} pacientes para a meta!`}
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="dashboard-side-card" style={{
                background: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)', fontSize: '20px' }}>bolt</span>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--gray-800)', margin: 0 }}>Ações Rápidas</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link
                    href="/pacientes/novo"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--brand-50)',
                      color: 'var(--brand-700)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      border: '1px solid var(--brand-100)'
                    }}
                    className="action-link-interactive"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                    Cadastrar Novo Paciente
                  </Link>

                  <Link
                    href="/pacientes"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--gray-50)',
                      color: 'var(--gray-700)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      border: '1px solid var(--gray-200)'
                    }}
                    className="action-link-interactive-gray"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
                    Ver Todos os Pacientes
                  </Link>
                </div>
              </div>

              {/* Recent Consultations Card */}
              <div className="dashboard-side-card" style={{
                background: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--brand-500)', fontSize: '20px' }}>history</span>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--gray-800)', margin: 0 }}>Consultas Recentes</h3>
                </div>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ height: '2rem', width: '100%' }} />
                    <div className="skeleton" style={{ height: '2rem', width: '100%' }} />
                  </div>
                ) : data?.consultasRecentes && data.consultasRecentes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {data.consultasRecentes.map((c: any) => (
                      <Link
                        key={c.id}
                        href={`/pacientes/${c.paciente_id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'background 0.2s',
                          border: '1px solid transparent'
                        }}
                        className="recent-consult-row"
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--gray-800)' }}>{c.paciente_nome}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                            {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gray-400)' }}>chevron_right</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                    Nenhuma consulta registrada.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

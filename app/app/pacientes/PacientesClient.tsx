'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

interface Nutricionista { id: string; nome: string; email: string; }

interface Paciente {
  id: string;
  nome: string;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  email: string | null;
  telefone: string | null;
  ultima_consulta: string | null;
  peso_inicial?: string | null;
  altura?: string | null;
}

function iniciais(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatData(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function objetivoLabel(p: Paciente): string {
  if (p.objetivos?.length) return p.objetivos[0];
  if (p.objetivo_texto) return p.objetivo_texto;
  return 'Geral';
}

function diasAtras(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
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

export default function PacientesClient({ nutricionista }: { nutricionista: Nutricionista }) {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetch('/api/pacientes')
      .then(r => r.json())
      .then(data => { setPacientes(data); setLoading(false); });
  }, []);

  const filtrados = useMemo(() =>
    pacientes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [pacientes, busca]
  );

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
            <h1>Lista de Pacientes</h1>
            <p>{loading ? '...' : `Gerencie e acompanhe a evolução de ${pacientes.length} paciente${pacientes.length !== 1 ? 's' : ''}`}</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/pacientes/novo" id="btn-novo-paciente" className="btn-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Novo Paciente
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

        <div className="dashboard-body">
          {/* Search */}
          <div className="search-bar">
            <span className="search-bar-icon" style={{ display: 'inline-flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
            </span>
            <input
              id="busca-paciente"
              type="text"
              className="search-input"
              placeholder="Buscar paciente por nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="patients-grid-loading" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="skeleton-card" style={{ height: '180px', borderRadius: 'var(--radius-lg)', background: 'var(--white)', border: '1px solid var(--gray-200)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                    <div className="skeleton" style={{ width: 70, height: 22, borderRadius: '999px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    <div className="skeleton" style={{ height: '1.1rem', width: '70%' }} />
                    <div className="skeleton" style={{ height: '0.875rem', width: '40%' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                    <div className="skeleton" style={{ height: '0.75rem', width: '50%' }} />
                    <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--gray-300)', display: 'inline-flex' }}>
                group
              </span>
              <h3>{busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado ainda'}</h3>
              <p>{busca ? `Sem resultados para "${busca}"` : 'Adicione seu primeiro paciente para começar.'}</p>
              {!busca && (
                <Link href="/pacientes/novo" className="btn-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  Cadastrar primeiro paciente
                </Link>
              )}
            </div>
          ) : (
            <div className="patients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filtrados.map(p => {
                let statusLabel = 'Ativo';
                let statusClass = 'status-active';
                
                if (!p.ultima_consulta) {
                  statusLabel = 'Novo';
                  statusClass = 'status-new';
                } else {
                  const dias = diasAtras(p.ultima_consulta);
                  if (dias > 30) {
                    statusLabel = 'Sem Retorno';
                    statusClass = 'status-warning';
                  }
                }

                return (
                  <div
                    key={p.id}
                    id={`paciente-card-${p.id}`}
                    style={{
                      background: 'var(--white)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    className="patient-card-interactive"
                    onClick={() => router.push(`/pacientes/${p.id}`)}
                  >
                    {/* Top Row: Avatar & Name/Objective */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div className="patient-card-avatar" style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand-50), var(--brand-100))',
                        color: 'var(--brand-700)',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--brand-100)',
                        flexShrink: 0
                      }}>
                        {iniciais(p.nome)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          color: 'var(--gray-800)',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{p.nome}</h3>
                        <p style={{
                          fontSize: '0.78rem',
                          color: 'var(--gray-400)',
                          margin: '0.125rem 0 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: '500'
                        }}>{objetivoLabel(p)}</p>
                      </div>
                    </div>

                    {/* Middle Row: Status & Metrics */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <span className={`status-badge ${statusClass}`} style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        display: 'inline-block'
                      }}>{statusLabel}</span>

                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: '500' }}>
                        {p.peso_inicial ? `${p.peso_inicial} kg` : ''} {p.altura ? `• ${p.altura} cm` : ''}
                      </span>
                    </div>

                    {/* Bottom Row: Footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--gray-100)',
                      paddingTop: '0.875rem',
                      marginTop: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gray-400)', fontSize: '0.75rem', fontWeight: '500' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                        <span>{p.ultima_consulta ? `Última: ${formatData(p.ultima_consulta)}` : 'Sem consulta'}</span>
                      </div>
                      <span className="material-symbols-outlined patient-card-arrow" style={{ fontSize: '18px', color: 'var(--brand-500)' }}>arrow_forward</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PatientDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('plano');

  const handleLogout = () => {
    router.push('/portal/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            N
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Portal do Paciente</h1>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>NutriLi Clinical</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', fontWeight: '600'
            }}>
              JD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>João Doe</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Paciente</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem',
              borderRadius: '8px', transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Welcome Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Olá, João! 👋</h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Aqui está o resumo do seu acompanhamento nutricional.</p>
        </div>

        {/* Gamification / Progress Card */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '20px',
          padding: '2rem',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#fef08a' }}>star</span>
              <span style={{ fontWeight: '600', color: '#f0fdf4' }}>Nível 3: Focado</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Você atingiu 80% da sua meta de água hoje!</h3>
            <p style={{ color: '#d1fae5', margin: 0, fontSize: '0.95rem' }}>Faltam apenas 600ml para bater a meta diária de 3L.</p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '1rem',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>80%</div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Concluído</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('plano')}
            style={{
              background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem',
              fontWeight: activeTab === 'plano' ? '700' : '500',
              color: activeTab === 'plano' ? '#10b981' : '#64748b',
              borderBottom: activeTab === 'plano' ? '3px solid #10b981' : '3px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Meu Plano Alimentar
          </button>
          <button 
            onClick={() => setActiveTab('evolucao')}
            style={{
              background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem',
              fontWeight: activeTab === 'evolucao' ? '700' : '500',
              color: activeTab === 'evolucao' ? '#10b981' : '#64748b',
              borderBottom: activeTab === 'evolucao' ? '3px solid #10b981' : '3px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Minha Evolução
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'plano' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Refeições de Hoje</h3>
                <span style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>Terça-feira</span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { title: 'Café da Manhã', time: '08:00', items: ['2 fatias de pão integral', '2 ovos mexidos', '1 xícara de café sem açúcar'] },
                  { title: 'Lanche da Manhã', time: '10:30', items: ['1 maçã', '30g de castanhas'] },
                  { title: 'Almoço', time: '13:00', items: ['150g de frango grelhado', '100g de arroz integral', 'Salada à vontade'] },
                ].map((meal, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#334155' }}>{meal.title}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{meal.time}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.95rem' }}>
                      {meal.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1e293b' }}>Próxima Consulta</h3>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>15 de Agosto, 14:00</div>
                  <div style={{ color: '#3b82f6', fontSize: '0.85rem' }}>Retorno Nutricional</div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1e293b' }}>Dica da Nutri</h3>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                  Lembre-se de não pular refeições. A constância é o segredo para mantermos o seu metabolismo sempre ativo e queimando calorias! 🥗🔥
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evolucao' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '1rem' }}>query_stats</span>
            <h3 style={{ color: '#334155', margin: '0 0 0.5rem 0' }}>Sua evolução estará disponível após o primeiro retorno.</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Continue seguindo o plano! 💪</p>
          </div>
        )}

      </main>
    </div>
  );
}

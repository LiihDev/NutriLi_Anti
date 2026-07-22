'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Ocorreu um erro ao fazer login.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErro('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page">
      {/* Painel esquerdo — imagem gerada por IA */}
      <div className="auth-sidebar">
        <Image
          src="/auth-hero.png"
          alt="Nutrição e saúde"
          fill
          className="auth-sidebar-img"
          priority
        />
        <div className="auth-sidebar-overlay" />
        <div className="auth-sidebar-content">
          <div className="auth-sidebar-tag">
            <span>✦</span> Plataforma Profissional
          </div>
          <h2>Gestão inteligente<br />da sua clínica</h2>
          <p>
            Centralize pacientes, consultas e planos alimentares em um só lugar.
            Mais organização, mais tempo para cuidar da saúde dos seus pacientes.
          </p>
          <div className="auth-sidebar-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">∞</span>
              <span className="auth-stat-label">Pacientes</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">100%</span>
              <span className="auth-stat-label">Seguro</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">24/7</span>
              <span className="auth-stat-label">Disponível</span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="auth-panel">
        <div className="auth-form-wrapper">
          <div className="auth-logo">
            <div className="auth-logo-mark">🥗</div>
            <span className="auth-logo-text">Nutri<span>Li</span></span>
          </div>

          <h2 className="auth-heading">Bem-vinda de volta!</h2>
          <p className="auth-subheading">Entre com suas credenciais para acessar o sistema.</p>

          {erro && (
            <div className="alert alert-error" role="alert">
              <span>⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email profissional</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="sua@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              id="btn-entrar"
              className="btn-primary"
              disabled={carregando}
            >
              {carregando ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Entrando...
                </span>
              ) : (
                'Entrar na plataforma'
              )}
            </button>
          </form>

          <div className="form-divider">
            <span className="form-divider-text">Não tem acesso?</span>
          </div>

          <p className="auth-link-text">
            <Link href="/cadastro" className="auth-link" id="link-cadastro">
              Criar conta gratuita →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

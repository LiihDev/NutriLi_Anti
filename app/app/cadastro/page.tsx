'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Ocorreu um erro ao criar a conta.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page">
      {/* Painel esquerdo — imagem */}
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
            <span>✦</span> Cadastro Gratuito
          </div>
          <h2>Comece a transformar<br />sua clínica hoje</h2>
          <p>
            Crie sua conta em segundos e tenha acesso completo à plataforma.
            Sem cartão de crédito. Sem compromisso.
          </p>
          <div className="auth-sidebar-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">Grátis</span>
              <span className="auth-stat-label">Para sempre</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">2 min</span>
              <span className="auth-stat-label">Para cadastrar</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">🔒</span>
              <span className="auth-stat-label">Dados seguros</span>
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

          <h2 className="auth-heading">Criar sua conta</h2>
          <p className="auth-subheading">Preencha os dados abaixo para começar.</p>

          {erro && (
            <div className="alert alert-error" role="alert">
              <span>⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                type="text"
                className="form-input"
                placeholder="Dra. Ana Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
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
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmarSenha">Confirmar senha</label>
              <input
                id="confirmarSenha"
                type="password"
                className="form-input"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              id="btn-criar-conta"
              className="btn-primary"
              disabled={carregando}
            >
              {carregando ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Criando conta...
                </span>
              ) : (
                'Criar conta gratuita'
              )}
            </button>
          </form>

          <div className="form-divider">
            <span className="form-divider-text">Já tem conta?</span>
          </div>

          <p className="auth-link-text">
            <Link href="/" className="auth-link" id="link-login">
              ← Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

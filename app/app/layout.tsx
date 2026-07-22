import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NutriLi — Sistema de Gestão para Nutricionistas',
  description: 'Plataforma completa de gestão de pacientes, consultas e planos alimentares para nutricionistas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

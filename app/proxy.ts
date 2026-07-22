import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('nutrisystem-session');
  const isLoggedIn = !!sessionCookie?.value;

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/' || pathname === '/cadastro';
  const isDashboard = pathname.startsWith('/dashboard');

  // Já logada tentando acessar login ou cadastro → redireciona pro dashboard
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Não logada tentando acessar rotas protegidas → redireciona pro login
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isPacientes = pathname.startsWith('/pacientes');
  if (isPacientes && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/cadastro', '/dashboard/:path*', '/pacientes/:path*'],
};

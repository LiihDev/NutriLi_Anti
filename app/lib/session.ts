import { SessionOptions } from 'iron-session';

export interface SessionData {
  nutricionista?: {
    id: string;
    nome: string;
    email: string;
  };
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'nutrisystem-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
};

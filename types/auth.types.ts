// types/auth.types.ts

export type User = {
  id: number;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type SignupRequest = {
  email: string;
  password: string;
};

export type SignupResponse = {
  token: string;
};

export type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

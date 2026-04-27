// Matches exactly what your users table stores
export interface User {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'learner' | 'mentor' | 'administrator';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// What we return to the client — never expose password_hash
export type SafeUser = Omit<User, 'password_hash'>;

// What the JWT token payload contains
export interface JwtPayload {
  user_id: number;
  email: string;
  role: 'learner' | 'mentor' | 'administrator';
}

// Register request body shape
export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role: 'learner' | 'mentor' | 'administrator';
  // mentor only
  specialization?: string;
  qualifications?: string;
}

// Login request body shape
export interface LoginBody {
  email: string;
  password: string;
}

// What auth service returns after login
export interface AuthResponse {
  user: SafeUser;
  token: string;
}
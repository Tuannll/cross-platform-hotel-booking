import apiClient from './apiClient';

export type UserRole = 'admin' | 'customer' | 'partner';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  userType?: Extract<UserRole, 'customer' | 'partner'>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export const authService = {
  login: (credentials: LoginPayload): Promise<AuthResponse> =>
    apiClient.post('/auth/login', credentials),
  googleLogin: (credential: string): Promise<AuthResponse> =>
    apiClient.post('/auth/google', { credential }),
  register: (payload: RegisterPayload): Promise<User> =>
    apiClient.post('/auth/register', payload),
  forgotPassword: (email: string): Promise<{ message: string }> =>
    apiClient.post('/auth/forgot-password', { email }),
  getMe: (): Promise<{ user: User }> => apiClient.get('/auth/me'),
  resetPassword: (payload: ResetPasswordPayload): Promise<{ message: string }> =>
    apiClient.post('/auth/reset-password', payload),
};

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'BLOG_OWNER' | 'USER' | string;
  status: 'ACTIVE' | 'LOCKED' | 'PENDING' | string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseData {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  identifier: string; // username or email
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string | string[];
  path?: string;
  timestamp?: string;
}

export type BackendUserRole =
  | 'NORMAL'
  | 'BLOG_OWNER'
  | 'CONTENT_MODERATOR'
  | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'LOCKED';

export type FrontendRole =
  | 'guest'
  | 'user'
  | 'owner'
  | 'moderator'
  | 'admin';

export interface UserSummary {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: BackendUserRole;
  status: UserStatus;

  bio: string | null;
  avatarUrl: string | null;

  lockedAt?: string | null;
  lockedById?: number | null;
  lockReason?: string | null;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  /**
   * Có trong response GET /user/profile.
   */
  followers?: UserSummary[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * POST /auth/refresh-token chỉ trả accessToken mới.
 * Không có refreshToken trong response.
 */
export interface RefreshTokenResponseData {
  accessToken: string;
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
  identifier: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  path?: string;
  timestamp: string;
}
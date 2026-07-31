import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  AuthTokens,
  LoginResponseData,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ApiResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  currentUser = signal<User | null>(null);
  currentRole = signal<string>('guest');
  accessToken = signal<string | null>(null);
  refreshToken = signal<string | null>(null);
  isDarkMode = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      // Load saved user state & tokens
      const savedUserStr = localStorage.getItem('auth_user');
      const savedAccess = localStorage.getItem('access_token');
      const savedRefresh = localStorage.getItem('refresh_token');

      if (savedAccess) this.accessToken.set(savedAccess);
      if (savedRefresh) this.refreshToken.set(savedRefresh);

      if (savedUserStr) {
        try {
          const user: User = JSON.parse(savedUserStr);
          this.currentUser.set(user);
          this.currentRole.set(this.normalizeRole(user.role));
        } catch {
          const savedRole = localStorage.getItem('demoRole');
          if (savedRole) this.currentRole.set(savedRole);
        }
      } else {
        const savedRole = localStorage.getItem('demoRole');
        if (savedRole) this.currentRole.set(savedRole);
      }

      // Dark Mode theme setup
      const savedTheme = localStorage.getItem('demoTheme');
      if (savedTheme === 'dark') {
        this.isDarkMode.set(true);
        document.documentElement.classList.add('dark', 'dark-mode');
        document.body.classList.add('dark', 'dark-mode');
      }

      effect(() => {
        const role = this.currentRole();
        localStorage.setItem('demoRole', role);
      });

      effect(() => {
        const dark = this.isDarkMode();
        localStorage.setItem('demoTheme', dark ? 'dark' : 'light');
        if (dark) {
          document.documentElement.classList.add('dark', 'dark-mode');
          document.body.classList.add('dark', 'dark-mode');
        } else {
          document.documentElement.classList.remove('dark', 'dark-mode');
          document.body.classList.remove('dark', 'dark-mode');
        }
      });
    }
  }

  /**
   * 1. Register API: POST /api/v1/register
   */
  register(data: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, data);
  }

  /**
   * 2. Login API: POST /api/v1/login
   */
  login(data: LoginRequest): Observable<ApiResponse<LoginResponseData>> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const { user, tokens } = res.data;
          this.handleAuthSuccess(user, tokens);
        }
      })
    );
  }

  /**
   * 3. Forgot Password API: POST /api/v1/forgot-password
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/forgot-password`, data);
  }

  /**
   * 4. Reset Password API: POST /api/v1/reset-password
   */
  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/reset-password`, data);
  }

  /**
   * 5. Refresh Token API: POST /api/v1/auth/refresh-token
   */
  refreshTokenApi(): Observable<ApiResponse<AuthTokens>> {
    const token = this.refreshToken();
    if (!token) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiResponse<AuthTokens>>(`${this.apiUrl}/auth/refresh-token`, { refreshToken: token }).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.accessToken.set(res.data.accessToken);
          this.refreshToken.set(res.data.refreshToken);
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', res.data.accessToken);
            localStorage.setItem('refresh_token', res.data.refreshToken);
          }
        }
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  /**
   * 6. Logout API: POST /api/v1/auth/logout
   */
  logoutApi(): Observable<ApiResponse<{ message: string }>> {
    const token = this.refreshToken();
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/auth/logout`, { refreshToken: token }).pipe(
      tap(() => this.logout()),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  /**
   * 7. Logout All API: POST /api/v1/auth/logout-all
   */
  logoutAllApi(): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/auth/logout-all`, {}).pipe(
      tap(() => this.logout()),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  /**
   * 8. Get Profile API: GET /api/v1/user/profile
   */
  getUserProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/user/profile`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          this.currentRole.set(this.normalizeRole(res.data.role));
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_user', JSON.stringify(res.data));
          }
        }
      })
    );
  }

  /**
   * Helper: Handle auth state updates after login
   */
  private handleAuthSuccess(user: User, tokens: AuthTokens) {
    this.currentUser.set(user);
    const normalizedRole = this.normalizeRole(user.role);
    this.currentRole.set(normalizedRole);
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('access_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
      localStorage.setItem('demoRole', normalizedRole);
    }
  }

  /**
   * Helper: Normalize backend roles ('ADMIN', 'MODERATOR', 'BLOG_OWNER', 'USER')
   * to frontend role keys ('admin', 'moderator', 'owner', 'user', 'guest')
   */
  normalizeRole(role: string): string {
    if (!role) return 'guest';
    const r = role.toUpperCase();
    if (r === 'ADMIN') return 'admin';
    if (r === 'MODERATOR') return 'moderator';
    if (r === 'BLOG_OWNER' || r === 'OWNER') return 'owner';
    if (r === 'USER') return 'user';
    return role.toLowerCase();
  }

  setRole(role: string) {
    this.currentRole.set(role);
  }

  logout() {
    this.currentUser.set(null);
    this.currentRole.set('guest');
    this.accessToken.set(null);
    this.refreshToken.set(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.setItem('demoRole', 'guest');
    }
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
  }
}

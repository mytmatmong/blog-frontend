import {
  effect,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  AuthTokens,
  BackendUserRole,
  ForgotPasswordRequest,
  FrontendRole,
  LoginRequest,
  LoginResponseData,
  RefreshTokenResponseData,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Dùng chung một request refresh khi nhiều API cùng trả 401.
   * Tránh gửi 4-5 request refresh token cùng lúc.
   */
  private refreshRequest$: Observable<string> | null = null;

  readonly currentUser = signal<User | null>(null);
  readonly currentRole = signal<FrontendRole>('guest');
  readonly accessToken = signal<string | null>(null);
  readonly refreshToken = signal<string | null>(null);
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    this.restoreSession();
    this.restoreTheme();

    effect(() => {
      const darkMode = this.isDarkMode();

      localStorage.setItem(
        'demoTheme',
        darkMode ? 'dark' : 'light',
      );

      this.applyTheme(darkMode);
    });
  }

  /**
   * P01 — POST /register
   */
  register(
    request: RegisterRequest,
  ): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(
      `${this.apiUrl}/register`,
      request,
    );
  }

  /**
   * P02 — POST /login
   */
  login(
    request: LoginRequest,
  ): Observable<ApiResponse<LoginResponseData>> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(
        `${this.apiUrl}/login`,
        request,
      )
      .pipe(
        tap((response) => {
          this.handleLoginSuccess(
            response.data.user,
            response.data.tokens,
          );
        }),
      );
  }

  /**
   * P03 — POST /forgot-password
   */
  forgotPassword(
    request: ForgotPasswordRequest,
  ): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<
      ApiResponse<{ message: string }>
    >(
      `${this.apiUrl}/forgot-password`,
      request,
    );
  }

  /**
   * P04 — POST /reset-password
   */
  resetPassword(
    request: ResetPasswordRequest,
  ): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<
      ApiResponse<{ message: string }>
    >(
      `${this.apiUrl}/reset-password`,
      request,
    );
  }

  /**
   * U01 — POST /auth/refresh-token
   *
   * Backend chỉ trả:
   * {
   *   data: {
   *     accessToken: "..."
   *   }
   * }
   *
   * Refresh token cũ vẫn phải được giữ nguyên.
   */
  refreshAccessToken(): Observable<string> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const currentRefreshToken = this.refreshToken();

    if (!currentRefreshToken) {
      this.logout();

      return throwError(
        () => new Error('Không có refresh token'),
      );
    }

    const request$ = this.http
      .post<ApiResponse<RefreshTokenResponseData>>(
        `${this.apiUrl}/auth/refresh-token`,
        {
          refreshToken: currentRefreshToken,
        },
      )
      .pipe(
        map((response) => {
          const newAccessToken =
            response.data?.accessToken;

          if (!newAccessToken) {
            throw new Error(
              'Backend không trả accessToken mới',
            );
          }

          return newAccessToken;
        }),

        tap((newAccessToken) => {
          this.accessToken.set(newAccessToken);

          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'access_token',
              newAccessToken,
            );
          }
        }),

        catchError((error: unknown) => {
          this.logout();
          return throwError(() => error);
        }),

        finalize(() => {
          this.refreshRequest$ = null;
        }),

        shareReplay({
          bufferSize: 1,
          refCount: false,
        }),
      );

    this.refreshRequest$ = request$;

    return request$;
  }

  /**
   * U02 — POST /auth/logout
   */
  logoutApi(): Observable<
    ApiResponse<{ message: string }>
  > {
    const currentRefreshToken = this.refreshToken();

    if (!currentRefreshToken) {
      this.logout();

      return of({
        success: true,
        statusCode: 200,
        data: {
          message: 'Đã xóa phiên đăng nhập phía frontend',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return this.http
      .post<ApiResponse<{ message: string }>>(
        `${this.apiUrl}/auth/logout`,
        {
          refreshToken: currentRefreshToken,
        },
      )
      .pipe(
        tap(() => {
          this.logout();
        }),

        catchError((error: unknown) => {
          /**
           * Backend lỗi thì frontend vẫn phải xóa token.
           */
          this.logout();
          return throwError(() => error);
        }),
      );
  }

  /**
   * U03 — POST /auth/logout-all
   */
  logoutAllApi(): Observable<
    ApiResponse<{ message: string }>
  > {
    return this.http
      .post<ApiResponse<{ message: string }>>(
        `${this.apiUrl}/auth/logout-all`,
        {},
      )
      .pipe(
        tap(() => {
          this.logout();
        }),

        catchError((error: unknown) => {
          this.logout();
          return throwError(() => error);
        }),
      );
  }

  /**
   * U23 — GET /user/profile
   */
  getUserProfile(): Observable<ApiResponse<User>> {
    return this.http
      .get<ApiResponse<User>>(
        `${this.apiUrl}/user/profile`,
      )
      .pipe(
        tap((response) => {
          this.saveUser(response.data);
        }),
      );
  }

  normalizeRole(
    role: BackendUserRole | string | null | undefined,
  ): FrontendRole {
    switch (role) {
      case 'NORMAL':
        return 'user';

      case 'BLOG_OWNER':
        return 'owner';

      case 'CONTENT_MODERATOR':
        return 'moderator';

      case 'SUPER_ADMIN':
        return 'admin';

      default:
        return 'guest';
    }
  }

  /**
   * Giữ tạm để những template cũ chưa lỗi compile.
   *
   * Không còn cho phép bấm nút demo để tự nâng role.
   */
  setRole(role: FrontendRole): void {
    if (role === 'guest') {
      this.logout();
    }
  }

  logout(): void {
    this.currentUser.set(null);
    this.currentRole.set('guest');
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.refreshRequest$ = null;

    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('demoRole');
  }

  toggleTheme(): void {
    this.isDarkMode.update((current) => !current);
  }

  private handleLoginSuccess(
    user: User,
    tokens: AuthTokens,
  ): void {
    this.currentUser.set(user);
    this.currentRole.set(
      this.normalizeRole(user.role),
    );
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);

    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(
      'auth_user',
      JSON.stringify(user),
    );
    localStorage.setItem(
      'access_token',
      tokens.accessToken,
    );
    localStorage.setItem(
      'refresh_token',
      tokens.refreshToken,
    );

    /**
     * Xóa dữ liệu demo của bản frontend cũ.
     */
    localStorage.removeItem('demoRole');
  }

  private saveUser(user: User): void {
    this.currentUser.set(user);
    this.currentRole.set(
      this.normalizeRole(user.role),
    );

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'auth_user',
        JSON.stringify(user),
      );
    }
  }

  private restoreSession(): void {
    const savedUser =
      localStorage.getItem('auth_user');
    const savedAccessToken =
      localStorage.getItem('access_token');
    const savedRefreshToken =
      localStorage.getItem('refresh_token');

    /**
     * Không có cả access token lẫn refresh token
     * thì không coi là đang đăng nhập.
     */
    if (!savedAccessToken && !savedRefreshToken) {
      this.clearStoredSession();
      return;
    }

    if (savedAccessToken) {
      this.accessToken.set(savedAccessToken);
    }

    if (savedRefreshToken) {
      this.refreshToken.set(savedRefreshToken);
    }

    if (!savedUser) {
      return;
    }

    try {
      const user = JSON.parse(savedUser) as User;

      this.currentUser.set(user);
      this.currentRole.set(
        this.normalizeRole(user.role),
      );
    } catch {
      this.clearStoredSession();
    }
  }

  private clearStoredSession(): void {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('demoRole');

    this.currentUser.set(null);
    this.currentRole.set('guest');
    this.accessToken.set(null);
    this.refreshToken.set(null);
  }

  private restoreTheme(): void {
    const savedTheme =
      localStorage.getItem('demoTheme');

    const darkMode = savedTheme === 'dark';

    this.isDarkMode.set(darkMode);
    this.applyTheme(darkMode);
  }

  private applyTheme(darkMode: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }

    const operation = darkMode ? 'add' : 'remove';

    document.documentElement.classList[operation](
      'dark',
      'dark-mode',
    );

    document.body.classList[operation](
      'dark',
      'dark-mode',
    );
  }
}
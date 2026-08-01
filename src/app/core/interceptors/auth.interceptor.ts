import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Các API này không được refresh lại khi trả 401,
 * nếu không sẽ gây vòng lặp vô hạn.
 */
const NO_REFRESH_PATHS = [
  '/register',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/refresh-token',
  '/auth/logout',
];

export const authInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const authService = inject(AuthService);

  const isBackendApi = request.url.startsWith(
    environment.apiUrl,
  );

  if (!isBackendApi) {
    return next(request);
  }

  const apiPath = getApiPath(request.url);
  const shouldSkipRefresh =
    NO_REFRESH_PATHS.includes(apiPath);

  const currentAccessToken =
    authService.accessToken();

  const requestWithToken =
    currentAccessToken && !shouldSkipRefresh
      ? request.clone({
        setHeaders: {
          Authorization:
            `Bearer ${currentAccessToken}`,
        },
      })
      : request;

  return next(requestWithToken).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const refreshToken =
        authService.refreshToken();

      const cannotRefresh =
        error.status !== 401 ||
        shouldSkipRefresh ||
        !refreshToken;

      if (cannotRefresh) {
        return throwError(() => error);
      }

      return authService
        .refreshAccessToken()
        .pipe(
          switchMap((newAccessToken) => {
            const retriedRequest =
              request.clone({
                setHeaders: {
                  Authorization:
                    `Bearer ${newAccessToken}`,
                },
              });

            return next(retriedRequest);
          }),

          catchError((refreshError: unknown) => {
            authService.logout();

            return throwError(
              () => refreshError,
            );
          }),
        );
    }),
  );
};

function getApiPath(url: string): string {
  const withoutBaseUrl = url.slice(
    environment.apiUrl.length,
  );

  return withoutBaseUrl.split('?')[0];
}
import {
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { FrontendRole } from '../models/auth.model';

const roleLevel: Record<FrontendRole, number> = {
  guest: 0,
  user: 1,
  owner: 2,
  moderator: 3,
  admin: 4,
};

export const roleGuard = (
  requiredRole: Exclude<FrontendRole, 'guest'>,
): CanActivateFn => {
  return (_route, state) => {
    const platformId = inject(PLATFORM_ID);

    /**
     * SSR chưa có localStorage nên để server render route.
     * Browser sẽ kiểm tra lại khi hydrate.
     */
    if (isPlatformServer(platformId)) {
      return true;
    }

    const authService = inject(AuthService);
    const router = inject(Router);

    const currentRole =
      authService.currentRole();

    const currentLevel =
      roleLevel[currentRole];

    const requiredLevel =
      roleLevel[requiredRole];

    if (currentLevel >= requiredLevel) {
      return true;
    }

    if (currentRole === 'guest') {
      return router.createUrlTree(
        ['/auth'],
        {
          queryParams: {
            redirect: state.url,
          },
        },
      );
    }

    return router.createUrlTree(['/']);
  };
};
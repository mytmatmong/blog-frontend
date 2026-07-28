import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { AuthService } from '../services/auth.service';

const roleHierarchy: Record<string, number> = {
  'guest': 0,
  'user': 1,
  'owner': 2,
  'moderator': 3,
  'admin': 4
};

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformServer(platformId)) {
      return true;
    }

    const authService = inject(AuthService);
    const router = inject(Router);
    const currentRole = authService.currentRole();

    const currentLevel = roleHierarchy[currentRole] ?? 0;
    const requiredLevel = roleHierarchy[requiredRole] ?? 0;

    if (currentLevel >= requiredLevel) {
      return true;
    }

    // Redirect to public home if unauthorized
    router.navigate(['/']);
    return false;
  };
};

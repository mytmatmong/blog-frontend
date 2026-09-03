import { Component, signal, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { InputComponent } from '../../../shared/components/input/input';
import { TranslationService } from '../../../core/services/translation.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, InputComponent, TranslatePipe, NgClass, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth implements OnInit {
  protected readonly ts = inject(TranslationService);
  protected readonly authService = inject(AuthService);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected activeTab = signal<'login' | 'register' | 'forgot'>('login');
  protected forgotStep = signal<'request' | 'reset'>('request');
  protected isLoading = signal<boolean>(false);

  // Login form fields
  loginIdentifier = signal<string>('');
  loginPassword = signal<string>('');

  // Register form fields
  registerUsername = signal<string>('');
  registerEmail = signal<string>('');
  registerPassword = signal<string>('');

  // Forgot password form fields
  forgotEmail = signal<string>('');

  // Reset password form fields
  resetToken = signal<string>('');
  resetPassword = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.resetToken.set(params['token']);
        this.activeTab.set('forgot');
        this.forgotStep.set('reset');
      } else if (params['tab'] && ['login', 'register', 'forgot'].includes(params['tab'])) {
        this.activeTab.set(params['tab'] as 'login' | 'register' | 'forgot');
      }
    });
  }

  setTab(tab: 'login' | 'register' | 'forgot') {
    this.activeTab.set(tab);
  }

  setForgotStep(step: 'request' | 'reset') {
    this.forgotStep.set(step);
  }

  onLogin(event: Event) {
    event.preventDefault();
    const identifier = this.loginIdentifier().trim();
    const password = this.loginPassword();

    if (!identifier || !password) {
      this.toastService.warning(this.ts.translate('auth.login_fill_fields'));
      return;
    }

    this.isLoading.set(true);
    this.authService.login({ identifier, password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success(this.ts.translate('auth.login_success'), this.ts.translate('common.success'));
        
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        if (redirect?.startsWith('/')) {
          this.router.navigateByUrl(redirect);
          return;
        }

        // Redirect based on user role
        const role = this.authService.currentRole();
        if (role === 'admin') {
          this.router.navigate(['/dashboard/admin']);
        } else if (role === 'moderator') {
          this.router.navigate(['/dashboard/moderator']);
        } else if (role === 'owner') {
          this.router.navigate(['/dashboard/owner']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.handleError(err, this.ts.translate('auth.login_failed_title'));
      }
    });
  }

  onRegister(event: Event) {
    event.preventDefault();
    const username = this.registerUsername().trim();
    const email = this.registerEmail().trim();
    const password = this.registerPassword();

    if (!username || !email || !password) {
      this.toastService.warning(this.ts.translate('auth.register_fill_fields'));
      return;
    }

    this.isLoading.set(true);
    this.authService.register({ username, email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success(this.ts.translate('auth.register_success'), this.ts.translate('common.success'));
        this.loginIdentifier.set(username);
        this.registerUsername.set('');
        this.registerEmail.set('');
        this.registerPassword.set('');
        this.activeTab.set('login');
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.handleError(err, this.ts.translate('auth.register_failed_title'));
      }
    });
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    const email = this.forgotEmail().trim();

    if (!email) {
      this.toastService.warning(this.ts.translate('auth.forgot_enter_email'));
      return;
    }

    this.isLoading.set(true);
    this.authService.forgotPassword({ email }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const msg = res.data?.message || this.ts.translate('auth.forgot_success_fallback');
        this.toastService.info(msg, this.ts.translate('common.notice'));
        this.forgotStep.set('reset');
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.handleError(err, this.ts.translate('auth.forgot_failed_title'));
      }
    });
  }

  onResetPassword(event: Event) {
    event.preventDefault();
    const token = this.resetToken().trim();
    const newPassword = this.resetPassword();

    if (!token || !newPassword) {
      this.toastService.warning(this.ts.translate('auth.reset_fill_fields'));
      return;
    }

    this.isLoading.set(true);
    this.authService.resetPassword({ token, newPassword }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const msg = res.data?.message || this.ts.translate('auth.reset_success_fallback');
        this.toastService.success(msg, this.ts.translate('common.success'));
        this.resetToken.set('');
        this.resetPassword.set('');
        this.activeTab.set('login');
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.handleError(err, this.ts.translate('auth.reset_failed_title'));
      }
    });
  }

  private handleError(err: HttpErrorResponse, defaultTitle: string) {
    let msg = this.ts.translate('common.generic_error');
    if (err.error?.message) {
      if (Array.isArray(err.error.message)) {
        msg = err.error.message.join(', ');
      } else if (typeof err.error.message === 'string') {
        msg = err.error.message;
      }
    } else if (err.message) {
      msg = err.message;
    }
    this.toastService.error(msg, defaultTitle);
  }
}

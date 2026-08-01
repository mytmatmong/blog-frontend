import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.',
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error && error.message
      ? error.message
      : fallback;
  }

  const message = error.error?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (error.status === 0) {
    return 'Không kết nối được tới máy chủ.';
  }

  return error.message || fallback;
}

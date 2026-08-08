import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  AdminBlogOwnerRequestItem,
  AdminDashboardData,
  AdminLanguage,
  AdminPaginatedResponse,
  AdminUserDetail,
  AdminUserItem,
  ChangeUserRoleDto,
  CreateAdminLanguageRequest,
  CreateModeratorRequest,
  GetAdminUsersQuery,
  GetBlogOwnerRequestsQuery,
  LockUserDto,
  ReviewBlogOwnerRequestDto,
  UpdateAdminLanguageRequest,
  UpdateAdminUserDto,
} from '../models/admin-api.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * A01 — GET /api/v1/admin/dashboard
   * Lấy dữ liệu dashboard quản trị (SUPER_ADMIN hoặc CONTENT_MODERATOR)
   */
  getAdminDashboard(): Observable<ApiResponse<AdminDashboardData>> {
    return this.http.get<ApiResponse<AdminDashboardData>>(
      `${this.apiUrl}/admin/dashboard`,
    );
  }

  /**
   * A02 — GET /api/v1/admin/languages
   * Lấy toàn bộ ngôn ngữ chưa xóa (SUPER_ADMIN hoặc CONTENT_MODERATOR)
   */
  getAdminLanguages(): Observable<ApiResponse<AdminLanguage[]>> {
    return this.http.get<ApiResponse<AdminLanguage[]>>(
      `${this.apiUrl}/admin/languages`,
    );
  }

  /**
   * A03 — GET /api/v1/admin/languages/:id
   * Lấy chi tiết ngôn ngữ theo ID (SUPER_ADMIN hoặc CONTENT_MODERATOR)
   */
  getAdminLanguageById(id: number): Observable<ApiResponse<AdminLanguage>> {
    return this.http.get<ApiResponse<AdminLanguage>>(
      `${this.apiUrl}/admin/languages/${id}`,
    );
  }

  /**
   * A04 — POST /api/v1/admin/languages
   * Tạo mới ngôn ngữ hệ thống (chỉ SUPER_ADMIN)
   */
  createAdminLanguage(
    body: CreateAdminLanguageRequest,
  ): Observable<ApiResponse<AdminLanguage>> {
    return this.http.post<ApiResponse<AdminLanguage>>(
      `${this.apiUrl}/admin/languages`,
      body,
    );
  }

  /**
   * A05 — PATCH /api/v1/admin/languages/:id
   * Cập nhật thông tin ngôn ngữ (chỉ SUPER_ADMIN)
   */
  updateAdminLanguage(
    id: number,
    body: UpdateAdminLanguageRequest,
  ): Observable<ApiResponse<AdminLanguage>> {
    return this.http.patch<ApiResponse<AdminLanguage>>(
      `${this.apiUrl}/admin/languages/${id}`,
      body,
    );
  }

  /**
   * A06 — DELETE /api/v1/admin/languages/:id
   * Xóa mềm ngôn ngữ hệ thống (chỉ SUPER_ADMIN)
   */
  deleteAdminLanguage(id: number): Observable<ApiResponse<AdminLanguage>> {
    return this.http.delete<ApiResponse<AdminLanguage>>(
      `${this.apiUrl}/admin/languages/${id}`,
    );
  }

  /**
   * A07 — GET /api/v1/admin/requests/blog-owner
   * Lấy danh sách yêu cầu Blog Owner (SUPER_ADMIN hoặc CONTENT_MODERATOR)
   */
  getBlogOwnerRequests(
    query?: GetBlogOwnerRequestsQuery,
  ): Observable<ApiResponse<AdminPaginatedResponse<AdminBlogOwnerRequestItem>>> {
    let params = new HttpParams();
    if (query?.userId != null) {
      params = params.set('userId', query.userId.toString());
    }
    if (query?.status) {
      params = params.set('status', query.status);
    }
    if (query?.page != null) {
      params = params.set('page', query.page.toString());
    }
    if (query?.limit != null) {
      params = params.set('limit', query.limit.toString());
    }

    return this.http.get<ApiResponse<AdminPaginatedResponse<AdminBlogOwnerRequestItem>>>(
      `${this.apiUrl}/admin/requests/blog-owner`,
      { params },
    );
  }

  /**
   * A08 — PATCH /api/v1/admin/requests/blog-owner/:id
   * Duyệt hoặc từ chối yêu cầu Blog Owner (SUPER_ADMIN hoặc CONTENT_MODERATOR)
   */
  reviewBlogOwnerRequest(
    id: number,
    body: ReviewBlogOwnerRequestDto,
  ): Observable<ApiResponse<AdminBlogOwnerRequestItem>> {
    return this.http.patch<ApiResponse<AdminBlogOwnerRequestItem>>(
      `${this.apiUrl}/admin/requests/blog-owner/${id}`,
      body,
    );
  }

  /**
   * A09 — GET /api/v1/admin/users
   * Lấy danh sách user hệ thống (chỉ SUPER_ADMIN)
   */
  getAdminUsers(
    query?: GetAdminUsersQuery,
  ): Observable<ApiResponse<AdminPaginatedResponse<AdminUserItem>>> {
    let params = new HttpParams();
    if (query?.search) {
      params = params.set('search', query.search);
    }
    if (query?.role) {
      params = params.set('role', query.role);
    }
    if (query?.status) {
      params = params.set('status', query.status);
    }
    if (query?.page != null) {
      params = params.set('page', query.page.toString());
    }
    if (query?.limit != null) {
      params = params.set('limit', query.limit.toString());
    }

    return this.http.get<ApiResponse<AdminPaginatedResponse<AdminUserItem>>>(
      `${this.apiUrl}/admin/users`,
      { params },
    );
  }

  /**
   * A10 — POST /api/v1/admin/users/moderators
   * Tạo tài khoản Content Moderator mới (chỉ SUPER_ADMIN)
   */
  createModerator(
    body: CreateModeratorRequest,
  ): Observable<ApiResponse<AdminUserItem>> {
    return this.http.post<ApiResponse<AdminUserItem>>(
      `${this.apiUrl}/admin/users/moderators`,
      body,
    );
  }

  /**
   * A11 — GET /api/v1/admin/users/:id
   * Lấy chi tiết user và danh sách bài viết (chỉ SUPER_ADMIN)
   */
  getAdminUserById(id: number): Observable<ApiResponse<AdminUserDetail>> {
    return this.http.get<ApiResponse<AdminUserDetail>>(
      `${this.apiUrl}/admin/users/${id}`,
    );
  }

  /**
   * A12 — PATCH /api/v1/admin/users/:id
   * Cập nhật thông tin cơ bản của user (chỉ SUPER_ADMIN)
   */
  updateAdminUser(
    id: number,
    body: UpdateAdminUserDto,
  ): Observable<ApiResponse<AdminUserItem>> {
    return this.http.patch<ApiResponse<AdminUserItem>>(
      `${this.apiUrl}/admin/users/${id}`,
      body,
    );
  }

  /**
   * A13 — PATCH /api/v1/admin/users/:id/lock
   * Khóa tài khoản user (chỉ SUPER_ADMIN)
   */
  lockUser(
    id: number,
    body: LockUserDto,
  ): Observable<ApiResponse<AdminUserItem>> {
    return this.http.patch<ApiResponse<AdminUserItem>>(
      `${this.apiUrl}/admin/users/${id}/lock`,
      body,
    );
  }

  /**
   * A14 — PATCH /api/v1/admin/users/:id/unlock
   * Mở khóa tài khoản user (chỉ SUPER_ADMIN)
   */
  unlockUser(id: number): Observable<ApiResponse<AdminUserItem>> {
    return this.http.patch<ApiResponse<AdminUserItem>>(
      `${this.apiUrl}/admin/users/${id}/unlock`,
      {},
    );
  }

  /**
   * A15 — PATCH /api/v1/admin/users/:id/role
   * Đổi vai trò (role) người dùng (chỉ SUPER_ADMIN)
   */
  changeUserRole(
    id: number,
    body: ChangeUserRoleDto,
  ): Observable<ApiResponse<AdminUserItem>> {
    return this.http.patch<ApiResponse<AdminUserItem>>(
      `${this.apiUrl}/admin/users/${id}/role`,
      body,
    );
  }

  /**
   * A16 — DELETE /api/v1/admin/users/:id
   * Xóa mềm tài khoản user (chỉ SUPER_ADMIN)
   */
  deleteAdminUser(id: number): Observable<ApiResponse<AdminUserItem>> {
    return this.http.delete<ApiResponse<AdminUserItem>>(
      `${this.apiUrl}/admin/users/${id}`,
    );
  }
}

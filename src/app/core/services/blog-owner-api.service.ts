import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  BlogOwnerDashboardActivity,
  BlogOwnerDashboardData,
  BlogOwnerDashboardFeatured,
  BlogOwnerDashboardFeaturedSort,
  BlogOwnerDashboardSummary,
  BlogOwnerOptions,
  BlogOwnerPost,
  BlogOwnerPostsPage,
  BlogOwnerPostsQuery,
  BlogOwnerTranslationBatchProgress,
  CreateBlogOwnerPostRequest,
  CreateTranslationRequest,
  TranslationPreviewRequest,
  TranslationPreviewResponse,
  UpdateBlogOwnerPostRequest,
} from '../models/blog-owner.model';

@Injectable({ providedIn: 'root' })
export class BlogOwnerApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/blog-owner`;

  /** B01 - Dashboard của Blog Owner đang đăng nhập. */
  getDashboard(): Observable<ApiResponse<BlogOwnerDashboardData>> {
    return this.http.get<ApiResponse<BlogOwnerDashboardData>>(
      `${this.apiUrl}/dashboard`,
    );
  }

  /** Dashboard summary: post counts + total interactions. */
  getDashboardSummary(): Observable<ApiResponse<BlogOwnerDashboardSummary>> {
    return this.http.get<ApiResponse<BlogOwnerDashboardSummary>>(
      `${this.apiUrl}/dashboard/summary`,
    );
  }

  /** Dashboard activity theo ngày. */
  getDashboardActivity(
    days = 7,
  ): Observable<ApiResponse<BlogOwnerDashboardActivity>> {
    const params = new HttpParams().set('days', String(days));

    return this.http.get<ApiResponse<BlogOwnerDashboardActivity>>(
      `${this.apiUrl}/dashboard/activity`,
      { params },
    );
  }

  /** Bài nổi bật theo exact post version. */
  getDashboardFeatured(
    sort: BlogOwnerDashboardFeaturedSort = 'views',
    limit = 5,
  ): Observable<ApiResponse<BlogOwnerDashboardFeatured>> {
    const params = new HttpParams()
      .set('sort', sort)
      .set('limit', String(limit));

    return this.http.get<ApiResponse<BlogOwnerDashboardFeatured>>(
      `${this.apiUrl}/dashboard/featured`,
      { params },
    );
  }

  /** B02 - Dữ liệu động cho form: ngôn ngữ, category và tag. */
  getOptions(): Observable<ApiResponse<BlogOwnerOptions>> {
    return this.http.get<ApiResponse<BlogOwnerOptions>>(`${this.apiUrl}/options`);
  }

  /** B03 - Danh sách bài của chính Blog Owner, có phân trang và bộ lọc. */
  getPosts(
    query: BlogOwnerPostsQuery = {},
  ): Observable<ApiResponse<BlogOwnerPostsPage>> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      params = params.set(key, String(value));
    }

    return this.http.get<ApiResponse<BlogOwnerPostsPage>>(
      `${this.apiUrl}/posts`,
      { params },
    );
  }

  /** B04 - Chi tiết bài và các phiên bản ngôn ngữ cùng nhóm. */
  getPost(postId: number): Observable<ApiResponse<BlogOwnerPost>> {
    return this.http.get<ApiResponse<BlogOwnerPost>>(
      `${this.apiUrl}/posts/${postId}`,
    );
  }

  /** B05 - Tạo bài gốc. Không gửi status; dùng submitForReview. */
  createPost(
    body: CreateBlogOwnerPostRequest | FormData,
  ): Observable<ApiResponse<BlogOwnerPost>> {
    return this.http.post<ApiResponse<BlogOwnerPost>>(
      `${this.apiUrl}/posts`,
      body,
    );
  }

  /** B06 - Cập nhật bài của chính Blog Owner. */
  updatePost(
    postId: number,
    body: UpdateBlogOwnerPostRequest | FormData,
  ): Observable<ApiResponse<BlogOwnerPost>> {
    return this.http.patch<ApiResponse<BlogOwnerPost>>(
      `${this.apiUrl}/posts/${postId}`,
      body,
    );
  }

  /** B07 - Xóa mềm bài viết. */
  deletePost(postId: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.apiUrl}/posts/${postId}`,
    );
  }

  /** B08 - Chỉ DRAFT mới được gửi Moderator duyệt. */
  submitPost(postId: number): Observable<ApiResponse<BlogOwnerPost>> {
    return this.http.post<ApiResponse<BlogOwnerPost>>(
      `${this.apiUrl}/posts/${postId}/submit`,
      {},
    );
  }

  /** B09 - Chỉ dịch tự động title/content, chưa ghi database. */
  translatePreview(
    postId: number,
    body: TranslationPreviewRequest,
  ): Observable<ApiResponse<TranslationPreviewResponse>> {
    return this.http.post<ApiResponse<TranslationPreviewResponse>>(
      `${this.apiUrl}/posts/${postId}/translate-preview`,
      body,
    );
  }

  /** B10 - Lưu bản dịch thành một Post DRAFT. Category/tag do backend map/copy. */
  createTranslation(
    postId: number,
    body: CreateTranslationRequest,
  ): Observable<ApiResponse<BlogOwnerPost>> {
    return this.http.post<ApiResponse<BlogOwnerPost>>(
      `${this.apiUrl}/posts/${postId}/translations`,
      body,
    );
  }

  /**
   * Theo dõi trạng thái một batch dịch nền BullMQ.
   *
   * FE poll endpoint này sau create/update khi response có translationBatch.
   */
  getTranslationBatchStatus(
    batchId: string,
  ): Observable<ApiResponse<BlogOwnerTranslationBatchProgress>> {
    return this.http.get<ApiResponse<BlogOwnerTranslationBatchProgress>>(
      `${this.apiUrl}/translation-batches/${encodeURIComponent(batchId)}`,
    );
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  GetModeratorPostsQuery,
  GetModeratorReportsQuery,
  ModeratorDashboardData,
  ModeratorDashboardOverview,
  ModeratorDashboardReportStats,
  ModeratorDashboardReportTrend,
  ModeratorPostItem,
  ModeratorPostsPaginatedResponse,
  ModeratorReportItem,
  ModeratorReportsPaginatedResponse,
  RejectModeratorPostDto,
  RejectModeratorReportDto,
  ResolveModeratorReportDto,
  CreateModeratorCategoryGroupDto,
  GetModeratorCategoryGroupsQuery,
  ModeratorCategoryGroup,
  ModeratorCategoryGroupsPaginatedResponse,
  UpdateModeratorCategoryGroupDto,
} from '../models/moderator-api.model';

@Injectable({ providedIn: 'root' })
export class ModeratorApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * M01 — GET /api/v1/moderator/dashboard
   * Lấy thống kê tổng quan phục vụ màn hình Moderator
   */
  getModeratorDashboard(): Observable<ApiResponse<ModeratorDashboardData>> {
    return this.http.get<ApiResponse<ModeratorDashboardData>>(
      `${this.apiUrl}/moderator/dashboard`,
    );
  }
  /**
 * GET /api/v1/moderator/dashboard/overview
 */
getModeratorDashboardOverview(): Observable<
  ApiResponse<ModeratorDashboardOverview>
> {
  return this.http.get<ApiResponse<ModeratorDashboardOverview>>(
    `${this.apiUrl}/moderator/dashboard/overview`,
  );
}

/**
 * GET /api/v1/moderator/dashboard/report-stats
 */
  getModeratorDashboardReportStats(): Observable<
    ApiResponse<ModeratorDashboardReportStats>
  > {
    return this.http.get<ApiResponse<ModeratorDashboardReportStats>>(
      `${this.apiUrl}/moderator/dashboard/report-stats`,
    );
  }

/**
 * GET /api/v1/moderator/dashboard/report-trend
 */
  getModeratorDashboardReportTrend(): Observable<
    ApiResponse<ModeratorDashboardReportTrend>
  > {
    return this.http.get<ApiResponse<ModeratorDashboardReportTrend>>(
      `${this.apiUrl}/moderator/dashboard/report-trend`,
    );
  }
  /**
   * M02 — GET /api/v1/moderator/posts
   * Lấy danh sách bài Moderator được phép xem
   */
  getModeratorPosts(
    query?: GetModeratorPostsQuery,
  ): Observable<ApiResponse<ModeratorPostsPaginatedResponse>> {
    let params = new HttpParams();

    if (query?.status) {
      params = params.set('status', query.status);
    }
    if (query?.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query?.categoryId != null) {
      params = params.set('categoryId', query.categoryId.toString());
    }
    if (query?.languageId != null) {
      params = params.set('languageId', query.languageId.toString());
    }
    if (query?.authorId != null) {
      params = params.set('authorId', query.authorId.toString());
    }
    if (query?.tagId != null) {
      params = params.set('tagId', query.tagId.toString());
    }
    if (query?.tagName?.trim()) {
      params = params.set('tagName', query.tagName.trim());
    }
    if (query?.page != null) {
      params = params.set('page', query.page.toString());
    }
    if (query?.limit != null) {
      params = params.set('limit', query.limit.toString());
    }
    if (query?.lang?.trim()) {
      params = params.set('lang', query.lang.trim());
    }
    if (query?.sortBy?.trim()) {
      params = params.set('sortBy', query.sortBy.trim());
    }
    if (query?.sortOrder?.trim()) {
      params = params.set('sortOrder', query.sortOrder.trim());
    }
    if (query?.order?.trim()) {
      params = params.set('order', query.order.trim());
    }

    return this.http.get<ApiResponse<ModeratorPostsPaginatedResponse>>(
      `${this.apiUrl}/moderator/posts`,
      { params },
    );
  }

  /**
   * M03 — GET /api/v1/moderator/posts/:postId
   * Xem chi tiết một bài viết
   */
  getModeratorPostDetail(postId: number): Observable<ApiResponse<ModeratorPostItem>> {
    return this.http.get<ApiResponse<ModeratorPostItem>>(
      `${this.apiUrl}/moderator/posts/${postId}`,
    );
  }

  /**
   * M04 — POST /api/v1/moderator/posts/:postId/approve
   * Duyệt một bài đang chờ kiểm duyệt
   */
  approvePost(postId: number): Observable<ApiResponse<ModeratorPostItem>> {
    return this.http.post<ApiResponse<ModeratorPostItem>>(
      `${this.apiUrl}/moderator/posts/${postId}/approve`,
      {},
    );
  }

  /**
   * M05 — POST /api/v1/moderator/posts/:postId/reject
   * Từ chối một bài đang chờ kiểm duyệt
   */
  rejectPost(
    postId: number,
    dto: RejectModeratorPostDto,
  ): Observable<ApiResponse<ModeratorPostItem>> {
    return this.http.post<ApiResponse<ModeratorPostItem>>(
      `${this.apiUrl}/moderator/posts/${postId}/reject`,
      dto,
    );
  }

  /**
 * GET /api/v1/moderator/category-groups
 */
getModeratorCategoryGroups(
  query?: GetModeratorCategoryGroupsQuery,
): Observable<
  ApiResponse<ModeratorCategoryGroupsPaginatedResponse>
> {
  let params = new HttpParams();

  if (query?.search?.trim()) {
    params = params.set(
      'search',
      query.search.trim(),
    );
  }

  if (query?.page != null) {
    params = params.set(
      'page',
      query.page.toString(),
    );
  }

  if (query?.limit != null) {
    params = params.set(
      'limit',
      query.limit.toString(),
    );
  }

  return this.http.get<
    ApiResponse<ModeratorCategoryGroupsPaginatedResponse>
  >(
    `${this.apiUrl}/moderator/category-groups`,
    { params },
  );
}

/**
 * GET /api/v1/moderator/category-groups/:groupId
 */
getModeratorCategoryGroupDetail(
  groupId: number,
): Observable<ApiResponse<ModeratorCategoryGroup>> {
  return this.http.get<
    ApiResponse<ModeratorCategoryGroup>
  >(
    `${this.apiUrl}/moderator/category-groups/${groupId}`,
  );
}

/**
 * POST /api/v1/moderator/category-groups
 */
createModeratorCategoryGroup(
  dto: CreateModeratorCategoryGroupDto,
): Observable<ApiResponse<ModeratorCategoryGroup>> {
  return this.http.post<
    ApiResponse<ModeratorCategoryGroup>
  >(
    `${this.apiUrl}/moderator/category-groups`,
    dto,
  );
}

/**
 * PATCH /api/v1/moderator/category-groups/:groupId
 */
updateModeratorCategoryGroup(
  groupId: number,
  dto: UpdateModeratorCategoryGroupDto,
): Observable<ApiResponse<ModeratorCategoryGroup>> {
  return this.http.patch<
    ApiResponse<ModeratorCategoryGroup>
  >(
    `${this.apiUrl}/moderator/category-groups/${groupId}`,
    dto,
  );
}

/**
 * DELETE /api/v1/moderator/category-groups/:groupId
 */
deleteModeratorCategoryGroup(
  groupId: number,
): Observable<ApiResponse<ModeratorCategoryGroup>> {
  return this.http.delete<
    ApiResponse<ModeratorCategoryGroup>
  >(
    `${this.apiUrl}/moderator/category-groups/${groupId}`,
  );
}

  /**
   * M06 — GET /api/v1/moderator/reports
   * Lấy danh sách report (báo cáo bài viết hoặc bình luận)
   */
  getModeratorReports(
    query?: GetModeratorReportsQuery,
  ): Observable<ApiResponse<ModeratorReportsPaginatedResponse>> {
    let params = new HttpParams();

    if (query?.targetType) {
      params = params.set('targetType', query.targetType);
    }
    if (query?.status) {
      params = params.set('status', query.status);
    }
    if (query?.reason) {
      params = params.set('reason', query.reason);
    }
    if (query?.reporterId != null) {
      params = params.set('reporterId', query.reporterId.toString());
    }
    if (query?.postId != null) {
      params = params.set('postId', query.postId.toString());
    }
    if (query?.commentId != null) {
      params = params.set('commentId', query.commentId.toString());
    }
    if (query?.page != null) {
      params = params.set('page', query.page.toString());
    }
    if (query?.limit != null) {
      params = params.set('limit', query.limit.toString());
    }

    return this.http.get<ApiResponse<ModeratorReportsPaginatedResponse>>(
      `${this.apiUrl}/moderator/reports`,
      { params },
    );
  }

  /**
   * M07 — GET /api/v1/moderator/reports/:reportId
   * Xem chi tiết một report
   */
  getModeratorReportDetail(reportId: number): Observable<ApiResponse<ModeratorReportItem>> {
    return this.http.get<ApiResponse<ModeratorReportItem>>(
      `${this.apiUrl}/moderator/reports/${reportId}`,
    );
  }

  /**
   * M08 — POST /api/v1/moderator/reports/:reportId/resolve
   * Xác nhận report đúng và ẩn nội dung vi phạm
   */
  resolveReport(
    reportId: number,
    dto: ResolveModeratorReportDto,
  ): Observable<ApiResponse<ModeratorReportItem>> {
    return this.http.post<ApiResponse<ModeratorReportItem>>(
      `${this.apiUrl}/moderator/reports/${reportId}/resolve`,
      dto,
    );
  }

  /**
   * M09 — POST /api/v1/moderator/reports/:reportId/reject
   * Bác bỏ report và giữ nguyên nội dung bị báo cáo
   */
  rejectReport(
    reportId: number,
    dto: RejectModeratorReportDto,
  ): Observable<ApiResponse<ModeratorReportItem>> {
    return this.http.post<ApiResponse<ModeratorReportItem>>(
      `${this.apiUrl}/moderator/reports/${reportId}/reject`,
      dto,
    );
  }
}

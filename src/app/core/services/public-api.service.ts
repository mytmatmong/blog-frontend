import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { TranslationService } from './translation.service';

import {
  AuthorInfoResponse,
  GetCategoriesQueryParams,
  GetCommentsQueryParams,
  GetPostsQueryParams,
  GetTagsQueryParams,
  PaginatedCategoriesResponse,
  PaginatedCommentsResponse,
  PaginatedPostsResponse,
  PaginatedTagsResponse,
  PublicPost,
  TopAuthor,
  TopTagItem,
} from '../models/post.model';

@Injectable({
  providedIn: 'root',
})
export class PublicApiService {
  private readonly http = inject(HttpClient);

  private readonly translationService =
    inject(TranslationService);

  private readonly apiUrl = environment.apiUrl;

  /**
   * P05 — GET /posts
   *
   * Route này KHÔNG nhận query lang.
   * Ngôn ngữ được truyền bằng Accept-Language.
   */
  getPosts(
    query: GetPostsQueryParams = {},
  ): Observable<ApiResponse<PaginatedPostsResponse>> {
    const params = this.buildPostParams(query);

    return this.http.get<
      ApiResponse<PaginatedPostsResponse>
    >(`${this.apiUrl}/posts`, {
      params,
      headers: this.getLanguageHeaders(),
    });
  }

  /**
   * P06 — GET /posts/top
   *
   * Route này được phép nhận query lang.
   * Response data là mảng trực tiếp.
   */
  getTopPosts(
    limit = 10,
    lang?: string,
  ): Observable<ApiResponse<PublicPost[]>> {
    let params = new HttpParams().set(
      'limit',
      limit.toString(),
    );

    params = this.setString(
      params,
      'lang',
      lang,
    );

    return this.http.get<ApiResponse<PublicPost[]>>(
      `${this.apiUrl}/posts/top`,
      {
        params,
        headers: this.getLanguageHeaders(),
      },
    );
  }

  /**
   * P07 — GET /posts/:id
   *
   * Route này được phép nhận query lang.
   */
  getPostById(
    id: number,
    lang?: string,
  ): Observable<ApiResponse<PublicPost>> {
    let params = new HttpParams();

    params = this.setString(
      params,
      'lang',
      lang,
    );

    return this.http.get<ApiResponse<PublicPost>>(
      `${this.apiUrl}/posts/${id}`,
      {
        params,
        headers: this.getLanguageHeaders(),
      },
    );
  }

  /**
   * P08 — GET /authors/top
   */
  getTopAuthors(
    limit = 10,
  ): Observable<ApiResponse<TopAuthor[]>> {
    const params = new HttpParams().set(
      'limit',
      limit.toString(),
    );

    return this.http.get<ApiResponse<TopAuthor[]>>(
      `${this.apiUrl}/authors/top`,
      {
        params,
        headers: this.getLanguageHeaders(),
      },
    );
  }

  /**
   * P09 — GET /authors/:id
   *
   * Route này KHÔNG nhận query lang.
   * Sử dụng Accept-Language.
   */
  getAuthorById(
    id: number,
    query: GetPostsQueryParams = {},
  ): Observable<ApiResponse<AuthorInfoResponse>> {
    const params = this.buildPostParams(query);

    return this.http.get<
      ApiResponse<AuthorInfoResponse>
    >(`${this.apiUrl}/authors/${id}`, {
      params,
      headers: this.getLanguageHeaders(),
    });
  }

  /**
   * P10 — GET /categories
   *
   * Route này KHÔNG nhận query lang.
   * Sử dụng Accept-Language.
   */
  getCategories(
    query: GetCategoriesQueryParams = {},
  ): Observable<
    ApiResponse<PaginatedCategoriesResponse>
  > {
    let params = new HttpParams();

    params = this.setString(
      params,
      'search',
      query.search,
    );

    params = this.setNumber(
      params,
      'languageId',
      query.languageId,
    );

    params = this.setNumber(
      params,
      'page',
      query.page,
    );

    params = this.setNumber(
      params,
      'limit',
      query.limit,
    );

    params = this.applySortParams(
      params,
      query,
    );

    return this.http.get<
      ApiResponse<PaginatedCategoriesResponse>
    >(`${this.apiUrl}/categories`, {
      params,
      headers: this.getLanguageHeaders(),
    });
  }

  /**
   * P11 — GET /tags
   *
   * Route này chỉ nhận search, page và limit.
   */
  getTags(
    query: GetTagsQueryParams = {},
  ): Observable<
    ApiResponse<PaginatedTagsResponse>
  > {
    let params = new HttpParams();

    params = this.setString(
      params,
      'search',
      query.search,
    );

    params = this.setNumber(
      params,
      'page',
      query.page,
    );

    params = this.setNumber(
      params,
      'limit',
      query.limit,
    );

    params = this.applySortParams(
      params,
      query,
    );

    return this.http.get<
      ApiResponse<PaginatedTagsResponse>
    >(`${this.apiUrl}/tags`, {
      params,
      headers: this.getLanguageHeaders(),
    });
  }

  /**
   * P12 — GET /tags/top
   *
   * Route này được phép nhận query lang.
   */
  getTopTags(
    limit = 10,
    lang?: string,
  ): Observable<ApiResponse<TopTagItem[]>> {
    let params = new HttpParams().set(
      'limit',
      limit.toString(),
    );

    params = this.setString(
      params,
      'lang',
      lang,
    );

    return this.http.get<ApiResponse<TopTagItem[]>>(
      `${this.apiUrl}/tags/top`,
      {
        params,
        headers: this.getLanguageHeaders(),
      },
    );
  }

  /**
   * P13 — GET /posts/:postId/comments
   */
  getPostComments(
    postId: number,
    query: GetCommentsQueryParams = {},
  ): Observable<
    ApiResponse<PaginatedCommentsResponse>
  > {
    let params = new HttpParams();

    params = this.setNumber(
      params,
      'page',
      query.page,
    );

    params = this.setNumber(
      params,
      'limit',
      query.limit,
    );

    params = this.applySortParams(
      params,
      query,
    );

    return this.http.get<
      ApiResponse<PaginatedCommentsResponse>
    >(
      `${this.apiUrl}/posts/${postId}/comments`,
      {
        params,
        headers: this.getLanguageHeaders(),
      },
    );
  }

  /**
   * Chỉ tạo query được GetPostsDto chấp nhận.
   *
   * Không được thêm lang vào đây vì:
   * - GET /posts không nhận lang.
   * - GET /authors/:id không nhận lang.
   */
  private buildPostParams(
    query: GetPostsQueryParams,
  ): HttpParams {
    let params = new HttpParams();

    params = this.setString(
      params,
      'search',
      query.search,
    );

    params = this.setNumber(
      params,
      'categoryId',
      query.categoryId,
    );

    params = this.setNumber(
      params,
      'languageId',
      query.languageId,
    );

    params = this.setNumber(
      params,
      'authorId',
      query.authorId,
    );

    params = this.setNumber(
      params,
      'parentPostId',
      query.parentPostId,
    );

    params = this.setString(
      params,
      'status',
      query.status,
    );

    params = this.setNumber(
      params,
      'tagId',
      query.tagId,
    );

    params = this.setString(
      params,
      'tagName',
      query.tagName,
    );

    params = this.setNumber(
      params,
      'bookmarkedByUserId',
      query.bookmarkedByUserId,
    );

    params = this.setNumber(
      params,
      'page',
      query.page,
    );

    params = this.setNumber(
      params,
      'limit',
      query.limit,
    );

    params = this.applySortParams(
      params,
      query,
    );

    return params;
  }

  /**
   * Backend nhận vi hoặc en.
   */
  private getLanguageHeaders(): HttpHeaders {
    const languageCode = this.translationService
      .currentLang()
      .toLowerCase();

    return new HttpHeaders({
      'Accept-Language': languageCode,
    });
  }

  private setString(
    params: HttpParams,
    key: string,
    value: string | undefined,
  ): HttpParams {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      return params;
    }

    return params.set(
      key,
      normalizedValue,
    );
  }

  private setNumber(
    params: HttpParams,
    key: string,
    value: number | undefined,
  ): HttpParams {
    if (
      value === undefined ||
      value === null ||
      !Number.isFinite(value)
    ) {
      return params;
    }

    return params.set(
      key,
      value.toString(),
    );
  }
  private applySortParams(
    params: HttpParams,
    query: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      order?: 'asc' | 'desc';
    },
  ): HttpParams {
    params = this.setString(
      params,
      'sortBy',
      query.sortBy,
    );

    /**
     * Không gửi đồng thời sortOrder và order.
     * Nếu có sortOrder thì ưu tiên sortOrder.
     */
    if (query.sortOrder) {
      return this.setString(
        params,
        'sortOrder',
        query.sortOrder,
      );
    }

    if (query.order) {
      return this.setString(
        params,
        'order',
        query.order,
      );
    }

    return params;
  }
}
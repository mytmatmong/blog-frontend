import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

import {
  AuthorInfoResponse,
  GetCategoriesQueryParams,
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
  private readonly apiUrl = environment.apiUrl;

  /**
   * P05 — GET /posts
   */
  getPosts(
    query: GetPostsQueryParams = {},
  ): Observable<ApiResponse<PaginatedPostsResponse>> {
    const params = this.buildPostParams(query);

    return this.http.get<
      ApiResponse<PaginatedPostsResponse>
    >(
      `${this.apiUrl}/posts`,
      { params },
    );
  }

  /**
   * P06 — GET /posts/top
   *
   * data là mảng trực tiếp, không có meta.
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
      { params },
    );
  }

  /**
   * P07 — GET /posts/:id
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
      { params },
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
      { params },
    );
  }

  /**
   * P09 — GET /authors/:id
   *
   * Các bộ lọc bài viết giống GET /posts.
   * authorId frontend gửi sẽ bị backend ghi đè bằng ID trên URL.
   */
  getAuthorById(
    id: number,
    query: GetPostsQueryParams = {},
  ): Observable<ApiResponse<AuthorInfoResponse>> {
    const params = this.buildPostParams(query);

    return this.http.get<
      ApiResponse<AuthorInfoResponse>
    >(
      `${this.apiUrl}/authors/${id}`,
      { params },
    );
  }

  /**
   * P10 — GET /categories
   *
   * API này không nhận categoryGroupId.
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

    params = this.setString(
      params,
      'lang',
      query.lang,
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

    return this.http.get<
      ApiResponse<PaginatedCategoriesResponse>
    >(
      `${this.apiUrl}/categories`,
      { params },
    );
  }

  /**
   * P11 — GET /posts/:postId/comments
   *
   * Chỉ comment gốc được phân trang.
   * Replies nằm trong từng comment.
   */
  getPostComments(
    postId: number,
    page = 1,
    limit = 10,
  ): Observable<
    ApiResponse<PaginatedCommentsResponse>
  > {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<
      ApiResponse<PaginatedCommentsResponse>
    >(
      `${this.apiUrl}/posts/${postId}/comments`,
      { params },
    );
  }

  /**
   * P12 — GET /tags/top
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
      { params },
    );
  }

  /**
   * P13 — GET /tags
   */
  getTags(
    query: GetTagsQueryParams = {},
  ): Observable<ApiResponse<PaginatedTagsResponse>> {
    let params = new HttpParams();

    params = this.setString(
      params,
      'search',
      query.search,
    );

    params = this.setString(
      params,
      'lang',
      query.lang,
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

    return this.http.get<
      ApiResponse<PaginatedTagsResponse>
    >(
      `${this.apiUrl}/tags`,
      { params },
    );
  }

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

    params = this.setString(
      params,
      'lang',
      query.lang,
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

    return params;
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

    return params.set(key, normalizedValue);
  }

  private setNumber(
    params: HttpParams,
    key: string,
    value: number | undefined,
  ): HttpParams {
    if (
      value === undefined ||
      value === null
    ) {
      return params;
    }

    return params.set(
      key,
      value.toString(),
    );
  }
}
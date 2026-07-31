import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  PublicPost,
  GetPostsQueryParams,
  PaginatedPostsResponse,
  TopAuthor,
  AuthorInfoResponse,
  GetCategoriesQueryParams,
  PaginatedCategoriesResponse,
  PaginatedCommentsResponse,
  TopTagItem,
  GetTagsQueryParams,
  PaginatedTagsResponse
} from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PublicApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * 1. GET /api/v1/posts
   * Lấy danh sách bài viết public (có phân trang, tìm kiếm, lọc danh mục/tag)
   */
  getPosts(params?: GetPostsQueryParams): Observable<ApiResponse<PaginatedPostsResponse>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId.toString());
      if (params.languageId) httpParams = httpParams.set('languageId', params.languageId.toString());
      if (params.authorId) httpParams = httpParams.set('authorId', params.authorId.toString());
      if (params.tagId) httpParams = httpParams.set('tagId', params.tagId.toString());
      if (params.tagName) httpParams = httpParams.set('tagName', params.tagName);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.http.get<ApiResponse<PaginatedPostsResponse>>(`${this.apiUrl}/posts`, { params: httpParams });
  }

  /**
   * 2. GET /api/v1/posts/top
   * Lấy danh sách bài viết nổi bật / xem nhiều / tương tác cao
   */
  getTopPosts(limit: number = 10): Observable<ApiResponse<PublicPost[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<PublicPost[]>>(`${this.apiUrl}/posts/top`, { params });
  }

  /**
   * 3. GET /api/v1/posts/:id
   * Lấy thông tin chi tiết một bài viết public theo ID
   */
  getPostById(id: number): Observable<ApiResponse<PublicPost>> {
    return this.http.get<ApiResponse<PublicPost>>(`${this.apiUrl}/posts/${id}`);
  }

  /**
   * 4. GET /api/v1/authors/top
   * Lấy danh sách tác giả hàng đầu (theo lượng followers / tương tác)
   */
  getTopAuthors(limit: number = 10): Observable<ApiResponse<TopAuthor[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<TopAuthor[]>>(`${this.apiUrl}/authors/top`, { params });
  }

  /**
   * 5. GET /api/v1/authors/:id
   * Lấy thông tin tác giả và danh sách bài viết public của tác giả đó
   */
  getAuthorById(id: number, params?: GetPostsQueryParams): Observable<ApiResponse<AuthorInfoResponse>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.http.get<ApiResponse<AuthorInfoResponse>>(`${this.apiUrl}/authors/${id}`, { params: httpParams });
  }

  /**
   * 6. GET /api/v1/categories
   * Lấy danh sách danh mục public (phân trang, tìm kiếm, nhóm danh mục, ngôn ngữ)
   */
  getCategories(params?: GetCategoriesQueryParams): Observable<ApiResponse<PaginatedCategoriesResponse>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.categoryGroupId) httpParams = httpParams.set('categoryGroupId', params.categoryGroupId.toString());
      if (params.languageId) httpParams = httpParams.set('languageId', params.languageId.toString());
      if (params.lang) httpParams = httpParams.set('lang', params.lang);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.http.get<ApiResponse<PaginatedCategoriesResponse>>(`${this.apiUrl}/categories`, { params: httpParams });
  }

  /**
   * 7. GET /api/v1/posts/:postId/comments
   * Lấy danh sách bình luận (có reply lồng nhau) của bài viết
   */
  getPostComments(postId: number, page: number = 1, limit: number = 10): Observable<ApiResponse<PaginatedCommentsResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ApiResponse<PaginatedCommentsResponse>>(`${this.apiUrl}/posts/${postId}/comments`, { params });
  }

  /**
   * 8. GET /api/v1/tags/top
   * Lấy danh sách thẻ (tag) hot / phổ biến nhất
   */
  getTopTags(limit: number = 10): Observable<ApiResponse<TopTagItem[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<TopTagItem[]>>(`${this.apiUrl}/tags/top`, { params });
  }

  /**
   * 9. GET /api/v1/tags
   * Lấy danh sách tất cả thẻ (tag) public (có phân trang & tìm kiếm)
   */
  getTags(params?: GetTagsQueryParams): Observable<ApiResponse<PaginatedTagsResponse>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.http.get<ApiResponse<PaginatedTagsResponse>>(`${this.apiUrl}/tags`, { params: httpParams });
  }
}

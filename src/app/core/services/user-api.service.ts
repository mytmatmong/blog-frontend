import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/auth.model';
import {
  BlogOwnerRequestQuery,
  CreateBlogOwnerRequest,
  CreateCommentRequest,
  CreateReportRequest,
  FollowRecord,
  MessageResponse,
  PaginatedBlogOwnerRequests,
  PaginatedFollowUsers,
  PaginatedUserPosts,
  PaginationQuery,
  PostActionRecord,
  UpdateCommentRequest,
  UpdateProfileRequest,
  UserBlogOwnerRequest,
  UserCommentMutation,
  UserReport,
} from '../models/user-api.model';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // U04
  createBlogOwnerRequest(
    body: CreateBlogOwnerRequest,
  ): Observable<ApiResponse<UserBlogOwnerRequest>> {
    return this.http.post<ApiResponse<UserBlogOwnerRequest>>(
      `${this.apiUrl}/user/blog-owner-requests`,
      body,
    );
  }

  // U05
  getBlogOwnerRequests(
    query: BlogOwnerRequestQuery = {},
  ): Observable<ApiResponse<PaginatedBlogOwnerRequests>> {
    return this.http.get<ApiResponse<PaginatedBlogOwnerRequests>>(
      `${this.apiUrl}/user/blog-owner-requests`,
      { params: this.toParams(query) },
    );
  }

  // U06
  getBlogOwnerRequestById(
    id: number,
  ): Observable<ApiResponse<UserBlogOwnerRequest>> {
    return this.http.get<ApiResponse<UserBlogOwnerRequest>>(
      `${this.apiUrl}/user/blog-owner-requests/${id}`,
    );
  }

  // U07
  cancelBlogOwnerRequest(
    id: number,
  ): Observable<ApiResponse<UserBlogOwnerRequest>> {
    return this.http.delete<ApiResponse<UserBlogOwnerRequest>>(
      `${this.apiUrl}/user/blog-owner-requests/${id}`,
    );
  }

  // U08
  createComment(
    postId: number,
    body: CreateCommentRequest,
  ): Observable<ApiResponse<UserCommentMutation>> {
    return this.http.post<ApiResponse<UserCommentMutation>>(
      `${this.apiUrl}/user/posts/${postId}/comments`,
      body,
    );
  }

  // U09
  updateComment(
    commentId: number,
    body: UpdateCommentRequest,
  ): Observable<ApiResponse<UserCommentMutation>> {
    return this.http.patch<ApiResponse<UserCommentMutation>>(
      `${this.apiUrl}/user/comments/${commentId}`,
      body,
    );
  }

  // U10
  deleteComment(
    commentId: number,
  ): Observable<ApiResponse<UserCommentMutation>> {
    return this.http.delete<ApiResponse<UserCommentMutation>>(
      `${this.apiUrl}/user/comments/${commentId}`,
    );
  }

  // U11
  getMyFollowers(
    query: PaginationQuery = {},
  ): Observable<ApiResponse<PaginatedFollowUsers>> {
    return this.http.get<ApiResponse<PaginatedFollowUsers>>(
      `${this.apiUrl}/user/follow/followers`,
      { params: this.toParams(query) },
    );
  }

  // U12
  getMyFollowing(
    query: PaginationQuery = {},
  ): Observable<ApiResponse<PaginatedFollowUsers>> {
    return this.http.get<ApiResponse<PaginatedFollowUsers>>(
      `${this.apiUrl}/user/follow/following`,
      { params: this.toParams(query) },
    );
  }

  // U13
  getUserFollowers(
    userId: number,
    query: PaginationQuery = {},
  ): Observable<ApiResponse<PaginatedFollowUsers>> {
    return this.http.get<ApiResponse<PaginatedFollowUsers>>(
      `${this.apiUrl}/user/follow/${userId}/followers`,
      { params: this.toParams(query) },
    );
  }

  // U14
  getUserFollowing(
    userId: number,
    query: PaginationQuery = {},
  ): Observable<ApiResponse<PaginatedFollowUsers>> {
    return this.http.get<ApiResponse<PaginatedFollowUsers>>(
      `${this.apiUrl}/user/follow/${userId}/following`,
      { params: this.toParams(query) },
    );
  }

  // U15
  followUser(
    userId: number,
  ): Observable<ApiResponse<FollowRecord>> {
    return this.http.post<ApiResponse<FollowRecord>>(
      `${this.apiUrl}/user/follow/${userId}`,
      {},
    );
  }

  // U16
  unfollowUser(
    userId: number,
  ): Observable<ApiResponse<MessageResponse>> {
    return this.http.delete<ApiResponse<MessageResponse>>(
      `${this.apiUrl}/user/follow/${userId}`,
    );
  }

  // U17
  getBookmarkedPosts(
    query: PaginationQuery = {},
  ): Observable<ApiResponse<PaginatedUserPosts>> {
    return this.http.get<ApiResponse<PaginatedUserPosts>>(
      `${this.apiUrl}/user/posts/bookmarks`,
      { params: this.toParams(query) },
    );
  }

  // U18
  getLikedPosts(
    query: PaginationQuery = {},
  ): Observable<ApiResponse<PaginatedUserPosts>> {
    return this.http.get<ApiResponse<PaginatedUserPosts>>(
      `${this.apiUrl}/user/posts/likes`,
      { params: this.toParams(query) },
    );
  }

  // U19
  bookmarkPost(
    postId: number,
  ): Observable<ApiResponse<PostActionRecord>> {
    return this.http.post<ApiResponse<PostActionRecord>>(
      `${this.apiUrl}/user/posts/${postId}/bookmark`,
      {},
    );
  }

  // U20
  removeBookmark(
    postId: number,
  ): Observable<ApiResponse<MessageResponse>> {
    return this.http.delete<ApiResponse<MessageResponse>>(
      `${this.apiUrl}/user/posts/${postId}/bookmark`,
    );
  }

  // U21
  likePost(
    postId: number,
  ): Observable<ApiResponse<PostActionRecord>> {
    return this.http.post<ApiResponse<PostActionRecord>>(
      `${this.apiUrl}/user/posts/${postId}/like`,
      {},
    );
  }

  // U22
  unlikePost(
    postId: number,
  ): Observable<ApiResponse<MessageResponse>> {
    return this.http.delete<ApiResponse<MessageResponse>>(
      `${this.apiUrl}/user/posts/${postId}/like`,
    );
  }

  // U23
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(
      `${this.apiUrl}/user/profile`,
    );
  }

  // U24
  updateProfile(
    body: UpdateProfileRequest | FormData,
  ): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(
      `${this.apiUrl}/user/profile`,
      body,
    );
  }

  // U25
  deleteProfile(): Observable<ApiResponse<User>> {
    return this.http.delete<ApiResponse<User>>(
      `${this.apiUrl}/user/profile`,
    );
  }

  // U26
  uploadAvatar(
    file: File,
  ): Observable<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<User>>(
      `${this.apiUrl}/user/profile/avatar`,
      formData,
    );
  }

  // U27
  reportPost(
    postId: number,
    body: CreateReportRequest,
  ): Observable<ApiResponse<UserReport>> {
    return this.http.post<ApiResponse<UserReport>>(
      `${this.apiUrl}/user/posts/${postId}/reports`,
      body,
    );
  }

  // U28
  reportComment(
    commentId: number,
    body: CreateReportRequest,
  ): Observable<ApiResponse<UserReport>> {
    return this.http.post<ApiResponse<UserReport>>(
      `${this.apiUrl}/user/comments/${commentId}/reports`,
      body,
    );
  }

  private toParams(
    query: object,
  ): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      params = params.set(key, String(value));
    }

    return params;
  }
}

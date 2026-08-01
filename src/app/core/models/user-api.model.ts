import { User, UserSummary } from './auth.model';
import {
  PaginatedResponse,
  PublicPost,
} from './post.model';

export type BlogOwnerRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE'
  | 'COPYRIGHT'
  | 'MISINFORMATION'
  | 'OTHER';

export type ReportTargetType = 'POST' | 'COMMENT';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface BlogOwnerRequestQuery extends PaginationQuery {
  status?: BlogOwnerRequestStatus;
}

export interface CreateBlogOwnerRequest {
  reason: string;
  topics?: string;
}

export interface UserBlogOwnerRequest {
  id: number;
  userId: number;
  reason: string;
  topics: string | null;
  status: BlogOwnerRequestStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number | null;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface UserCommentMutation {
  id: number;
  postId: number;
  userId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowRecord {
  followerId: number;
  followingId: number;
  createdAt: string;
}

export interface PostActionRecord {
  postId: number;
  userId: number;
  createdAt: string;
}

export interface MessageResponse {
  message: string;
}

export interface UpdateProfileRequest {
  password?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CreateReportRequest {
  reason: ReportReason;
  description?: string;
}

export interface UserReport {
  id: number;
  reporterId: number;
  targetType: ReportTargetType;
  postId: number | null;
  commentId: number | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaginatedBlogOwnerRequests =
  PaginatedResponse<UserBlogOwnerRequest>;

export type PaginatedFollowUsers =
  PaginatedResponse<UserSummary>;

export type PaginatedUserPosts =
  PaginatedResponse<PublicPost>;

export type UserProfile = User;

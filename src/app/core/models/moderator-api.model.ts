export interface ModeratorDashboardOverview {
  pendingPosts: number;
  pendingReports: number;
  pendingPostReports: number;
  pendingCommentReports: number;
  activeCategoryGroups: number;
  processedToday: number;
  processedPostsToday: number;
  processedReportsToday: number;
}

export interface ModeratorReportStatusCounts {
  pending: number;
  resolved: number;
  rejected: number;
}

export interface ModeratorReportReasonCounts {
  spam: number;
  harassment: number;
  inappropriate: number;
  copyright: number;
  misinformation: number;
  other: number;
}

export interface ModeratorLast7DaysItem {
  date: string;
  postReports: number;
  commentReports: number;
  totalReports: number;
}

export interface ModeratorDashboardReportStats {
  reportStatusCounts: ModeratorReportStatusCounts;
  reportReasonCounts: ModeratorReportReasonCounts;
}

export interface ModeratorDashboardReportTrend {
  last7Days: ModeratorLast7DaysItem[];
}
export interface ModeratorDashboardData {
  overview: ModeratorDashboardOverview;
  reportStatusCounts: ModeratorReportStatusCounts;
  reportReasonCounts: ModeratorReportReasonCounts;
  last7Days: ModeratorLast7DaysItem[];
}

export type ModeratorPostStatus = 'PENDING_REVIEW' | 'PUBLISH' | 'REJECT';

export interface ModeratorPostAuthor {
  id: number;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface ModeratorPostLanguage {
  id: number;
  code: string;
  name: string;
  flag?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ModeratorPostReviewedBy {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

export interface ModeratorPostMedia {
  id: number;
  postId: number;
  mediaType: string;
  mediaUrl: string;
  publicId: string;
  createdAt: string;
}

export interface ModeratorPostCategory {
  id: number;
  name: string;
  categoryGroupId?: number;
  languageId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  language?: ModeratorPostLanguage;
  categoryGroup?: {
    id: number;
    code: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
}

export interface ModeratorPostTag {
  id: number;
  name: string;
}

export interface ModeratorPostTranslationSummary {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  status: ModeratorPostStatus;
  parentPostId?: number | null;
  languageId: number;

  language: {
    id: number;
    code: string;
    name: string;
    flag?: string | null;
  };
}
export interface ModeratorPostItem {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  content: string;
  status: ModeratorPostStatus;
  viewCount: number;
  publishedAt?: string | null;
  parentPostId?: number | null;
  authorId: number;
  languageId: number;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  author: ModeratorPostAuthor;
  language: ModeratorPostLanguage;
  reviewedBy?: ModeratorPostReviewedBy | null;
  media: ModeratorPostMedia[];
  categories: ModeratorPostCategory[];
  tags: ModeratorPostTag[];
  translations?: ModeratorPostTranslationSummary[];
}

export interface ModeratorPaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface GetModeratorPostsQuery {
  status?: ModeratorPostStatus;
  search?: string;
  categoryId?: number;
  languageId?: number;
  authorId?: number;
  tagId?: number;
  tagName?: string;
  page?: number;
  limit?: number;
  lang?: string;
  sortBy?: string;
  sortOrder?: string;
  order?: string;
}

export interface ModeratorPostsPaginatedResponse {
  items: ModeratorPostItem[];
  meta: ModeratorPaginationMeta;
}

export interface RejectModeratorPostDto {
  rejectionReason: string;
}

// --- Moderator Reports (M06 - M09) ---

export type ModeratorReportTargetType = 'POST' | 'COMMENT';
export type ModeratorReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export type ModeratorReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE'
  | 'COPYRIGHT'
  | 'MISINFORMATION'
  | 'OTHER';

export interface ModeratorReportUser {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

export interface ModeratorReportPost {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  content: string;
  status: string;
  authorId: number;
  publishedAt?: string | null;
  createdAt: string;
  author: ModeratorReportUser;
}

export interface ModeratorReportCommentParent {
  id: number;
  postId: number;
  userId: number;
  parentId?: number | null;
  content: string;
  createdAt: string;
  user: ModeratorReportUser;
  replies?: ModeratorReportCommentReply[];
}

export interface ModeratorReportCommentReply {
  id: number;
  postId: number;
  userId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  user: ModeratorReportUser;
}

export interface ModeratorReportComment {
  id: number;
  postId: number;
  userId: number;
  parentId?: number | null;
  content: string;
  createdAt: string;
  user: ModeratorReportUser;
  post?: ModeratorReportPost | null;
  parent?: ModeratorReportCommentParent | null;
  replies?: ModeratorReportCommentReply[];
}

export interface ModeratorReportItem {
  id: number;
  reporterId: number;
  targetType: ModeratorReportTargetType;
  postId?: number | null;
  commentId?: number | null;
  reason: ModeratorReportReason;
  description?: string | null;
  status: ModeratorReportStatus;
  reviewedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: ModeratorReportUser;
  reviewedBy?: ModeratorReportUser | null;
  post?: ModeratorReportPost | null;
  comment?: ModeratorReportComment | null;
}

export interface GetModeratorReportsQuery {
  targetType?: ModeratorReportTargetType;
  status?: ModeratorReportStatus;
  reason?: ModeratorReportReason;
  reporterId?: number;
  postId?: number;
  commentId?: number;
  page?: number;
  limit?: number;
}

export interface ModeratorReportsPaginatedResponse {
  items: ModeratorReportItem[];
  meta: ModeratorPaginationMeta;
}

export interface ResolveModeratorReportDto {
  resolutionNote: string;
}

export interface RejectModeratorReportDto {
  resolutionNote: string;
}

// --- Moderator Category Groups ---

export interface ModeratorCategoryLanguage {
  id: number;
  code: string;
  name: string;
  flag?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModeratorCategoryTranslation {
  id: number;
  name: string;
  languageId: number;
  createdAt: string;
  updatedAt: string;
  language?: ModeratorCategoryLanguage;
}

export interface ModeratorCategoryGroup {
  id: number;
  code: string;
  createdAt: string;
  updatedAt: string;

  translationCount: number;

  translations: ModeratorCategoryTranslation[];
}

export interface GetModeratorCategoryGroupsQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ModeratorCategoryGroupsPaginatedResponse {
  items: ModeratorCategoryGroup[];
  meta: ModeratorPaginationMeta;
}

export interface ModeratorCategoryTranslationRequest {
  languageId: number;
  name: string;
}

export interface CreateModeratorCategoryGroupDto {
  code: string;
  translations: ModeratorCategoryTranslationRequest[];
}

export interface UpdateModeratorCategoryGroupDto {
  code?: string;
  translations?: ModeratorCategoryTranslationRequest[];
}
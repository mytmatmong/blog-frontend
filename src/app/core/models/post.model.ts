export type PostStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISH'
  | 'REJECT';

export type MediaType = 'IMAGE' | 'VIDEO';

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ======================================================
// LANGUAGE
// ======================================================

export interface PublicLanguage {
  id: number;
  code: string;
  name: string;
  flag: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ======================================================
// CATEGORY
// ======================================================

export interface CategoryGroup {
  id: number;
  code: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CategoryItem {
  id: number;
  name: string;
  categoryGroupId: number;
  languageId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  language?: PublicLanguage;
  categoryGroup?: CategoryGroup;
}

export interface GetCategoriesQueryParams {
  search?: string;
  languageId?: number;
  lang?: string;
  page?: number;
  limit?: number;
}

export type PaginatedCategoriesResponse =
  PaginatedResponse<CategoryItem>;

// ======================================================
// AUTHOR
// ======================================================

export interface PublicAuthorSummary {
  id: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface TopAuthor {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
}

export interface AuthorDetail {
  id: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postCount: number;
}

export interface AuthorInfoResponse {
  author: AuthorDetail;
  posts: PaginatedPostsResponse;
}

// ======================================================
// TAG
// ======================================================

export interface PostTagSummary {
  id: number;
  name: string;
}

export interface TagItem {
  id: number;
  name: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface TopTagItem {
  id: number;
  name: string;
  postCount: number;
  tagScore: number;
}

export interface GetTagsQueryParams {
  search?: string;

  /**
   * Backend nhận field này nhưng P13 hiện chưa dùng để lọc.
   */
  lang?: string;

  page?: number;
  limit?: number;
}

export type PaginatedTagsResponse =
  PaginatedResponse<TagItem>;

// ======================================================
// MEDIA
// ======================================================

export interface PostMediaSummary {
  id: number;
  postId: number;
  mediaType: MediaType;
  mediaUrl: string;
  createdAt: string;
}

// ======================================================
// POST
// ======================================================

export interface PublicPost {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  content: string;
  status: PostStatus;
  viewCount: number;
  publishedAt: string | null;
  parentPostId: number | null;
  authorId: number;
  languageId: number;
  createdAt: string;
  updatedAt: string;

  author: PublicAuthorSummary;
  language: PublicLanguage;
  categories: CategoryItem[];
  tags: PostTagSummary[];
  likeCount: number;
  media: PostMediaSummary[];
}

export interface GetPostsQueryParams {
  search?: string;
  categoryId?: number;
  languageId?: number;
  lang?: string;
  authorId?: number;
  parentPostId?: number;

  /**
   * Public service backend luôn ép thành PUBLISH.
   */
  status?: PostStatus;

  tagId?: number;
  tagName?: string;
  bookmarkedByUserId?: number;
  page?: number;
  limit?: number;
}

export type PaginatedPostsResponse =
  PaginatedResponse<PublicPost>;

// ======================================================
// COMMENT
// ======================================================

export interface CommentUser {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface CommentReply {
  id: number;
  postId: number;
  userId: number;
  parentId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
}

export interface PublicComment {
  id: number;
  postId: number;
  userId: number;
  parentId: null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  replies: CommentReply[];
}

export type PaginatedCommentsResponse =
  PaginatedResponse<PublicComment>;
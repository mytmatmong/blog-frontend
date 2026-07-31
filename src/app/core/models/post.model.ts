export interface PublicAuthorSummary {
  id: number;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface PostCategorySummary {
  id: number;
  name: string;
  slug?: string;
}

export interface PostTagSummary {
  id: number;
  name: string;
}

export interface PostMediaSummary {
  id: number;
  postId: number;
  mediaType: string;
  mediaUrl: string;
  createdAt: string;
}

export interface PublicPost {
  id: number;
  title: string;
  slug?: string;
  summary?: string | null;
  content: string;
  status: string;
  viewCount: number;
  likeCount: number;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  author: PublicAuthorSummary;
  categories?: PostCategorySummary[];
  tags?: PostTagSummary[];
  media?: PostMediaSummary[];
}

export interface GetPostsQueryParams {
  search?: string;
  categoryId?: number;
  languageId?: number;
  authorId?: number;
  tagId?: number;
  tagName?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPostsResponse {
  items: PublicPost[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface TopAuthor {
  id: number;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  followerCount: number;
}

export interface AuthorDetail {
  id: number;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  postCount: number;
}

export interface AuthorInfoResponse {
  author: AuthorDetail;
  posts: PaginatedPostsResponse;
}

// CATEGORY MODELS
export interface CategoryItem {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  languageId?: number;
  categoryGroupId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetCategoriesQueryParams {
  search?: string;
  categoryGroupId?: number;
  languageId?: number;
  lang?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCategoriesResponse {
  items: CategoryItem[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// COMMENT MODELS
export interface CommentUser {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

export interface CommentReply {
  id: number;
  postId: number;
  userId: number;
  parentId?: number | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: CommentUser;
}

export interface PublicComment {
  id: number;
  postId: number;
  userId: number;
  parentId?: number | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: CommentUser;
  replies?: CommentReply[];
}

export interface PaginatedCommentsResponse {
  items: PublicComment[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// TAG MODELS
export interface TagItem {
  id: number;
  name: string;
  postCount?: number;
  createdAt?: string;
}

export interface TopTagItem {
  id: number;
  name: string;
  postCount: number;
  tagScore?: number;
}

export interface GetTagsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTagsResponse {
  items: TagItem[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

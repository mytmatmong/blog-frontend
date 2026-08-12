import {
  PaginatedResponse,
  PostStatus,
} from './post.model';

export interface BlogOwnerLanguage {
  id: number;
  code: string;
  name: string;
  flag: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface BlogOwnerCategoryGroup {
  id: number;
  code: string;
}

export interface BlogOwnerCategory {
  id: number;
  name: string;
  languageId: number;
  categoryGroupId: number;
  language?: BlogOwnerLanguage;
  categoryGroup?: BlogOwnerCategoryGroup;
}

export interface BlogOwnerTag {
  id: number;
  name: string;
}

export interface BlogOwnerOptions {
  languages: BlogOwnerLanguage[];
  categories: BlogOwnerCategory[];
  tags: BlogOwnerTag[];
}

export interface BlogOwnerMedia {
  id: number;
  postId: number;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  publicId?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface BlogOwnerAuthor {
  id: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface BlogOwnerTranslationSummary {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  status: PostStatus;
  parentPostId: number | null;
  languageId: number;
  language: Pick<BlogOwnerLanguage, 'id' | 'code' | 'name' | 'flag'>;
}

export interface BlogOwnerPost {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  content: string;
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  parentPostId: number | null;
  authorId: number;
  languageId: number;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  author?: BlogOwnerAuthor;
  language?: BlogOwnerLanguage;
  categories: BlogOwnerCategory[];
  tags: BlogOwnerTag[];
  media: BlogOwnerMedia[];
  translations?: BlogOwnerTranslationSummary[];
}

export interface BlogOwnerPostsQuery {
  search?: string;
  categoryId?: number;
  languageId?: number;
  parentPostId?: number;
  status?: PostStatus;
  tagId?: number;
  tagName?: string;
  page?: number;
  limit?: number;
}

export type BlogOwnerPostsPage = PaginatedResponse<BlogOwnerPost>;

export interface BlogOwnerDashboardPost {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  status: PostStatus;
  views: number;
  likes: number;
  language: Pick<BlogOwnerLanguage, 'id' | 'code' | 'name' | 'flag'>;
}

export interface BlogOwnerDashboardData {
  postCounts: {
    total: number;
    draft: number;
    pendingReview: number;
    published: number;
    rejected: number;
  };
  totals: {
    views: number;
    likes: number;
    comments: number;
  };
  last7Days: Array<{
    date: string;
    views: number;
    likes: number;
  }>;
  featuredPosts: {
    byViews: BlogOwnerDashboardPost[];
    byLikes: BlogOwnerDashboardPost[];
  };
}

export interface CreateBlogOwnerPostRequest {
  title: string;
  content: string;
  languageId: number;
  categoryIds: number[];
  tagIds?: number[];
  tagNames?: string[];
  thumbnailUrl?: string;
  submitForReview?: boolean;
}

export interface UpdateBlogOwnerPostRequest {
  title?: string;
  content?: string;
  languageId?: number;
  categoryIds?: number[];
  tagIds?: number[];
  tagNames?: string[];
  thumbnailUrl?: string | null;
}

export interface TranslationPreviewRequest {
  targetLanguageId: number;
}

export interface TranslationPreviewResponse {
  sourcePost: {
    id: number;
    rootPostId: number;
    title: string;
    content: string;
    thumbnailUrl: string | null;
    language: Pick<BlogOwnerLanguage, 'id' | 'code' | 'name' | 'flag'>;
  };
  translation: {
    language: Pick<BlogOwnerLanguage, 'id' | 'code' | 'name' | 'flag'>;
    title: string;
    content: string;
  };
}

export interface CreateTranslationRequest {
  targetLanguageId: number;
  title: string;
  content: string;
  thumbnailUrl?: string;
}

// import { PostStatus } from './post.model';

// export interface BlogOwnerLanguage {
//   id: number;
//   code: string;
//   name: string;
//   flag: string | null;
//   isDefault: boolean;
//   isActive: boolean;
// }

// export interface BlogOwnerCategoryGroup {
//   id: number;
//   code: string;
// }

// export interface BlogOwnerCategory {
//   id: number;
//   name: string;
//   languageId: number;
//   categoryGroupId: number;
//   language?: BlogOwnerLanguage;
//   categoryGroup?: BlogOwnerCategoryGroup;
// }

// export interface BlogOwnerTag {
//   id: number;
//   name: string;
// }

// export interface BlogOwnerOptions {
//   languages: BlogOwnerLanguage[];
//   categories: BlogOwnerCategory[];
//   tags: BlogOwnerTag[];
// }

// export interface BlogOwnerMedia {
//   id: number;
//   postId: number;
//   mediaType: 'IMAGE' | 'VIDEO';
//   mediaUrl: string;
//   publicId?: string;
//   createdAt: string;
//   deletedAt?: string | null;
// }

// export interface BlogOwnerTranslationSummary {
//   id: number;
//   title: string;
//   thumbnailUrl: string | null;
//   status: PostStatus;
//   parentPostId: number | null;
//   languageId: number;
//   language: Pick<BlogOwnerLanguage, 'id' | 'code' | 'name' | 'flag'>;
// }

// export interface BlogOwnerPost {
//   id: number;
//   title: string;
//   thumbnailUrl: string | null;
//   content: string;
//   status: PostStatus;
//   viewCount: number;
//   publishedAt: string | null;
//   parentPostId: number | null;
//   authorId: number;
//   languageId: number;
//   reviewedAt: string | null;
//   rejectionReason: string | null;
//   createdAt: string;
//   updatedAt: string;
//   categories: BlogOwnerCategory[];
//   tags: BlogOwnerTag[];
//   media: BlogOwnerMedia[];
//   translations?: BlogOwnerTranslationSummary[];
// }

// export interface CreateBlogOwnerPostRequest {
//   title: string;
//   content: string;
//   languageId: number;
//   categoryIds: number[];
//   tagIds?: number[];
//   tagNames?: string[];
//   thumbnailUrl?: string;
//   submitForReview?: boolean;
// }

// export interface TranslationPreviewRequest {
//   targetLanguageId: number;
// }

// export interface TranslationPreviewResponse {
//   sourcePost: {
//     id: number;
//     rootPostId: number;
//     title: string;
//     content: string;
//     thumbnailUrl: string | null;
//     language: Pick<BlogOwnerLanguage, 'id' | 'code' | 'name' | 'flag'>;
//   };
//   translation: {
//     language: Pick<BlogOwnerLanguage, 'id' | 'code' | 'name' | 'flag'>;
//     title: string;
//     content: string;
//   };
// }

// export interface CreateTranslationRequest {
//   targetLanguageId: number;
//   title: string;
//   content: string;
//   thumbnailUrl?: string;
// }

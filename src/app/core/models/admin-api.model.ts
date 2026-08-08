export interface AdminDashboardStats {
  totalUsers: number;
  totalBlogOwners: number;
  totalLanguages: number;
  pendingRequests: number;
}

export interface AdminDashboardUserGrowthDetail {
  date: string;
  label: string;
  count: number;
}

export interface AdminDashboardUserGrowth {
  labels: string[];
  data: number[];
  details: AdminDashboardUserGrowthDetail[];
}

export interface AdminDashboardPostByLanguageDetail {
  id: number;
  name: string;
  code: string;
  flag: string | null;
  postCount: number;
  percentage: number;
}

export interface AdminDashboardPostsByLanguage {
  labels: string[];
  data: number[];
  details: AdminDashboardPostByLanguageDetail[];
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  userGrowth: AdminDashboardUserGrowth;
  postsByLanguage: AdminDashboardPostsByLanguage;
}

export interface AdminLanguage {
  id: number;
  code: string;
  name: string;
  flag: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminLanguageRequest {
  code: string;
  name: string;
  flag?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateAdminLanguageRequest {
  code?: string;
  name?: string;
  flag?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export type BlogOwnerRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminBlogOwnerRequestItem {
  id: number;
  userId: number;
  reason: string;
  topics: string;
  status: BlogOwnerRequestStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedById: number | null;
}

export interface AdminPaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface AdminPaginatedResponse<T> {
  items: T[];
  meta: AdminPaginationMeta;
}

export interface GetBlogOwnerRequestsQuery {
  userId?: number;
  status?: BlogOwnerRequestStatus;
  page?: number;
  limit?: number;
}

export interface ReviewBlogOwnerRequestDto {
  status: BlogOwnerRequestStatus;
  rejectionReason?: string;
}

export type UserRole = 'NORMAL_USER' | 'BLOG_OWNER' | 'CONTENT_MODERATOR' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface AdminUserItem {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  bio: string | null;
  avatarUrl: string | null;
  lockedAt: string | null;
  lockedById: number | null;
  lockReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface GetAdminUsersQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface CreateModeratorRequest {
  username: string;
  email: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
}

export interface AdminUserPostCategory {
  id: number;
  name: string;
  categoryGroupId: number;
  languageId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminUserPostTag {
  id: number;
  name: string;
}

export interface AdminUserPostItem {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  content: string;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  parentPostId: number | null;
  authorId: number;
  languageId: number;
  reviewedById: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  likeCount: number;
  commentCount: number;
  categories: AdminUserPostCategory[];
  tags: AdminUserPostTag[];
}

export interface AdminUserDetail extends AdminUserItem {
  posts: AdminUserPostItem[];
}

export interface UpdateAdminUserDto {
  password?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface LockUserDto {
  reason: string;
}

export interface ChangeUserRoleDto {
  role: UserRole;
}












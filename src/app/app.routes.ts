import { Routes } from '@angular/router';

import { PublicLayout } from './layouts/public-layout/public-layout';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';

import { Home } from './pages/public/home/home';
import { Auth } from './pages/public/auth/auth';
import { PostDetail } from './pages/public/post-detail/post-detail';
import { Category } from './pages/public/category/category';
import { Hashtag } from './pages/public/hashtag/hashtag';
import { AuthorDetailComponent } from './pages/public/author-detail/author-detail';

import { Profile } from './pages/account/profile/profile';
import { RequestBlogOwner } from './pages/account/request-blog-owner/request-blog-owner';
import { AccountLibrary } from './pages/account/library/library';
import { AccountConnections } from './pages/account/connections/connections';

import { DashboardAuth } from './pages/dashboard/dashboard-auth/dashboard-auth';

import { OwnerDashboard } from './pages/dashboard/owner/owner-dashboard/owner-dashboard';
import { Posts } from './pages/dashboard/owner/posts/posts';
import { CreatePost } from './pages/dashboard/owner/create-post/create-post';
import { EditPost } from './pages/dashboard/owner/edit-post/edit-post';

import { ModeratorDashboard } from './pages/dashboard/moderator/moderator-dashboard/moderator-dashboard';
import { ManageBlogs } from './pages/dashboard/moderator/manage-blogs/manage-blogs';
import { ManageCategories } from './pages/dashboard/moderator/manage-categories/manage-categories';
import { ManageComments } from './pages/dashboard/moderator/manage-comments/manage-comments';

import { AdminDashboard } from './pages/dashboard/admin/admin-dashboard/admin-dashboard';
import { ManageUsers } from './pages/dashboard/admin/manage-users/manage-users';
import { ManageLanguages } from './pages/dashboard/admin/manage-languages/manage-languages';

import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Public Routes (Dùng PublicLayout)
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      { path: 'auth', component: Auth },
      { path: 'post/:id', component: PostDetail },
      { path: 'author/:id', component: AuthorDetailComponent },
      { path: 'category', component: Category },
      { path: 'hashtag', component: Hashtag },
      { path: 'account/profile', component: Profile, canActivate: [roleGuard('user')] },
      { path: 'account/request-blog-owner', component: RequestBlogOwner, canActivate: [roleGuard('user')] },
      { path: 'account/library', component: AccountLibrary, canActivate: [roleGuard('user')] },
      { path: 'account/connections', component: AccountConnections, canActivate: [roleGuard('user')] },
    ],
  },
  // Standalone Auth for Dashboard
  { path: 'dashboard/auth', component: DashboardAuth },

  // Dashboard Routes (Dùng DashboardLayout)
  {
    path: 'dashboard',
    component: DashboardLayout,
    children: [
      // Owner
      {
        path: 'owner',
        canActivate: [roleGuard('owner')],
        children: [
          { path: '', component: OwnerDashboard },
          { path: 'posts', component: Posts },
          { path: 'create-post', component: CreatePost },
          { path: 'edit-post', component: EditPost },
        ]
      },

      // Moderator
      {
        path: 'moderator',
        canActivate: [roleGuard('moderator')],
        children: [
          { path: '', component: ModeratorDashboard },
          { path: 'manage-blogs', component: ManageBlogs },
          { path: 'manage-categories', component: ManageCategories },
          { path: 'manage-comments', component: ManageComments },
        ]
      },

      // Admin
      {
        path: 'admin',
        canActivate: [roleGuard('admin')],
        children: [
          { path: '', component: AdminDashboard },
          { path: 'manage-users', component: ManageUsers },
          { path: 'manage-languages', component: ManageLanguages },
        ]
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

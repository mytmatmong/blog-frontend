import { Injectable, signal } from '@angular/core';

export type SupportedLang = 'VI' | 'EN';

export interface LanguageOption {
  code: SupportedLang;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  currentLang = signal<SupportedLang>('VI');

  readonly languages: LanguageOption[] = [
    { code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'EN', name: 'English', flag: '🇬🇧' },
  ];

  private translations: Record<SupportedLang, Record<string, string>> = {
    VI: {
      // Header & Nav
      'nav.posts': 'Bài viết',
      'nav.categories': 'Danh mục',
      'nav.hashtags': 'Hashtag',
      'nav.login': 'Đăng nhập',
      'nav.logout': 'Đăng xuất demo',
      'nav.profile': 'Trang cá nhân',
      'nav.request_owner': 'Yêu cầu Blog Owner',
      'nav.owner_dashboard': 'Owner Dashboard',
      'nav.moderator_dashboard': 'Moderator Dashboard',
      'nav.admin_dashboard': 'Admin Dashboard',
      'nav.toggle_theme': 'Chuyển chế độ Sáng/Tối',
      'header.demo_role': 'Demo trạng thái header:',

      // Sidebar Filter & Search
      'sidebar.filter_title': 'Bộ lọc bài viết',
      'sidebar.search_title': 'Công cụ tìm kiếm',
      'filter.latest': 'Mới nhất',
      'filter.most_viewed': 'Nhiều lượt xem nhất',
      'filter.most_liked': 'Nhiều lượt thích nhất',
      'filter.most_commented': 'Nhiều bình luận nhất',
      'search.placeholder_posts': 'Tìm bài viết...',
      'search.placeholder_categories': 'Tìm danh mục...',
      'search.placeholder_hashtags': 'Tìm hashtag...',

      // Sidebar Right
      'sidebar.top_authors': 'Tác giả hàng đầu',
      'sidebar.trending_posts': 'Bài viết nổi bật',
      'sidebar.popular_tags': 'Thẻ phổ biến',
      'author.followers': 'người theo dõi',

      // Pages
      'home.title': 'Bài viết',
      'home.subtitle': 'Cập nhật kiến thức lập trình mỗi ngày',
      'category.title': 'Danh mục bài viết',
      'category.subtitle': 'Khám phá các bài viết theo chuyên mục lập trình bạn quan tâm.',
      'hashtag.title': '#Hashtag bài viết',
      'hashtag.subtitle': 'Tìm kiếm các bài viết nổi bật được đánh tag tương ứng.',
      'category.all': 'Tất cả',

      // Post Card & Detail
      'post.read_time': 'phút đọc',
      'post.like': 'Thích',
      'post.save': 'Lưu',

      // Comments
      'comments.title': 'Bình luận',
      'comments.placeholder': 'Viết bình luận...',
      'comments.submit': 'Gửi bình luận',
      'comments.reply': 'Trả lời',
      'comments.edit': 'Sửa',
      'comments.delete': 'Xóa',

      // Auth
      'auth.login_tab': 'Đăng nhập',
      'auth.register_tab': 'Đăng ký',
      'auth.forgot_tab': 'Khôi phục',
      'auth.reset_tab': 'Đặt lại mật khẩu',
      'auth.login_title': 'Đăng nhập',
      'auth.register_title': 'Đăng ký tài khoản',
      'auth.forgot_title': 'Khôi phục mật khẩu',
      'auth.reset_title': 'Đặt lại mật khẩu mới',
      'auth.email_placeholder': 'Nhập địa chỉ email hoặc tên người dùng...',
      'auth.password_placeholder': 'Nhập mật khẩu...',
      'auth.username_placeholder': 'Tên người dùng (Username)...',
      'auth.token_placeholder': 'Nhập mã khôi phục (Reset Token)...',
      'auth.new_password_placeholder': 'Nhập mật khẩu mới (tối thiểu 6 ký tự)...',
      'auth.submit_login': 'Đăng nhập',
      'auth.submit_register': 'Tạo tài khoản',
      'auth.submit_forgot': 'Gửi link khôi phục',
      'auth.submit_reset': 'Xác nhận đổi mật khẩu',

      // Pagination
      'pagination.prev': 'Trước',
      'pagination.next': 'Sau',

      // Footer
      'footer.copyright': '© 2026 DevBlog UI Prototype',
      'footer.inspired_by': 'Inspired by Viblo layout',

      // Request Blog Owner
      'request_owner.title': 'Yêu cầu trở thành Blog Owner',
      'request_owner.subtitle': 'Hãy cung cấp lý do và thông tin giới thiệu bản thân để Moderator kiểm duyệt quyền viết bài.',
      'request_owner.reason_label': 'Lý do muốn đăng ký',
      'request_owner.reason_placeholder': 'Chia sẻ trải nghiệm và chủ đề bài viết bạn muốn chia sẻ...',
      'request_owner.submit_btn': 'Gửi yêu cầu kiểm duyệt',

      // Dashboard Common & Sidebar
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Bảng điều khiển & Thống kê hệ thống',
      'dashboard.my_posts': 'Bài viết của tôi',
      'dashboard.create_post': 'Tạo bài viết',
      'dashboard.mod_dashboard': 'Mod Dashboard',
      'dashboard.approve_posts': 'Duyệt bài viết',
      'dashboard.categories': 'Danh mục',
      'dashboard.comments': 'Bình luận',
      'dashboard.manage_users': 'Quản lý người dùng',
      'dashboard.manage_languages': 'Quản lý ngôn ngữ',
      'dashboard.back_public': 'Về trang public',
      'dashboard.logout': 'Đăng xuất',

      // Post Form (Create / Edit Post)
      'post_form.create_title': 'Tạo bài viết mới',
      'post_form.edit_title': 'Sửa bài viết',
      'post_form.original_lang': 'Ngôn ngữ gốc:',
      'post_form.original_badge': 'Gốc',
      'post_form.translated_badge': 'Dịch',
      'post_form.title_label': 'Tiêu đề bài viết',
      'post_form.title_placeholder': 'Nhập tiêu đề...',
      'post_form.category_label': 'Danh mục',
      'post_form.category_hint': 'Tích chọn các danh mục phù hợp',
      'post_form.hashtags_label': 'Hashtags',
      'post_form.hashtags_placeholder': '#tag1 #tag2',
      'post_form.thumbnail_label': 'Ảnh bìa (Thumbnail)',
      'post_form.thumbnail_current': 'Ảnh bìa hiện tại',
      'post_form.using': 'Đang dùng:',
      'post_form.no_video': 'Chưa có video đính kèm',
      'post_form.thumbnail_hint': 'Hỗ trợ JPG, PNG, GIF...',
      'post_form.thumbnail_edit_hint': 'Chọn ảnh mới để thay thế ảnh cũ',
      'post_form.video_label': 'Video đính kèm (Tùy chọn)',
      'post_form.video_current': 'Video đính kèm hiện tại',
      'post_form.video_hint': 'Hỗ trợ MP4, WebM (Tối đa 50MB)',
      'post_form.video_edit_hint': 'Chọn video mới để cập nhật',
      'post_form.content_label': 'Nội dung bài viết',
      'post_form.editor_placeholder': 'Bắt đầu viết nội dung tuyệt vời của bạn tại đây...',
      'post_form.publish_btn': 'Xuất bản',
      'post_form.draft_btn': 'Lưu nháp',
      'post_form.update_btn': 'Cập nhật',
      'post_form.cancel_changes_btn': 'Hủy thay đổi',
      'lang.vietnamese': 'Tiếng Việt',
      'lang.english': 'Tiếng Anh',

      // Dashboard Pages & Quick Actions
      'dashboard.owner_title': 'Bảng điều khiển Blog Owner',
      'dashboard.owner_desc': 'Theo dõi lượt xem, bài viết và tương tác của độc giả.',
      'dashboard.total_posts': 'Tổng bài viết',
      'dashboard.total_views': 'Tổng lượt xem',
      'dashboard.total_likes': 'Tổng lượt thích',
      'dashboard.total_comments': 'Tổng bình luận',
      'dashboard.post_list': 'Danh sách bài viết',
      'dashboard.create_new_post': 'Viết bài mới',
      'dashboard.edit_post': 'Chỉnh sửa bài viết',
      'dashboard.mod_title': 'Bảng điều khiển Moderator',
      'dashboard.mod_desc': 'Kiểm duyệt bài viết, bình luận và danh mục của hệ thống.',
      'dashboard.admin_title': 'Bảng điều khiển Super Admin',
      'dashboard.admin_desc': 'Quản lý toàn bộ người dùng, cài đặt hệ thống và ngôn ngữ.',
      'dashboard.quick_actions': 'Thao tác nhanh',
      'dashboard.featured_posts': 'Bài viết nổi bật',
      'dashboard.interaction_chart': 'Tương tác bài viết (7 ngày qua)',
      'dashboard.share_blog': 'Chia sẻ trang Blog',
      'dashboard.view_history': 'Xem lịch sử',

      // Table Column Headers
      'table.post_title': 'Bài viết',
      'table.author': 'Tác giả',
      'table.category': 'Danh mục',
      'table.created_at': 'Ngày tạo',
      'table.status': 'Trạng thái',
      'table.views': 'Lượt xem',
      'table.likes': 'Lượt thích',
      'table.actions': 'Thao tác',
      'table.user_name': 'Người dùng',
      'table.email': 'Email',
      'table.role': 'Vai trò',
      'table.comment_content': 'Nội dung bình luận',
      'table.reason': 'Lý do báo cáo',
      'table.lang_code': 'Mã ngôn ngữ',
      'table.lang_name': 'Tên ngôn ngữ',
      'table.is_default': 'Mặc định',

      // Modals & Popups
      'modal.close': 'Đóng',
      'modal.cancel': 'Hủy',
      'modal.confirm': 'Xác nhận',
      'modal.save': 'Lưu',
      'modal.delete': 'Xóa',
      'modal.copy': 'Copy',
      'modal.copied': 'Đã copy',
      'modal.share_title': 'Chia sẻ Blog của bạn',
      'modal.share_desc': 'Sao chép đường dẫn bên dưới để chia sẻ trang Blog của bạn với mọi người:',
      'modal.preview_title': 'Xem trước bài viết',
      'modal.reject_title': 'Từ chối bài viết',
      'modal.reject_placeholder': 'Nhập lý do từ chối để thông báo cho tác giả...',
      'modal.add_category_title': 'Thêm danh mục mới',
      'modal.category_name': 'Tên danh mục',
      'modal.category_slug': 'Đường dẫn (Slug)',
      'modal.add_user_title': 'Thêm người dùng mới',
      'modal.add_lang_title': 'Thêm ngôn ngữ hệ thống',
      'modal.delete_confirm': 'Bạn có chắc chắn muốn xóa bản ghi này không?',
    },
    EN: {
      // Header & Nav
      'nav.posts': 'Posts',
      'nav.categories': 'Categories',
      'nav.hashtags': 'Hashtags',
      'nav.login': 'Log In',
      'nav.logout': 'Log Out Demo',
      'nav.profile': 'Profile',
      'nav.request_owner': 'Request Blog Owner',
      'nav.owner_dashboard': 'Owner Dashboard',
      'nav.moderator_dashboard': 'Moderator Dashboard',
      'nav.admin_dashboard': 'Admin Dashboard',
      'nav.toggle_theme': 'Toggle Theme',
      'header.demo_role': 'Header Role Demo:',

      // Sidebar Filter & Search
      'sidebar.filter_title': 'Post Filter',
      'sidebar.search_title': 'Search Tool',
      'filter.latest': 'Latest',
      'filter.most_viewed': 'Most Viewed',
      'filter.most_liked': 'Most Liked',
      'filter.most_commented': 'Most Commented',
      'search.placeholder_posts': 'Search posts...',
      'search.placeholder_categories': 'Search categories...',
      'search.placeholder_hashtags': 'Search hashtags...',

      // Sidebar Right
      'sidebar.top_authors': 'Top Authors',
      'sidebar.trending_posts': 'Trending Posts',
      'sidebar.popular_tags': 'Popular Tags',
      'author.followers': 'followers',

      // Pages
      'home.title': 'Posts',
      'home.subtitle': 'Daily programming insights and updates',
      'category.title': 'Article Categories',
      'category.subtitle': 'Explore articles by programming categories you care about.',
      'hashtag.title': '#Article Hashtags',
      'hashtag.subtitle': 'Find featured articles tagged accordingly.',
      'category.all': 'All',

      // Post Card & Detail
      'post.read_time': 'min read',
      'post.like': 'Like',
      'post.save': 'Save',

      // Comments
      'comments.title': 'Comments',
      'comments.placeholder': 'Write a comment...',
      'comments.submit': 'Submit Comment',
      'comments.reply': 'Reply',
      'comments.edit': 'Edit',
      'comments.delete': 'Delete',

      // Auth
      'auth.login_tab': 'Log In',
      'auth.register_tab': 'Register',
      'auth.forgot_tab': 'Forgot Password',
      'auth.reset_tab': 'Reset Password',
      'auth.login_title': 'Log In',
      'auth.register_title': 'Register Account',
      'auth.forgot_title': 'Reset Password',
      'auth.reset_title': 'Set New Password',
      'auth.email_placeholder': 'Enter email address or username...',
      'auth.password_placeholder': 'Enter password...',
      'auth.username_placeholder': 'Username...',
      'auth.token_placeholder': 'Enter reset token...',
      'auth.new_password_placeholder': 'Enter new password (min 6 chars)...',
      'auth.submit_login': 'Log In',
      'auth.submit_register': 'Create Account',
      'auth.submit_forgot': 'Send Reset Link',
      'auth.submit_reset': 'Submit Reset Password',

      // Pagination
      'pagination.prev': 'Previous',
      'pagination.next': 'Next',

      // Footer
      'footer.copyright': '© 2026 DevBlog UI Prototype',
      'footer.inspired_by': 'Inspired by Viblo layout',

      // Request Blog Owner
      'request_owner.title': 'Request Blog Owner Access',
      'request_owner.subtitle': 'Please provide your reason and intro for Moderator review.',
      'request_owner.reason_label': 'Reason for Application',
      'request_owner.reason_placeholder': 'Share your experience and topics you want to write about...',
      'request_owner.submit_btn': 'Submit Request',

      // Dashboard Common & Sidebar
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Control panel & system stats',
      'dashboard.my_posts': 'My Posts',
      'dashboard.create_post': 'Create Post',
      'dashboard.mod_dashboard': 'Mod Dashboard',
      'dashboard.approve_posts': 'Approve Posts',
      'dashboard.categories': 'Categories',
      'dashboard.comments': 'Comments',
      'dashboard.manage_users': 'Manage Users',
      'dashboard.manage_languages': 'Manage Languages',
      'dashboard.back_public': 'Back to Public',
      'dashboard.logout': 'Log Out',

      // Post Form (Create / Edit Post)
      'post_form.create_title': 'Create New Article',
      'post_form.edit_title': 'Edit Article',
      'post_form.original_lang': 'Original Language:',
      'post_form.original_badge': 'Original',
      'post_form.translated_badge': 'Translation',
      'post_form.title_label': 'Article Title',
      'post_form.title_placeholder': 'Enter title...',
      'post_form.category_label': 'Categories',
      'post_form.category_hint': 'Select relevant categories',
      'post_form.hashtags_label': 'Hashtags',
      'post_form.hashtags_placeholder': '#tag1 #tag2',
      'post_form.thumbnail_label': 'Cover Image (Thumbnail)',
      'post_form.thumbnail_current': 'Current Cover Image',
      'post_form.using': 'Currently using:',
      'post_form.no_video': 'No video attached',
      'post_form.thumbnail_hint': 'Supports JPG, PNG, GIF...',
      'post_form.thumbnail_edit_hint': 'Select a new image to replace the existing one',
      'post_form.video_label': 'Attached Video (Optional)',
      'post_form.video_current': 'Current Attached Video',
      'post_form.video_hint': 'Supports MP4, WebM (Max 50MB)',
      'post_form.video_edit_hint': 'Select a new video to update',
      'post_form.content_label': 'Article Content',
      'post_form.editor_placeholder': 'Start writing your awesome content here...',
      'post_form.publish_btn': 'Publish',
      'post_form.draft_btn': 'Save Draft',
      'post_form.update_btn': 'Update',
      'post_form.cancel_changes_btn': 'Cancel Changes',
      'lang.vietnamese': 'Vietnamese',
      'lang.english': 'English',

      // Dashboard Pages & Quick Actions
      'dashboard.owner_title': 'Blog Owner Dashboard',
      'dashboard.owner_desc': 'Track views, posts, and reader engagement.',
      'dashboard.total_posts': 'Total Posts',
      'dashboard.total_views': 'Total Views',
      'dashboard.total_likes': 'Total Likes',
      'dashboard.total_comments': 'Total Comments',
      'dashboard.post_list': 'Post List',
      'dashboard.create_new_post': 'Write New Post',
      'dashboard.edit_post': 'Edit Post',
      'dashboard.mod_title': 'Moderator Dashboard',
      'dashboard.mod_desc': 'Moderate articles, comments, and system categories.',
      'dashboard.admin_title': 'Super Admin Dashboard',
      'dashboard.admin_desc': 'Manage all users, system settings, and languages.',
      'dashboard.quick_actions': 'Quick Actions',
      'dashboard.featured_posts': 'Featured Articles',
      'dashboard.interaction_chart': 'Article Engagement (Past 7 Days)',
      'dashboard.share_blog': 'Share Blog Page',
      'dashboard.view_history': 'View History',

      // Table Column Headers
      'table.post_title': 'Article / Post',
      'table.author': 'Author',
      'table.category': 'Category',
      'table.created_at': 'Created Date',
      'table.status': 'Status',
      'table.views': 'Views',
      'table.likes': 'Likes',
      'table.actions': 'Actions',
      'table.user_name': 'User',
      'table.email': 'Email',
      'table.role': 'Role',
      'table.comment_content': 'Comment Content',
      'table.reason': 'Report Reason',
      'table.lang_code': 'Language Code',
      'table.lang_name': 'Language Name',
      'table.is_default': 'Is Default',

      // Modals & Popups
      'modal.close': 'Close',
      'modal.cancel': 'Cancel',
      'modal.confirm': 'Confirm',
      'modal.save': 'Save',
      'modal.delete': 'Delete',
      'modal.copy': 'Copy',
      'modal.copied': 'Copied',
      'modal.share_title': 'Share your Blog',
      'modal.share_desc': 'Copy the link below to share your Blog page with everyone:',
      'modal.preview_title': 'Article Preview',
      'modal.reject_title': 'Reject Article',
      'modal.reject_placeholder': 'Enter rejection reason to notify the author...',
      'modal.add_category_title': 'Add New Category',
      'modal.category_name': 'Category Name',
      'modal.category_slug': 'Slug',
      'modal.add_user_title': 'Add New User',
      'modal.add_lang_title': 'Add System Language',
      'modal.delete_confirm': 'Are you sure you want to delete this item?',
    },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app_lang') as SupportedLang;
      if (savedLang && (savedLang === 'VI' || savedLang === 'EN')) {
        this.currentLang.set(savedLang);
      }
    }
  }

  setLanguage(lang: SupportedLang) {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_lang', lang);
    }
  }

  translate(key: string): string {
    const lang = this.currentLang();
    return this.translations[lang]?.[key] || this.translations['VI']?.[key] || key;
  }
}

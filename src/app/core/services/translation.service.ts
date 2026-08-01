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
      'nav.hashtags': 'Hashtags',
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
      'hashtag.title': '#Hashtags bài viết',
      'hashtag.subtitle': 'Tìm kiếm các bài viết nổi bật được đánh tag tương ứng.',
      'category.all': 'Tất cả',

      'hashtag.list_subtitle':
        'Chọn một hashtag để xem các bài viết liên quan.',

      'hashtag.selected_subtitle':
        'Các bài viết được gắn hashtag này.',

      'hashtag.back_to_all':
        'Tất cả hashtag',

      'hashtag.related_posts':
        'Xem bài viết liên quan',

      'hashtag.search_tags_placeholder':
        'Tìm hashtag...',

      'hashtag.search_posts_placeholder':
        'Tìm bài viết trong hashtag này...',

      'hashtag.load_error':
        'Không tải được dữ liệu',

      'hashtag.empty_tags':
        'Không tìm thấy hashtag phù hợp.',

      'hashtag.empty_posts':
        'Không tìm thấy bài viết phù hợp với hashtag này.',

      'common.retry':
        'Thử lại',

      'common.clear_search':
        'Xóa tìm kiếm',

      // Post Card & Detail
      'post.read_time': 'phút đọc',
      'post.like': 'Thích',
      'post.save': 'Lưu',
      'post.views': 'lượt xem',
      'post.likes': 'lượt thích',
      'post.not_found': 'Không tìm thấy bài viết.',
      'post.invalid_id': 'ID bài viết không hợp lệ.',
      'post.load_error': 'Không thể tải bài viết.',
      'post.refreshing_language': 'Đang chuyển ngôn ngữ...',

      // Comments
      'comments.title': 'Bình luận',
      'comments.placeholder': 'Viết bình luận...',
      'comments.submit': 'Gửi bình luận',
      'comments.reply': 'Trả lời',
      'comments.edit': 'Sửa',
      'comments.delete': 'Xóa',
      'comments.empty': 'Chưa có bình luận nào.',
      'comments.report': "Báo cáo bình luận",
      'comments.load_error': 'Không thể tải bình luận.',

      'common.backend_unreachable':
        'Không kết nối được tới máy chủ.',

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

      'posts.load_error':
        'Không tải được bài viết',

      'posts.empty':
        'Không tìm thấy bài viết phù hợp.',
      'filter.oldest': 'Cũ nhất',
      'filter.title_asc': 'Tiêu đề A–Z',
      'comments.newest_first':
        'Mới nhất trước',

      'comments.oldest_first':
        'Cũ nhất trước',

      "category.empty_posts": "Chưa có bài viết trong danh mục này.",

      'author.default_bio': 'Chưa có thông tin giới thiệu.',
      'author.posts': 'bài viết',
      'author.joined': 'Tham gia từ',
      'author.posts_by': 'Bài viết bởi',
      'author.empty_posts': 'Tác giả này chưa có bài viết nào.',
      'author.not_found': 'Không tìm thấy tác giả.',
      'author.load_error': 'Không thể tải thông tin tác giả.',
      'common.back_home': 'Về trang chủ',
      'common.view': 'Xem',

      'auth.step_request': '1. Yêu cầu khôi phục',
      'auth.step_reset': '2. Đặt lại mật khẩu',
      'auth.request_desc': 'Nhập địa chỉ email đã đăng ký. Hệ thống sẽ gửi liên kết/mã khôi phục cho bạn.',
      'auth.has_token_link': 'Đã có mã token? Đặt lại mật khẩu ngay →',
      'auth.reset_desc': 'Nhập mã token nhận được và mật khẩu mới để tiến hành khôi phục.',
      'auth.resend_request_link': '← Chưa nhận được email? Gửi lại yêu cầu',

      'profile.default_user': 'Người dùng',
      'profile.role': 'Vai trò',
      'profile.no_bio': 'Chưa có thông tin giới thiệu',
      'profile.personal_info': 'Thông tin cá nhân',
      'profile.username_label': 'Tên tài khoản / Username',
      'profile.bio_label': 'Bio / Giới thiệu',

      'dashboard_auth.title': 'Đăng nhập Dashboard',
      'dashboard_auth.identifier_placeholder': 'Email hoặc Tên đăng nhập',
      'dashboard_auth.submit_btn': 'Đăng nhập Quản trị',

      'dashboard.view_all': 'Xem tất cả',
      'dashboard.violation_reports_chart': 'Lượng báo cáo vi phạm (7 ngày qua)',
      'dashboard.approve_blogs_count': 'Duyệt Blogs (6)',
      'dashboard.handle_comments_count': 'Xử lý Comments (14)',
      'dashboard.add_category_btn': 'Thêm Category',
      'dashboard.view_delete_history': 'Xem lịch sử xóa',
      'dashboard.moderation_rate_chart': 'Tỷ lệ xử lý vi phạm',
      'dashboard.blog_owners': 'Blog Owners',
      'dashboard.user_growth_chart': 'Tăng trưởng người dùng (7 ngày qua)',
      'dashboard.approve_requests_count': 'Duyệt yêu cầu (5)',
      'dashboard.add_language_btn': 'Thêm Language',
      'dashboard.blog_lang_dist_chart': 'Phân bổ Blog theo ngôn ngữ',
      'dashboard.users': 'Người dùng',
      'dashboard.languages': 'Ngôn ngữ hệ thống',
      'dashboard.pending_blogs': 'Bài viết chờ duyệt',
      'dashboard.pending_comments': 'Bình luận chờ xử lý',

      'status.pending': 'Chờ duyệt',
      'status.active': 'HOẠT ĐỘNG',
      'status.locked': 'ĐÃ KHÓA',

      'action.approve': 'Duyệt bài',
      'action.reject': 'Từ chối',

      'users.grant_owner': 'Cấp quyền',
      'users.revoke_owner': 'Tước quyền',
      'users.lock_user': 'Khóa user',
      'users.unlock_user': 'Mở khóa',
      'users.temp_password': 'Mật khẩu tạm thời',
      'users.temp_password_placeholder': 'Nhập mật khẩu cho Moderator',
      'users.temp_password_hint': 'Moderator có thể đổi mật khẩu này sau khi đăng nhập.',
      'users.note_label': 'Ghi chú (Tùy chọn)',
      'users.note_placeholder': 'Ví dụ: Phụ trách kiểm duyệt mảng Backend...',
      'users.user_info_title': 'Thông tin Người dùng',
      'users.recent_posts': 'Bài viết gần đây',
      'users.no_posts_hint': 'Người dùng này chưa có bài viết nào hoặc không có quyền viết blog.',

      'languages.country_flag': 'Quốc gia (Cờ)',
      'languages.display_name': 'Tên hiển thị',
      'languages.code_placeholder': 'VD: vi, en, fr...',
      'languages.name_placeholder': 'VD: Tiếng Việt',
      'languages.set_default': 'Đặt làm ngôn ngữ mặc định (Default)',
      'languages.activate_now': 'Kích hoạt ngay (Active)',

      'comments.reported_content_title': 'Nội dung bình luận bị báo cáo:',
      'comments.post_context_title': 'Ngữ cảnh bài viết:',
      'comments.anonymous_user': 'Người dùng',
      'comments.table_header': 'Bình luận',

      'post.save_hint': 'Lưu bài viết (Yêu cầu đăng nhập)',
      'post.published': 'Xuất bản',

      'category.post_list_title': 'Danh sách bài viết',

      'sidebar.no_authors': 'Chưa có dữ liệu tác giả.',
      'sidebar.no_trending': 'Chưa có bài viết nổi bật.',
      'sidebar.no_tags': 'Chưa có tag nổi bật.',

      'pagination.nav_label': 'Điều hướng phân trang',
      'pagination.page': 'Trang',
      'pagination.prev_aria': 'Chuyển đến trang trước',
      'pagination.next_aria': 'Chuyển đến trang sau',

      'modal.edit_category_title': 'Chỉnh sửa Category',
      'modal.category_name_placeholder': 'VD: Backend, Frontend...',
      'modal.add_mod_title': 'Thêm Moderator mới',
      'modal.edit_lang_title': 'Chỉnh sửa Ngôn ngữ',
      'nav.account': 'Tài khoản',
    },
    EN: {
      "category.empty_posts": "No Posts in this Category",
      'filter.oldest': 'Oldest',
      'filter.title_asc': 'Title A–Z',
      'comments.newest_first':
        'Newest first',

      'comments.oldest_first':
        'Oldest first',
      'posts.load_error':
        'Unable to load posts',

      'posts.empty':
        'No matching posts found.',

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

      'hashtag.list_subtitle':
        'Choose a hashtag to view related articles.',

      'hashtag.selected_subtitle':
        'Articles tagged with this hashtag.',

      'hashtag.back_to_all':
        'All hashtags',

      'hashtag.related_posts':
        'View related articles',

      'hashtag.search_tags_placeholder':
        'Search hashtags...',

      'hashtag.search_posts_placeholder':
        'Search posts in this hashtag...',

      'hashtag.load_error':
        'Unable to load data',

      'hashtag.empty_tags':
        'No matching hashtags found.',

      'hashtag.empty_posts':
        'No matching articles found for this hashtag.',

      'common.retry':
        'Try again',

      'common.clear_search':
        'Clear search',
      'category.all': 'All',

      // Post Card & Detail
      'post.read_time': 'min read',
      'post.like': 'Like',
      'post.save': 'Save',
      'post.views': 'views',
      'post.likes': 'likes',
      'post.not_found': 'Post not found.',
      'post.invalid_id': 'Invalid post ID.',
      'post.load_error': 'Unable to load the post.',
      'post.refreshing_language':
        'Switching language...',

      // Comments
      'comments.title': 'Comments',
      'comments.placeholder': 'Write a comment...',
      'comments.submit': 'Submit Comment',
      'comments.reply': 'Reply',
      'comments.edit': 'Edit',
      'comments.delete': 'Delete',
      'comments.empty': 'No comments yet.',
      'comments.report': 'Report comment',

      'comments.load_error':
        'Unable to load comments.',

      'common.backend_unreachable':
        'Unable to connect to the server.',

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

      'author.default_bio': 'No bio available.',
      'author.posts': 'posts',
      'author.joined': 'Joined',
      'author.posts_by': 'Posts by',
      'author.empty_posts': 'This author has no posts.',
      'author.not_found': 'Author not found.',
      'author.load_error': 'Unable to load author info.',
      'common.back_home': 'Back to Home',
      'common.view': 'View',

      'auth.step_request': '1. Request Reset',
      'auth.step_reset': '2. Reset Password',
      'auth.request_desc': 'Enter your registered email address. The system will send a reset link/code to you.',
      'auth.has_token_link': 'Already have a token? Reset password now →',
      'auth.reset_desc': 'Enter the received token code and new password to proceed.',
      'auth.resend_request_link': "← Didn't receive an email? Resend request",

      'profile.default_user': 'User',
      'profile.role': 'Role',
      'profile.no_bio': 'No bio provided',
      'profile.personal_info': 'Personal Information',
      'profile.username_label': 'Username',
      'profile.bio_label': 'Bio / Introduction',

      'dashboard_auth.title': 'Dashboard Log In',
      'dashboard_auth.identifier_placeholder': 'Email or Username',
      'dashboard_auth.submit_btn': 'Admin Log In',

      'dashboard.view_all': 'View All',
      'dashboard.violation_reports_chart': 'Violation Reports (Past 7 Days)',
      'dashboard.approve_blogs_count': 'Approve Blogs (6)',
      'dashboard.handle_comments_count': 'Handle Comments (14)',
      'dashboard.add_category_btn': 'Add Category',
      'dashboard.view_delete_history': 'View Delete History',
      'dashboard.moderation_rate_chart': 'Moderation Rate',
      'dashboard.blog_owners': 'Blog Owners',
      'dashboard.user_growth_chart': 'User Growth (Past 7 Days)',
      'dashboard.approve_requests_count': 'Approve Requests (5)',
      'dashboard.add_language_btn': 'Add Language',
      'dashboard.blog_lang_dist_chart': 'Blog Distribution by Language',
      'dashboard.users': 'Users',
      'dashboard.languages': 'System Languages',
      'dashboard.pending_blogs': 'Pending Blogs',
      'dashboard.pending_comments': 'Pending Comments',

      'status.pending': 'Pending',
      'status.active': 'ACTIVE',
      'status.locked': 'LOCKED',

      'action.approve': 'Approve',
      'action.reject': 'Reject',

      'users.grant_owner': 'Grant Access',
      'users.revoke_owner': 'Revoke Access',
      'users.lock_user': 'Lock User',
      'users.unlock_user': 'Unlock',
      'users.temp_password': 'Temporary Password',
      'users.temp_password_placeholder': 'Enter password for Moderator',
      'users.temp_password_hint': 'Moderator can change this password after logging in.',
      'users.note_label': 'Note (Optional)',
      'users.note_placeholder': 'e.g., In charge of Backend moderation...',
      'users.user_info_title': 'User Information',
      'users.recent_posts': 'Recent Posts',
      'users.no_posts_hint': 'This user has no posts or does not have blog writing permissions.',

      'languages.country_flag': 'Country (Flag)',
      'languages.display_name': 'Display Name',
      'languages.code_placeholder': 'e.g., vi, en, fr...',
      'languages.name_placeholder': 'e.g., Vietnamese',
      'languages.set_default': 'Set as default language (Default)',
      'languages.activate_now': 'Activate now (Active)',

      'comments.reported_content_title': 'Reported Comment Content:',
      'comments.post_context_title': 'Article Context:',
      'comments.anonymous_user': 'User',
      'comments.table_header': 'Comment',

      'post.save_hint': 'Save article (Requires log in)',
      'post.published': 'Published',

      'category.post_list_title': 'Article List',

      'sidebar.no_authors': 'No author data available.',
      'sidebar.no_trending': 'No trending posts available.',
      'sidebar.no_tags': 'No popular tags available.',

      'pagination.nav_label': 'Pagination navigation',
      'pagination.page': 'Page',
      'pagination.prev_aria': 'Go to previous page',
      'pagination.next_aria': 'Go to next page',

      'modal.edit_category_title': 'Edit Category',
      'modal.category_name_placeholder': 'e.g., Backend, Frontend...',
      'modal.add_mod_title': 'Add New Moderator',
      'modal.edit_lang_title': 'Edit Language',
      'nav.account': 'Account',
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

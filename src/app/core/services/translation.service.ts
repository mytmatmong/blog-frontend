import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  OWNER_TRANSLATIONS_EN,
  OWNER_TRANSLATIONS_VI,
} from '../i18n/owner-translations';

export type SupportedLang = string;

export interface LanguageOption {
  id: number;
  code: SupportedLang;
  name: string;
  flag: string;
  isDefault: boolean;
}

interface ApiLanguageRecord {
  id: number;
  code: string;
  name: string;
  flag: string | null;
  isDefault: boolean;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { id: 1, code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳', isDefault: true },
  { id: 2, code: 'EN', name: 'English', flag: '🇺🇸', isDefault: false },
];

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private languagesRequested = false;

  currentLang = signal<SupportedLang>('VI');
  readonly languages = signal<LanguageOption[]>(DEFAULT_LANGUAGES);
  readonly languagesLoading = signal(false);
  readonly languagesLoadError = signal(false);

  private translations: Record<string, Record<string, string>> = {
    VI: {
      ...OWNER_TRANSLATIONS_VI,
      // Header & Nav
      'nav.posts': 'Bài viết',
      'nav.categories': 'Danh mục',
      'nav.hashtags': 'Hashtags',
      'nav.login': 'Đăng nhập',
      'nav.logout': 'Đăng xuất',
      'nav.profile': 'Trang cá nhân',
      'nav.request_owner': 'Yêu cầu Blog Owner',
      'nav.owner_dashboard': 'Owner dashboard',
      'nav.moderator_dashboard': 'Moderator dashboard',
      'nav.admin_dashboard': 'Admin dashboard',
      'nav.toggle_theme': 'Chuyển chế độ Sáng/Tối',
      'nav.language': 'Ngôn ngữ',
      'ui.community_label': 'Cộng đồng lập trình',
      'auth.showcase_title': 'Viết, chia sẻ và cùng nhau học hỏi.',
      'auth.showcase_desc':
        'Một không gian gọn gàng cho bài viết kỹ thuật, thảo luận hữu ích và những ý tưởng đáng lưu lại.',
      'auth.feature_stories': 'Bài viết kỹ thuật',
      'auth.feature_community': 'Cộng đồng tác giả',
      'auth.feature_library': 'Thư viện cá nhân',
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

      'hashtag.list_subtitle': 'Chọn một hashtag để xem các bài viết liên quan.',

      'hashtag.selected_subtitle': 'Các bài viết được gắn hashtag này.',

      'hashtag.back_to_all': 'Tất cả hashtag',

      'hashtag.related_posts': 'Xem bài viết liên quan',

      'hashtag.search_tags_placeholder': 'Tìm hashtag...',

      'hashtag.search_posts_placeholder': 'Tìm bài viết trong hashtag này...',

      'hashtag.load_error': 'Không tải được dữ liệu',

      'hashtag.empty_tags': 'Không tìm thấy hashtag phù hợp.',

      'hashtag.empty_posts': 'Không tìm thấy bài viết phù hợp với hashtag này.',

      'common.retry': 'Thử lại',

      'common.clear_search': 'Xóa tìm kiếm',

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
      'comments.report': 'Báo cáo bình luận',
      'comments.load_error': 'Không thể tải bình luận.',

      'common.backend_unreachable': 'Không kết nối được tới máy chủ.',

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
      'pagination.current_page': 'Trang hiện tại: ',
      'pagination.go_to_page': 'Đi đến trang: ',

      // Footer
      'footer.copyright': '© 2026 Blogy. — Cộng đồng chia sẻ kiến thức',
      'footer.inspired_by': 'Tối giản · Tinh tế · Dễ đọc',

      // Request Blog Owner
      'request_owner.title': 'Yêu cầu trở thành Blog Owner',
      'request_owner.subtitle':
        'Hãy cung cấp lý do và thông tin giới thiệu bản thân để Moderator kiểm duyệt quyền viết bài.',
      'request_owner.reason_label': 'Lý do muốn đăng ký',
      'request_owner.reason_placeholder':
        'Chia sẻ trải nghiệm và chủ đề bài viết bạn muốn chia sẻ...',
      'request_owner.submit_btn': 'Gửi yêu cầu kiểm duyệt',

      // Dashboard Common & Sidebar
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Bảng điều khiển & Thống kê hệ thống',
      'dashboard.my_posts': 'Bài viết của tôi',
      'dashboard.create_post': 'Tạo bài viết',
      'dashboard.mod_dashboard': 'Moderator Dashboard',
      'dashboard.approve_posts': 'Duyệt bài viết',
      'dashboard.categories': 'Danh mục',
      'dashboard.comments': 'Bình luận',
      'dashboard.manage_reports': 'Báo cáo vi phạm',
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
      'table.user': 'Người dùng',
      'table.default': 'Mặc định',
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
      'modal.share_desc':
        'Sao chép đường dẫn bên dưới để chia sẻ trang Blog của bạn với mọi người:',
      'modal.preview_title': 'Xem trước bài viết',
      'modal.reject_title': 'Từ chối bài viết',
      'modal.reject_placeholder': 'Nhập lý do từ chối để thông báo cho tác giả...',
      'modal.add_category_title': 'Thêm danh mục mới',
      'modal.category_name': 'Tên danh mục',
      'modal.category_slug': 'Đường dẫn (Slug)',
      'modal.add_user_title': 'Thêm người dùng mới',
      'modal.add_lang_title': 'Thêm ngôn ngữ hệ thống',
      'modal.add_language_title': 'Thêm ngôn ngữ hệ thống',
      'modal.delete_confirm': 'Bạn có chắc chắn muốn xóa bản ghi này không?',
      'modal.preview_blog_p1':
        'Đây là nội dung mô phỏng của bài viết để Moderator có thể đọc và đánh giá trước khi duyệt.',
      'modal.preview_blog_p2':
        'Kiểm tra kỹ lưỡng nội dung trước khi quyết định duyệt hoặc từ chối bài viết.',
      'modal.preview_blog_h1': '1. Tại sao tính năng này quan trọng?',
      'modal.preview_blog_p3':
        'Việc kiểm duyệt bài viết giúp đảm bảo nền tảng Blogy. luôn giữ được chất lượng nội dung tốt nhất.',
      'modal.preview_blog_h2': '2. Yêu cầu định dạng bài viết',
      'modal.preview_blog_li1': 'Tiêu đề phải rõ ràng, không giật tít câu view (clickbait).',
      'modal.preview_blog_li2': 'Nội dung không chứa ngôn từ kích động, thù địch hoặc spam.',
      'modal.preview_blog_li3': 'Các đoạn code cần được đặt trong thẻ Code block một cách hợp lệ.',
      'modal.preview_cat_post': 'Bài viết demo cho danh mục',
      'modal.preview_comment_p1':
        'Đây là nội dung mô phỏng của bài viết liên kết với bình luận này. Moderator có thể đọc nhanh nội dung bài viết ngay tại đây để có ngữ cảnh tốt hơn khi xử lý bình luận.',
      'modal.preview_comment_p2':
        'Ví dụ: một bình luận có thể trông không rõ ràng, nhưng khi đặt vào ngữ cảnh của bài viết thì lại hoàn toàn hợp lệ.',

      'categories.load_error': 'Không tải được danh mục.',

      'posts.load_error': 'Không tải được bài viết',

      'posts.empty': 'Không tìm thấy bài viết phù hợp.',
      'filter.oldest': 'Cũ nhất',
      'filter.title_asc': 'Tiêu đề A–Z',
      'comments.newest_first': 'Mới nhất trước',

      'comments.oldest_first': 'Cũ nhất trước',

      'category.empty_posts': 'Chưa có bài viết trong danh mục này.',

      'author.default_bio': 'Chưa có thông tin giới thiệu.',
      'author.posts': 'bài viết',
      'author.joined': 'Tham gia từ',
      'author.posts_by': 'Bài viết bởi',
      'author.empty_posts': 'Tác giả này chưa có bài viết nào.',
      'author.not_found': 'Không tìm thấy tác giả.',
      'author.load_error': 'Không thể tải thông tin tác giả.',
      'common.back_home': 'Về trang chủ',
      'common.view': 'Xem',

      'auth.step_request': 'Yêu cầu khôi phục',
      'auth.step_reset': 'Đặt lại mật khẩu',
      'auth.request_desc':
        'Nhập địa chỉ email đã đăng ký. Hệ thống sẽ gửi liên kết/mã khôi phục cho bạn.',
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
      'status.active': 'Hoạt động',
      'status.locked': 'Đã khóa',
      'status.deleted': 'Đã xóa mềm',
      'status.approved': 'Đã duyệt',
      'status.rejected': 'Từ chối',
      'status.published': 'Đã xuất bản',
      'status.draft': 'Bản nháp',
      'status.inactive': 'Không hoạt động',
      'status.resolved': 'Đã xử lý',
      'status.pending_review': 'Chờ duyệt',

      'posts.status.draft': 'Bản nháp',
      'posts.status.pending': 'Chờ duyệt',
      'posts.status.published': 'Đã xuất bản',
      'posts.status.rejected': 'Bị từ chối',
      'posts.status.archived': 'Đã lưu trữ',

      'filter.status.pending': 'Chờ duyệt',
      'filter.status.pending_review': 'Chờ duyệt',
      'filter.status.published': 'Đã xuất bản',
      'filter.status.rejected': 'Từ chối',
      'filter.status.resolved': 'Đã xử lý',
      'filter.status.all': 'Tất cả trạng thái',
      'filter.status.draft': 'Nháp',

      'dropdown.select_multiple': 'Chọn nhiều mục...',
      'dropdown.select_single': 'Chọn một lựa chọn...',
      'dropdown.selected_count': 'Đã chọn {count} mục',
      'search.placeholder': 'Tìm kiếm...',

      'users.role_all': 'Tất cả vai trò',
      'users.all_roles': 'Tất cả vai trò',
      'users.all_statuses': 'Tất cả trạng thái',
      'status.active_title': 'Hoạt động',
      'status.locked_title': 'Đã khóa',

      'role.normal': 'Người dùng thông thường',
      'role.blog_owner': 'Tác giả bài viết',
      'role.content_moderator': 'Kiểm duyệt viên',
      'role.super_admin': 'Quản trị viên tối cao',
      'role.NORMAL': 'Người dùng thông thường',
      'role.BLOG_OWNER': 'Tác giả bài viết',
      'role.CONTENT_MODERATOR': 'Kiểm duyệt viên',
      'role.SUPER_ADMIN': 'Quản trị viên tối cao',

      'users.total_users': 'Tổng cộng',
      'users.users_unit': 'người dùng',
      'users.create_mod_title': 'Tạo mới Content Moderator',
      'users.mod_password': 'Mật khẩu',
      'users.min_6_chars': 'Tối thiểu 6 ký tự...',
      'users.bio_optional': 'Tiểu sử / Bio (Tùy chọn)',
      'users.bio_placeholder_example': 'Ví dụ: Kiểm duyệt bài viết mảng công nghệ...',
      'users.user_detail_title': 'Chi tiết Người dùng:',
      'users.loading_detail': 'Đang tải thông tin chi tiết & bài viết...',
      'users.joined_date': 'Ngày tham gia',
      'users.lock_reason_heading': 'Lý do khóa tài khoản:',
      'users.author_posts_list': 'Danh sách bài viết tác giả đã đăng',
      'users.no_posts_in_system': 'Người dùng này chưa có bài viết nào trong hệ thống.',
      'users.views_count': 'lượt xem',
      'users.likes_count': 'thích',
      'users.comments_count': 'bình luận',
      'users.change_role_modal_title': 'Đổi vai trò người dùng',
      'users.select_new_role_desc': 'Chọn vai trò mới cho tài khoản',
      'users.update_role_submit': 'Cập nhật vai trò',

      'languages.empty_list': 'Chưa có ngôn ngữ nào.',

      'moderator.loading_dashboard': 'Đang tải dữ liệu Moderator Dashboard...',
      'moderator.forbidden_title': 'Không có quyền truy cập (403 Forbidden)',
      'moderator.error_title': 'Không thể tải dữ liệu Dashboard',
      'moderator.test_account_guide': 'Hướng dẫn tài khoản kiểm thử Moderator:',
      'moderator.test_account_dashboard_desc': 'Theo quy định API Backend, chỉ tài khoản có role CONTENT_MODERATOR mới được gọi API /api/v1/moderator/dashboard.',
      'moderator.test_account_blog_desc': 'Chỉ tài khoản thuộc vai trò CONTENT_MODERATOR mới có thể xem danh sách kiểm duyệt bài viết.',
      'moderator.test_account_report_desc': 'Chỉ tài khoản thuộc vai trò CONTENT_MODERATOR mới có thể truy cập danh sách báo cáo vi phạm.',
      'moderator.sample_account': 'Tài khoản Moderator mẫu:',
      'moderator.logout_and_switch': 'Đăng xuất & Đăng nhập Moderator',
      'moderator.pending_review_posts_desc': 'Bài viết PENDING_REVIEW',
      'moderator.pending_reports': 'Báo cáo chờ xử lý',
      'moderator.processed_today': 'Đã xử lý hôm nay',
      'moderator.active_category_groups': 'Nhóm danh mục đang hoạt động',
      'moderator.last_7_days': '7 ngày qua',
      'moderator.approve_blogs_action': 'Duyệt bài viết',
      'moderator.handle_reports_action': 'Xử lý báo cáo',
      'moderator.manage_categories_action': 'Quản lý Category',
      'moderator.approve_author_requests_action': 'Duyệt yêu cầu tác giả',
      'moderator.report_reason_stats': 'Thống kê lý do báo cáo',
      'moderator.report_status_stats': 'Thống kê trạng thái báo cáo',
      'moderator.posts_unit': 'bài viết',
      'moderator.reports_unit': 'báo cáo',
      'moderator.comments_unit': 'bình luận',
      'moderator.search_blog_placeholder': 'Tìm kiếm tiêu đề bài viết...',
      'moderator.loading_blogs': 'Đang tải danh sách bài viết...',
      'moderator.cannot_load_blogs': 'Không thể tải danh sách bài viết',
      'moderator.no_blogs_title': 'Không có bài viết nào',
      'moderator.no_blogs_desc': 'Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.',
      'moderator.id_and_title': 'ID & Tiêu đề',
      'moderator.lang_and_cat': 'Ngôn ngữ / Danh mục',
      'moderator.created_at': 'Tạo lúc',
      'moderator.showing': 'Hiển thị',
      'moderator.reject_blog_confirm_prefix': 'Từ chối bài viết:',
      'moderator.loading_reports': 'Đang tải danh sách báo cáo vi phạm...',
      'moderator.cannot_load_reports': 'Không thể tải danh sách báo cáo',
      'moderator.no_reports_title': 'Không có báo cáo nào',
      'moderator.no_reports_desc': 'Không tìm thấy báo cáo vi phạm nào phù hợp với bộ lọc hiện tại.',
      'moderator.id_and_target': 'ID & Đối tượng',
      'moderator.reporter': 'Người báo cáo',
      'moderator.reported_content': 'Nội dung bị báo cáo',
      'moderator.violation_reason': 'Lý do vi phạm',
      'moderator.loading_report_detail': 'Đang tải dữ liệu chi tiết báo cáo...',
      'moderator.report_detail_title': 'Chi tiết báo cáo vi phạm:',
      'moderator.report_reason_label': 'Lý do báo cáo:',
      'moderator.status_label': 'Trạng thái:',
      'moderator.detailed_desc_from_reporter': 'Mô tả chi tiết từ người gửi:',
      'moderator.reviewed_by': 'Người duyệt:',
      'moderator.reviewed_at': 'Xử lý lúc:',
      'moderator.resolution_note_label': 'Ghi chú xử lý:',
      'moderator.reported_post_title': 'Bài viết bị báo cáo',
      'moderator.reported_comment_title': 'Bình luận bị báo cáo',
      'moderator.commenter': 'Người viết bình luận:',
      'moderator.reply_context': 'Bình luận cha (Reply context):',
      'moderator.post_context': 'Ngữ cảnh bài viết chứa bình luận:',
      'moderator.post_author': 'Tác giả bài:',
      'moderator.confirm_violation_modal_title': 'Xác nhận báo cáo vi phạm',
      'moderator.confirm_violation_desc_prefix': 'Bạn đang xử lý báo cáo',
      'moderator.confirm_violation_desc_suffix': '. Xử lý này sẽ tự động ẩn nội dung vi phạm khỏi hệ thống.',
      'moderator.resolution_note_placeholder': 'Nhập lý do xử lý vi phạm...',
      'moderator.confirm_and_hide_content': 'Xác nhận & ẩn nội dung',
      'moderator.reject_report_modal_title': 'Bác bỏ báo cáo vi phạm',
      'moderator.reject_report_desc_prefix': 'Bạn đang bác bỏ báo cáo',
      'moderator.reject_report_desc_suffix': '. Nội dung bị báo cáo sẽ được giữ nguyên trên hệ thống.',
      'moderator.reject_reason_label': 'Lý do bác bỏ (Tối đa 1000 ký tự)',
      'moderator.reject_reason_placeholder': 'Nhập lý do bác bỏ...',
      'moderator.confirm_reject': 'Xác nhận bác bỏ',
      'moderator.target_all': 'Tất cả đối tượng',
      'moderator.target_post': 'Bài viết',
      'moderator.target_comment': 'Bình luận',
      'moderator.reason_all': 'Tất cả lý do',

      'report.reason.SPAM': 'Spam / Quảng cáo',
      'report.reason.HARASSMENT': 'Xúc phạm / Bắt nạt',
      'report.reason.INAPPROPRIATE': 'Nội dung không phù hợp',
      'report.reason.COPYRIGHT': 'Vi phạm bản quyền',
      'report.reason.MISINFORMATION': 'Thông tin sai lệch',
      'report.reason.OTHER': 'Lý do khác',

      'action.view': 'Xem',
      'action.approve': 'Duyệt',
      'action.reject': 'Từ chối',
      'action.resolve': 'Xử lý',
      'action.edit': 'Sửa',
      'action.lock': 'Khóa',
      'action.unlock': 'Mở khóa',
      'action.delete': 'Xóa',
      'action.save': 'Lưu',
      'action.cancel': 'Hủy',
      'action.close': 'Đóng',
      'action.retry': 'Thử lại',
      'action.create': 'Tạo',
      'action.edit_user_title': 'Cập nhật thông tin người dùng',
      'action.lock_user_title': 'Khóa tài khoản người dùng',
      'action.unlock_user_title': 'Mở khóa tài khoản người dùng',
      'action.delete_user_title': 'Xóa mềm người dùng',

      'users.search_placeholder': 'Tìm kiếm username hoặc email...',
      'users.clear_filters': 'Xóa lọc',
      'users.loading': 'Đang tải danh sách người dùng...',
      'users.empty': 'Không tìm thấy người dùng phù hợp với điều kiện tìm kiếm.',
      'users.edit_title': 'Cập nhật thông tin người dùng',
      'users.bio_label': 'Tiểu sử / Bio',
      'users.bio_placeholder': 'Nhập tiểu sử mới...',
      'users.avatar_url_label': 'URL ảnh đại diện (Avatar URL)',
      'users.new_password_optional': 'Mật khẩu mới (Tùy chọn)',
      'users.password_placeholder': 'Để trống nếu không đổi mật khẩu',
      'users.lock_title': 'Khóa tài khoản người dùng',
      'users.lock_description_before': 'Bạn đang thực hiện khóa tài khoản',
      'users.lock_description_after': 'Tất cả phiên đăng nhập của người dùng sẽ bị thu hồi.',
      'users.lock_reason_label': 'Lý do khóa tài khoản',
      'users.lock_reason_placeholder': 'Nhập lý do chi tiết...',
      'users.confirm_lock': 'Xác nhận khóa',

      'admin_dashboard.refresh': 'Làm mới',
      'admin_dashboard.loading': 'Đang tải dữ liệu dashboard...',
      'admin_dashboard.in_7_days': 'trong 7 ngày',
      'admin_dashboard.creator_accounts': 'Tài khoản sáng tạo nội dung',
      'admin_dashboard.posts': 'bài viết',
      'admin_dashboard.owner_requests': 'Yêu cầu Blog Owner',
      'admin_dashboard.awaiting_review': 'Đang chờ xử lý',
      'admin_dashboard.daily_growth_desc': 'Số tài khoản mới được tạo theo ngày',
      'admin_dashboard.seven_day_total': 'Tổng 7 ngày',
      'admin_dashboard.review_requests': 'Duyệt yêu cầu',
      'admin_dashboard.language_distribution_desc': 'Tỷ lệ bài viết theo ngôn ngữ',
      'admin_dashboard.language_details': 'Chi tiết theo ngôn ngữ',
      'admin_dashboard.sorted_by_posts': 'Sắp xếp theo số lượng bài viết',
      'admin_dashboard.languages': 'ngôn ngữ',
      'admin_dashboard.no_language_data': 'Chưa có dữ liệu ngôn ngữ',
      'admin_dashboard.new_users': 'người dùng mới',
      'admin_dashboard.invalid_data': 'Dữ liệu dashboard trả về không hợp lệ.',
      'admin_dashboard.load_error': 'Không thể tải dữ liệu dashboard admin.',
      'admin_dashboard.growth_chart_label': 'Biểu đồ tăng trưởng người dùng',
      'admin_dashboard.language_chart_label': 'Biểu đồ phân bổ bài viết theo ngôn ngữ',

      'requests.title': 'Duyệt yêu cầu Blog Owner',
      'requests.subtitle':
        'Danh sách yêu cầu đăng ký làm tác giả bài viết của người dùng hệ thống.',
      'requests.pending': 'Chờ duyệt',
      'requests.approved': 'Đã duyệt',
      'requests.rejected': 'Từ chối',
      'requests.all': 'Tất cả',
      'requests.loading': 'Đang tải danh sách yêu cầu...',
      'requests.user_id': 'User ID',
      'requests.reason_topics': 'Lý do & chủ đề dự kiến',
      'requests.actions_review': 'Thao tác / thông tin duyệt',
      'requests.empty': 'Không có yêu cầu Blog Owner nào phù hợp với bộ lọc.',
      'requests.topics': 'Chủ đề',
      'requests.approve': 'Duyệt',
      'requests.reject': 'Từ chối',
      'requests.reviewed_at': 'Duyệt lúc',
      'requests.by_reviewer': 'Bởi Reviewer',
      'requests.rejection_reason': 'Lý do từ chối',
      'requests.total': 'Tổng cộng',
      'requests.items': 'yêu cầu',
      'requests.reject_modal_title': 'Từ chối yêu cầu Blog Owner',
      'requests.reject_confirm': 'Bạn có chắc muốn từ chối yêu cầu của',
      'requests.rejection_reason_label': 'Lý do từ chối (Tùy chọn, tối đa 1000 ký tự)',
      'requests.rejection_placeholder': 'Nhập lý do phản hồi cho người dùng...',
      'requests.confirm_reject': 'Xác nhận từ chối',
      'requests.load_error': 'Tải danh sách yêu cầu thất bại',
      'requests.approve_confirm': 'Duyệt quyền Blog Owner cho yêu cầu',
      'requests.approve_modal_title': 'Xác nhận duyệt yêu cầu',
      'requests.confirm_approve': 'Xác nhận duyệt',
      'requests.approve_success': 'Đã duyệt yêu cầu thành công',
      'requests.approve_error': 'Duyệt yêu cầu thất bại',
      'requests.reject_success': 'Đã từ chối yêu cầu',
      'requests.reject_error': 'Từ chối yêu cầu thất bại',

      'users.grant_owner': 'Cấp quyền',
      'users.revoke_owner': 'Tước quyền',
      'users.lock_user': 'Khóa user',
      'users.unlock_user': 'Mở khóa',
      'users.soft_delete': 'Xóa mềm',
      'users.restore': 'Khôi phục',
      'users.confirm_delete': 'Bạn có chắc chắn muốn xóa mềm người dùng',
      'users.confirm_unlock': 'Bạn có chắc chắn muốn mở khóa tài khoản',
      'users.delete_confirm_title': 'Xóa mềm người dùng',
      'users.unlock_confirm_title': 'Mở khóa tài khoản',
      'users.confirm_restore': 'Bạn có chắc chắn muốn khôi phục người dùng này?',
      'users.temp_password': 'Mật khẩu tạm thời',
      'users.temp_password_placeholder': 'Nhập mật khẩu cho Moderator',
      'users.temp_password_hint': 'Moderator có thể đổi mật khẩu này sau khi đăng nhập.',
      'users.note_label': 'Ghi chú (Tùy chọn)',
      'users.note_placeholder': 'Ví dụ: Phụ trách kiểm duyệt mảng Backend...',
      'users.user_info_title': 'Thông tin người dùng',
      'users.recent_posts': 'Bài viết gần đây',
      'users.no_posts_hint': 'Người dùng này chưa có bài viết nào hoặc không có quyền viết blog.',

      'languages.country_flag': 'Quốc gia (Cờ)',
      'languages.display_name': 'Tên hiển thị',
      'languages.code_placeholder': 'VD: vi, en, fr...',
      'languages.name_placeholder': 'VD: Tiếng Việt',
      'languages.set_default': 'Đặt làm ngôn ngữ mặc định',
      'languages.activate_now': 'Kích hoạt ngay',
      'languages.delete_confirm_title': 'Xóa ngôn ngữ hệ thống',
      'languages.delete_confirm': 'Bạn có chắc chắn muốn xóa ngôn ngữ',

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
      'nav.library': 'Bài đã lưu & thích',
      'nav.connections': 'Kết nối',

      'common.save': 'Lưu thay đổi',
      'common.saving': 'Đang lưu...',
      'common.sending': 'Đang gửi...',
      'common.detail': 'Chi tiết',

      'library.title': 'Thư viện của tôi',
      'library.subtitle': 'Các bài viết bạn đã lưu hoặc đã thích.',
      'library.bookmarks': 'Đã lưu',
      'library.likes': 'Đã thích',
      'library.empty_bookmarks': 'Bạn chưa lưu bài viết nào.',
      'library.empty_likes': 'Bạn chưa thích bài viết nào.',

      'connections.title': 'Kết nối của tôi',
      'connections.subtitle': 'Danh sách người theo dõi và người bạn đang theo dõi.',
      'connections.followers': 'Người theo dõi',
      'connections.following': 'Đang theo dõi',
      'connections.empty': 'Chưa có dữ liệu kết nối.',
      'connections.follows_you': 'Theo dõi bạn',
      'connections.you_are_following': 'Bạn đang theo dõi',
      'connections.no_connection': 'Chưa có kết nối',
      'connections.user_id': 'ID người dùng',

      'profile.followers': 'Người theo dõi gần đây',
      'profile.edit_hint': 'Username, email, role và trạng thái do hệ thống quản lý.',
      'profile.new_password': 'Mật khẩu mới',
      'profile.password_placeholder': 'Để trống nếu không đổi mật khẩu',
      'profile.avatar': 'Ảnh đại diện',
      'profile.avatar_hint': 'Ảnh JPG/PNG/WebP, tối đa 5MB.',
      'profile.upload_avatar_only': 'Chỉ upload avatar',
      'profile.security': 'Bảo mật và tài khoản',
      'profile.logout_all': 'Đăng xuất tất cả thiết bị',
      'profile.delete_account': 'Xóa tài khoản',

      'request_owner.topics_label': 'Chủ đề dự kiến',
      'request_owner.topics_placeholder': 'Ví dụ: NestJS, Angular, PostgreSQL...',
      'request_owner.already_owner': 'Tài khoản của bạn đã là BLOG_OWNER.',
      'request_owner.reviewed_at': 'Thời gian duyệt',
      'request_owner.rejection_reason': 'Lý do từ chối',
      'request_owner.history': 'Lịch sử yêu cầu',
      'request_owner.all_statuses': 'Tất cả trạng thái',
      'request_owner.empty': 'Bạn chưa có yêu cầu Blog Owner nào.',

      'post.unlike': 'Bỏ thích',
      'post.unsave': 'Bỏ lưu',
      'post.report': 'Báo cáo bài viết',

      'comments.replying_to': 'Đang trả lời',
      'comments.editing': 'Đang sửa bình luận',
      'comments.save_edit': 'Lưu chỉnh sửa',
      'comments.login_required': 'Đăng nhập để viết bình luận và tương tác.',

      'report.reason': 'Lý do báo cáo',
      'report.description': 'Mô tả bổ sung',
      'report.submit': 'Gửi báo cáo',

      'author.follow': 'Theo dõi',
      'author.unfollow': 'Bỏ theo dõi',

      // Profile Extended & Toasts
      'profile.new_avatar_title': 'Chọn ảnh đại diện mới',
      'profile.avatar_limit_hint': 'JPG, PNG hoặc WebP. Dung lượng tối đa 5MB.',
      'profile.choose_avatar': 'Chọn ảnh',
      'profile.choose_other_avatar': 'Chọn ảnh khác',
      'profile.deselect_avatar': 'Bỏ chọn',
      'profile.uploading_avatar': 'Đang tải ảnh...',
      'profile.update_avatar_only': 'Chỉ cập nhật ảnh',
      'profile.security_desc': 'Quản lý mật khẩu và các phiên đăng nhập của tài khoản.',
      'profile.login_password': 'Mật khẩu đăng nhập',
      'profile.password_advice':
        'Nên sử dụng mật khẩu có ít nhất 6 ký tự và không dùng chung với dịch vụ khác.',
      'profile.change_password': 'Đổi mật khẩu',
      'profile.new_password_placeholder': 'Nhập mật khẩu mới',
      'profile.hide_password': 'Ẩn mật khẩu',
      'profile.show_password': 'Hiện mật khẩu',
      'profile.min_6_chars': 'Tối thiểu 6 ký tự.',
      'profile.confirm_new_password': 'Xác nhận mật khẩu mới',
      'profile.confirm_new_password_placeholder': 'Nhập lại mật khẩu mới',
      'profile.passwords_do_not_match': 'Hai mật khẩu chưa khớp.',
      'profile.updating_password': 'Đang cập nhật...',
      'profile.update_password_btn': 'Cập nhật mật khẩu',
      'profile.login_sessions': 'Phiên đăng nhập',
      'profile.login_sessions_desc':
        'Đăng xuất tài khoản khỏi tất cả trình duyệt và thiết bị đang sử dụng.',
      'profile.delete_account_desc': 'Tài khoản sẽ bị khóa và bạn sẽ được đăng xuất ngay lập tức.',
      'profile.load_error': 'Không tải được hồ sơ',
      'profile.only_image_allowed': 'Chỉ được chọn tệp ảnh.',
      'profile.image_size_limit': 'Ảnh đại diện không được vượt quá 5MB.',
      'profile.update_success': 'Cập nhật hồ sơ thành công.',
      'profile.update_failed': 'Cập nhật thất bại',
      'profile.select_image_first': 'Hãy chọn ảnh trước.',
      'profile.avatar_update_success': 'Đổi ảnh đại diện thành công.',
      'profile.avatar_upload_failed': 'Upload avatar thất bại',
      'profile.logout_all_success': 'Đã đăng xuất khỏi tất cả thiết bị.',
      'profile.logout_failed': 'Đăng xuất thất bại',
      'profile.delete_confirm': 'Xóa tài khoản sẽ khóa tài khoản và đăng xuất ngay. Tiếp tục?',
      'profile.delete_success': 'Tài khoản đã được xóa.',
      'profile.delete_failed': 'Xóa tài khoản thất bại',
      'profile.password_min_length': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      'profile.passwords_not_match': 'Hai mật khẩu mới không khớp.',
      'profile.change_password_success': 'Đổi mật khẩu thành công.',
      'profile.change_password_failed': 'Đổi mật khẩu thất bại',

      // Common Toasts & Dialogs
      'common.success': 'Thành công',
      'common.error': 'Lỗi',
      'common.notice': 'Thông báo',
      'common.draft_saved': 'Lưu nháp',

      // Post Toasts
      'post.liked_success': 'Đã thích bài viết.',
      'post.unliked_success': 'Đã bỏ thích bài viết.',
      'post.like_error': 'Không thể cập nhật lượt thích',
      'post.bookmarked_success': 'Đã lưu bài viết.',
      'post.unbookmarked_success': 'Đã bỏ lưu bài viết.',
      'post.bookmark_error': 'Không thể cập nhật bookmark',
      'post.delete_confirm': 'Bạn có chắc chắn muốn xóa bài viết này?',

      // Comments & Reports Toasts
      'comments.empty_warning': 'Nội dung bình luận không được để trống.',
      'comments.max_length_warning': 'Bình luận tối đa 1000 ký tự.',
      'comments.submit_success': 'Đã gửi bình luận.',
      'comments.edit_success': 'Đã sửa bình luận.',
      'comments.submit_error': 'Gửi bình luận thất bại',
      'comments.edit_error': 'Sửa bình luận thất bại',
      'comments.delete_confirm': 'Xóa bình luận này?',
      'comments.delete_success': 'Đã xóa bình luận.',
      'comments.delete_error': 'Xóa bình luận thất bại',
      'report.max_length_warning': 'Mô tả báo cáo tối đa 1000 ký tự.',
      'report.submit_success': 'Đã gửi báo cáo tới bộ phận kiểm duyệt.',
      'report.submit_error': 'Gửi báo cáo thất bại',

      // Author & Auth Toasts
      'author.cannot_follow_self': 'Bạn không thể follow chính mình.',
      'author.followed_success': 'Đã follow tác giả.',
      'author.unfollowed_success': 'Đã bỏ follow.',
      'author.follow_error': 'Không thể cập nhật follow',
      'author.load_connections_error': 'Không tải được danh sách follow',
      'auth.login_required_toast': 'Vui lòng đăng nhập để thực hiện thao tác này.',
      'auth.login_fill_fields': 'Vui lòng điền đầy đủ thông tin đăng nhập.',
      'auth.login_success': 'Đăng nhập thành công!',
      'auth.register_fill_fields': 'Vui lòng điền đầy đủ thông tin đăng ký.',
      'auth.register_success': 'Tạo tài khoản thành công! Vui lòng đăng nhập.',
      'auth.forgot_enter_email': 'Vui lòng nhập email khôi phục.',
      'auth.reset_fill_fields': 'Vui lòng điền đầy đủ mã token và mật khẩu mới.',

      // Request Blog Owner Toasts
      'request_owner.enter_reason_warning': 'Vui lòng nhập lý do.',
      'request_owner.length_limit_warning': 'Lý do tối đa 1000 ký tự và chủ đề tối đa 500 ký tự.',
      'request_owner.submit_success': 'Đã gửi yêu cầu Blog Owner.',
      'request_owner.submit_error': 'Gửi yêu cầu thất bại',
      'request_owner.load_list_error': 'Không tải được danh sách yêu cầu',
      'request_owner.load_detail_error': 'Không tải được chi tiết',
      'request_owner.cancel_confirm': 'Hủy yêu cầu đang chờ duyệt này?',
      'request_owner.cancel_success': 'Đã hủy yêu cầu.',
      'request_owner.cancel_error': 'Hủy yêu cầu thất bại',

      // Post Form & Dashboard Toasts
      'post_form.enter_title_error': 'Vui lòng nhập tiêu đề bài gốc!',
      'post_form.enter_content_error': 'Vui lòng nhập nội dung bài gốc!',
      'post_form.publish_success': 'Đã xuất bản bài viết thành công!',
      'post_form.draft_success': 'Đã lưu bản nháp thành công!',
      'post_form.update_success': 'Đã cập nhật bài viết thành công!',
      'post_form.cancel_confirm':
        'Bạn có chắc muốn hủy các thay đổi? Giao diện sẽ quay lại Danh sách bài viết.',
    },
    EN: {
      ...OWNER_TRANSLATIONS_EN,
      'category.empty_posts': 'No Posts in this Category',
      'filter.oldest': 'Oldest',
      'filter.title_asc': 'Title A–Z',
      'comments.newest_first': 'Newest first',

      'comments.oldest_first': 'Oldest first',
      'categories.load_error': 'Unable to load categories.',

      'posts.load_error': 'Unable to load posts',

      'posts.empty': 'No matching posts found.',

      // Header & Nav
      'nav.posts': 'Posts',
      'nav.categories': 'Categories',
      'nav.hashtags': 'Hashtags',
      'nav.login': 'Log In',
      'nav.logout': 'Log Out',
      'nav.profile': 'Profile',
      'nav.request_owner': 'Request Blog Owner',
      'nav.owner_dashboard': 'Owner dashboard',
      'nav.moderator_dashboard': 'Moderator dashboard',
      'nav.admin_dashboard': 'Admin dashboard',
      'nav.toggle_theme': 'Toggle Theme',
      'nav.language': 'Language',
      'ui.community_label': 'Developer community',
      'auth.showcase_title': 'Write, share and learn together.',
      'auth.showcase_desc':
        'A calmer place for technical writing, useful discussions and ideas worth saving.',
      'auth.feature_stories': 'Technical stories',
      'auth.feature_community': 'Author community',
      'auth.feature_library': 'Personal library',
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

      'hashtag.list_subtitle': 'Choose a hashtag to view related articles.',

      'hashtag.selected_subtitle': 'Articles tagged with this hashtag.',

      'hashtag.back_to_all': 'All hashtags',

      'hashtag.related_posts': 'View related articles',

      'hashtag.search_tags_placeholder': 'Search hashtags...',

      'hashtag.search_posts_placeholder': 'Search posts in this hashtag...',

      'hashtag.load_error': 'Unable to load data',

      'hashtag.empty_tags': 'No matching hashtags found.',

      'hashtag.empty_posts': 'No matching articles found for this hashtag.',

      'common.retry': 'Try again',

      'common.clear_search': 'Clear search',
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
      'post.refreshing_language': 'Switching language...',

      // Comments
      'comments.title': 'Comments',
      'comments.placeholder': 'Write a comment...',
      'comments.submit': 'Submit Comment',
      'comments.reply': 'Reply',
      'comments.edit': 'Edit',
      'comments.delete': 'Delete',
      'comments.empty': 'No comments yet.',
      'comments.report': 'Report comment',

      'comments.load_error': 'Unable to load comments.',

      'common.backend_unreachable': 'Unable to connect to the server.',

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
      'pagination.current_page': 'Current page: ',
      'pagination.go_to_page': 'Go to page: ',

      // Footer
      'footer.copyright': '© 2026 Blogy. — Knowledge sharing community',
      'footer.inspired_by': 'Minimal · Refined · Readable',

      // Request Blog Owner
      'request_owner.title': 'Request Blog Owner Access',
      'request_owner.subtitle': 'Please provide your reason and intro for Moderator review.',
      'request_owner.reason_label': 'Reason for Application',
      'request_owner.reason_placeholder':
        'Share your experience and topics you want to write about...',
      'request_owner.submit_btn': 'Submit Request',

      // Dashboard Common & Sidebar
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Control panel & system stats',
      'dashboard.my_posts': 'My posts',
      'dashboard.create_post': 'Create post',
      'dashboard.mod_dashboard': 'Moderator dashboard',
      'dashboard.approve_posts': 'Approve posts',
      'dashboard.categories': 'Categories',
      'dashboard.comments': 'Comments',
      'dashboard.manage_reports': 'Violation reports',
      'dashboard.manage_users': 'Manage users',
      'dashboard.manage_languages': 'Manage languages',
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
      'post_form.draft_btn': 'Save draft',
      'post_form.update_btn': 'Update',
      'post_form.cancel_changes_btn': 'Cancel changes',
      'lang.vietnamese': 'Vietnamese',
      'lang.english': 'English',

      // Dashboard Pages & Quick Actions
      'dashboard.owner_title': 'Blog owner dashboard',
      'dashboard.owner_desc': 'Track views, posts, and reader engagement.',
      'dashboard.total_posts': 'Total posts',
      'dashboard.total_views': 'Total views',
      'dashboard.total_likes': 'Total likes',
      'dashboard.total_comments': 'Total comments',
      'dashboard.post_list': 'Post list',
      'dashboard.create_new_post': 'Write new post',
      'dashboard.edit_post': 'Edit post',
      'dashboard.mod_title': 'Moderator dashboard',
      'dashboard.mod_desc': 'Moderate articles, comments, and system categories.',
      'dashboard.admin_title': 'Super admin dashboard',
      'dashboard.admin_desc': 'Manage all users, system settings, and languages.',
      'dashboard.quick_actions': 'Quick actions',
      'dashboard.featured_posts': 'Featured articles',
      'dashboard.interaction_chart': 'Article engagement (past 7 days)',
      'dashboard.share_blog': 'Share blog page',
      'dashboard.view_history': 'View history',

      // Table Column Headers
      'table.post_title': 'Article / post',
      'table.author': 'Author',
      'table.category': 'Category',
      'table.created_at': 'Created date',
      'table.status': 'Status',
      'table.views': 'Views',
      'table.likes': 'Likes',
      'table.actions': 'Actions',
      'table.user_name': 'User',
      'table.user': 'User',
      'table.default': 'Default',
      'table.email': 'Email',
      'table.role': 'Role',
      'table.comment_content': 'Comment content',
      'table.reason': 'Report reason',
      'table.lang_code': 'Language code',
      'table.lang_name': 'Language name',
      'table.is_default': 'Is default',

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
      'modal.add_user_title': 'Add new user',
      'modal.add_lang_title': 'Add system language',
      'modal.add_language_title': 'Add system language',
      'modal.delete_confirm': 'Are you sure you want to delete this record?',
      'modal.preview_blog_p1':
        'This is sample article content for the Moderator to read and evaluate before approving.',
      'modal.preview_blog_p2':
        'Carefully review content before deciding to approve or reject the post.',
      'modal.preview_blog_h1': '1. Why is this feature important?',
      'modal.preview_blog_p3':
        'Moderation ensures that the Blogy. platform always maintains the highest content quality.',
      'modal.preview_blog_h2': '2. Article formatting requirements',
      'modal.preview_blog_li1': 'Title must be clear and not clickbait.',
      'modal.preview_blog_li2': 'Content must not contain hate speech or spam.',
      'modal.preview_blog_li3': 'Code snippets must be properly enclosed in Code blocks.',
      'modal.preview_cat_post': 'Demo article for category',
      'modal.preview_comment_p1':
        'This is sample article content linked to this comment. Moderators can quickly read the context here when handling comments.',
      'modal.preview_comment_p2':
        'Example: A comment may look unclear on its own, but makes complete sense in the context of the article.',

      'author.default_bio': 'No bio available.',
      'author.posts': 'posts',
      'author.joined': 'Joined',
      'author.posts_by': 'Posts by',
      'author.empty_posts': 'This author has no posts.',
      'author.not_found': 'Author not found.',
      'author.load_error': 'Unable to load author info.',
      'common.back_home': 'Back to Home',
      'common.view': 'View',

      'auth.step_request': 'Request Reset',
      'auth.step_reset': 'Reset Password',
      'auth.request_desc':
        'Enter your registered email address. The system will send a reset link/code to you.',
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
      'status.active': 'Active',
      'status.locked': 'Locked',
      'status.deleted': 'Deleted',
      'status.approved': 'Approved',
      'status.rejected': 'Rejected',
      'status.published': 'Published',
      'status.draft': 'Draft',
      'status.inactive': 'Inactive',
      'status.resolved': 'Resolved',
      'status.pending_review': 'Pending review',

      'posts.status.draft': 'Draft',
      'posts.status.pending': 'Pending review',
      'posts.status.published': 'Published',
      'posts.status.rejected': 'Rejected',
      'posts.status.archived': 'Archived',

      'filter.status.pending': 'Pending',
      'filter.status.pending_review': 'Pending review',
      'filter.status.published': 'Published',
      'filter.status.rejected': 'Rejected',
      'filter.status.resolved': 'Resolved',
      'filter.status.all': 'All statuses',
      'filter.status.draft': 'Draft',

      'dropdown.select_multiple': 'Select items...',
      'dropdown.select_single': 'Select an option...',
      'dropdown.selected_count': '{count} selected',
      'search.placeholder': 'Search...',

      'users.role_all': 'All roles',
      'users.all_roles': 'All roles',
      'users.all_statuses': 'All statuses',
      'status.active_title': 'Active',
      'status.locked_title': 'Locked',

      'role.normal': 'Normal user',
      'role.blog_owner': 'Blog owner',
      'role.content_moderator': 'Content moderator',
      'role.super_admin': 'Super admin',
      'role.NORMAL': 'Normal user',
      'role.BLOG_OWNER': 'Blog owner',
      'role.CONTENT_MODERATOR': 'Content moderator',
      'role.SUPER_ADMIN': 'Super admin',

      'users.total_users': 'Total',
      'users.users_unit': 'users',
      'users.create_mod_title': 'Create content moderator',
      'users.mod_password': 'Password',
      'users.min_6_chars': 'At least 6 characters...',
      'users.bio_optional': 'Bio (Optional)',
      'users.bio_placeholder_example': 'e.g. Technology content moderator...',
      'users.user_detail_title': 'User details:',
      'users.loading_detail': 'Loading user details & posts...',
      'users.joined_date': 'Joined date',
      'users.lock_reason_heading': 'Account lock reason:',
      'users.author_posts_list': 'Posts published by author',
      'users.no_posts_in_system': 'This user has no published posts in the system.',
      'users.views_count': 'views',
      'users.likes_count': 'likes',
      'users.comments_count': 'comments',
      'users.change_role_modal_title': 'Change user role',
      'users.select_new_role_desc': 'Select a new role for account',
      'users.update_role_submit': 'Update role',

      'languages.empty_list': 'No languages found.',

      'moderator.loading_dashboard': 'Loading Moderator Dashboard data...',
      'moderator.forbidden_title': 'Access Denied (403 Forbidden)',
      'moderator.error_title': 'Unable to load Dashboard data',
      'moderator.test_account_guide': 'Moderator Test Account Guide:',
      'moderator.test_account_dashboard_desc': 'According to Backend API policy, only accounts with the CONTENT_MODERATOR role can call /api/v1/moderator/dashboard.',
      'moderator.test_account_blog_desc': 'Only accounts with the CONTENT_MODERATOR role can view post moderation list.',
      'moderator.test_account_report_desc': 'Only accounts with the CONTENT_MODERATOR role can access report moderation list.',
      'moderator.sample_account': 'Sample Moderator Account:',
      'moderator.logout_and_switch': 'Logout & Login as Moderator',
      'moderator.pending_review_posts_desc': 'PENDING_REVIEW posts',
      'moderator.pending_reports': 'Pending Reports',
      'moderator.processed_today': 'Processed Today',
      'moderator.active_category_groups': 'Active Category Groups',
      'moderator.last_7_days': 'Last 7 days',
      'moderator.approve_blogs_action': 'Approve Posts',
      'moderator.handle_reports_action': 'Process Reports',
      'moderator.manage_categories_action': 'Manage Categories',
      'moderator.approve_author_requests_action': 'Approve Author Requests',
      'moderator.report_reason_stats': 'Report Reason Statistics',
      'moderator.report_status_stats': 'Report Status Statistics',
      'moderator.posts_unit': 'posts',
      'moderator.reports_unit': 'reports',
      'moderator.comments_unit': 'comments',
      'moderator.search_blog_placeholder': 'Search post title...',
      'moderator.loading_blogs': 'Loading post list...',
      'moderator.cannot_load_blogs': 'Unable to load post list',
      'moderator.no_blogs_title': 'No posts found',
      'moderator.no_blogs_desc': 'No posts match the current filter criteria.',
      'moderator.id_and_title': 'ID & title',
      'moderator.lang_and_cat': 'Language / category',
      'moderator.created_at': 'Created at',
      'moderator.showing': 'Showing',
      'moderator.reject_blog_confirm_prefix': 'Reject post:',
      'moderator.loading_reports': 'Loading violation report list...',
      'moderator.cannot_load_reports': 'Unable to load report list',
      'moderator.no_reports_title': 'No reports found',
      'moderator.no_reports_desc': 'No violation reports match the current filter criteria.',
      'moderator.id_and_target': 'ID & target',
      'moderator.reporter': 'Reporter',
      'moderator.reported_content': 'Reported content',
      'moderator.violation_reason': 'Violation reason',
      'moderator.loading_report_detail': 'Loading report detail data...',
      'moderator.report_detail_title': 'Violation report details:',
      'moderator.report_reason_label': 'Report reason:',
      'moderator.status_label': 'Status:',
      'moderator.detailed_desc_from_reporter': 'Detailed description from reporter:',
      'moderator.reviewed_by': 'Reviewed by:',
      'moderator.reviewed_at': 'Reviewed at:',
      'moderator.resolution_note_label': 'Resolution note:',
      'moderator.reported_post_title': 'Reported post',
      'moderator.reported_comment_title': 'Reported comment',
      'moderator.commenter': 'Comment author:',
      'moderator.reply_context': 'Parent Comment (Reply context):',
      'moderator.post_context': 'Post context containing comment:',
      'moderator.post_author': 'Post author:',
      'moderator.confirm_violation_modal_title': 'Confirm violation report',
      'moderator.confirm_violation_desc_prefix': 'You are processing report',
      'moderator.confirm_violation_desc_suffix': '. This action will automatically hide the reported content from the system.',
      'moderator.resolution_note_placeholder': 'Enter violation resolution note...',
      'moderator.confirm_and_hide_content': 'Confirm & hide content',
      'moderator.reject_report_modal_title': 'Reject violation report',
      'moderator.reject_report_desc_prefix': 'You are rejecting report',
      'moderator.reject_report_desc_suffix': '. The reported content will remain untouched on the system.',
      'moderator.reject_reason_label': 'Rejection reason (Max 1000 chars)',
      'moderator.reject_reason_placeholder': 'Enter rejection reason...',
      'moderator.confirm_reject': 'Confirm rejection',
      'moderator.target_all': 'All targets',
      'moderator.target_post': 'Post',
      'moderator.target_comment': 'Comment',
      'moderator.reason_all': 'All reasons',

      'report.reason.SPAM': 'Spam / advertising',
      'report.reason.HARASSMENT': 'Harassment / bullying',
      'report.reason.INAPPROPRIATE': 'Inappropriate content',
      'report.reason.COPYRIGHT': 'Copyright infringement',
      'report.reason.MISINFORMATION': 'Misinformation',
      'report.reason.OTHER': 'Other reason',

      'action.view': 'View',
      'action.approve': 'Approve',
      'action.reject': 'Reject',
      'action.resolve': 'Resolve',
      'action.edit': 'Edit',
      'action.lock': 'Lock',
      'action.unlock': 'Unlock',
      'action.delete': 'Delete',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.close': 'Close',
      'action.retry': 'Retry',
      'action.create': 'Create',
      'action.edit_user_title': 'Update user information',
      'action.lock_user_title': 'Lock user account',
      'action.unlock_user_title': 'Unlock user account',
      'action.delete_user_title': 'Soft delete user',

      'users.search_placeholder': 'Search username or email...',
      'users.clear_filters': 'Clear filters',
      'users.loading': 'Loading users...',
      'users.empty': 'No users match the current search criteria.',
      'users.edit_title': 'Update user information',
      'users.bio_label': 'Bio',
      'users.bio_placeholder': 'Enter a new bio...',
      'users.avatar_url_label': 'Avatar URL',
      'users.new_password_optional': 'New password (Optional)',
      'users.password_placeholder': 'Leave blank to keep the current password',
      'users.lock_title': 'Lock user account',
      'users.lock_description_before': 'You are about to lock the account',
      'users.lock_description_after': "All of this user's active sessions will be revoked.",
      'users.lock_reason_label': 'Reason for locking the account',
      'users.lock_reason_placeholder': 'Enter a detailed reason...',
      'users.confirm_lock': 'Confirm lock',

      'admin_dashboard.refresh': 'Refresh',
      'admin_dashboard.loading': 'Loading dashboard data...',
      'admin_dashboard.in_7_days': 'in the past 7 days',
      'admin_dashboard.creator_accounts': 'Content creator accounts',
      'admin_dashboard.posts': 'posts',
      'admin_dashboard.owner_requests': 'Blog Owner requests',
      'admin_dashboard.awaiting_review': 'Awaiting review',
      'admin_dashboard.daily_growth_desc': 'New accounts created each day',
      'admin_dashboard.seven_day_total': '7-day total',
      'admin_dashboard.review_requests': 'Review requests',
      'admin_dashboard.language_distribution_desc': 'Percentage of posts by language',
      'admin_dashboard.language_details': 'Language details',
      'admin_dashboard.sorted_by_posts': 'Sorted by number of posts',
      'admin_dashboard.languages': 'languages',
      'admin_dashboard.no_language_data': 'No language data available',
      'admin_dashboard.new_users': 'new users',
      'admin_dashboard.invalid_data': 'The dashboard returned invalid data.',
      'admin_dashboard.load_error': 'Unable to load the admin dashboard.',
      'admin_dashboard.growth_chart_label': 'User growth chart',
      'admin_dashboard.language_chart_label': 'Posts by language chart',

      'requests.title': 'Review Blog Owner requests',
      'requests.subtitle': 'Review user requests to become authors on the platform.',
      'requests.pending': 'Pending',
      'requests.approved': 'Approved',
      'requests.rejected': 'Rejected',
      'requests.all': 'All',
      'requests.loading': 'Loading requests...',
      'requests.user_id': 'User ID',
      'requests.reason_topics': 'Reason & proposed topics',
      'requests.actions_review': 'Actions / review information',
      'requests.empty': 'No Blog Owner requests match the selected filter.',
      'requests.topics': 'Topics',
      'requests.approve': 'Approve',
      'requests.reject': 'Reject',
      'requests.reviewed_at': 'Reviewed at',
      'requests.by_reviewer': 'By reviewer',
      'requests.rejection_reason': 'Rejection reason',
      'requests.total': 'Total',
      'requests.items': 'requests',
      'requests.reject_modal_title': 'Reject Blog Owner request',
      'requests.reject_confirm': 'Are you sure you want to reject the request from',
      'requests.rejection_reason_label': 'Rejection reason (Optional, up to 1,000 characters)',
      'requests.rejection_placeholder': 'Enter feedback for the user...',
      'requests.confirm_reject': 'Confirm rejection',
      'requests.load_error': 'Failed to load requests',
      'requests.approve_confirm': 'Approve Blog Owner access for request',
      'requests.approve_modal_title': 'Approve request',
      'requests.confirm_approve': 'Confirm approval',
      'requests.approve_success': 'Request approved successfully',
      'requests.approve_error': 'Failed to approve request',
      'requests.reject_success': 'Request rejected',
      'requests.reject_error': 'Failed to reject request',

      'users.grant_owner': 'Grant access',
      'users.revoke_owner': 'Revoke access',
      'users.lock_user': 'Lock user',
      'users.unlock_user': 'Unlock',
      'users.soft_delete': 'Soft delete',
      'users.restore': 'Restore',
      'users.confirm_delete': 'Are you sure you want to soft delete user',
      'users.confirm_unlock': 'Are you sure you want to unlock the account',
      'users.delete_confirm_title': 'Soft delete user',
      'users.unlock_confirm_title': 'Unlock account',
      'users.confirm_restore': 'Are you sure you want to restore this user?',
      'users.temp_password': 'Temporary password',
      'users.temp_password_placeholder': 'Enter password for Moderator',
      'users.temp_password_hint': 'Moderator can change this password after logging in.',
      'users.note_label': 'Note (Optional)',
      'users.note_placeholder': 'e.g., In charge of Backend moderation...',
      'users.user_info_title': 'User information',
      'users.recent_posts': 'Recent posts',
      'users.no_posts_hint': 'This user has no posts or does not have blog writing permissions.',

      'languages.country_flag': 'Country (flag)',
      'languages.display_name': 'Display name',
      'languages.code_placeholder': 'e.g., vi, en, fr...',
      'languages.name_placeholder': 'e.g., Vietnamese',
      'languages.set_default': 'Set as default language',
      'languages.activate_now': 'Activate now',
      'languages.delete_confirm_title': 'Delete system language',
      'languages.delete_confirm': 'Are you sure you want to delete language',

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
      'nav.library': 'Saved & liked posts',
      'nav.connections': 'Connections',

      'common.save': 'Save changes',
      'common.saving': 'Saving...',
      'common.sending': 'Sending...',
      'common.detail': 'Details',

      'library.title': 'My library',
      'library.subtitle': 'Posts you bookmarked or liked.',
      'library.bookmarks': 'Bookmarks',
      'library.likes': 'Likes',
      'library.empty_bookmarks': 'You have not bookmarked any posts.',
      'library.empty_likes': 'You have not liked any posts.',

      'connections.title': 'My connections',
      'connections.subtitle': 'Your followers and the people you follow.',
      'connections.followers': 'Followers',
      'connections.following': 'Following',
      'connections.empty': 'No connection data yet.',
      'connections.follows_you': 'Follows you',
      'connections.you_are_following': 'Following',
      'connections.no_connection': 'No connection',
      'connections.user_id': 'User ID',

      'profile.followers': 'Recent followers',
      'profile.edit_hint': 'Username, email, role and status are managed by the system.',
      'profile.new_password': 'New password',
      'profile.password_placeholder': 'Leave blank to keep the current password',
      'profile.avatar': 'Avatar',
      'profile.avatar_hint': 'JPG/PNG/WebP image, up to 5MB.',
      'profile.upload_avatar_only': 'Upload avatar only',
      'profile.security': 'Security and account',
      'profile.logout_all': 'Log out all devices',
      'profile.delete_account': 'Delete account',

      'request_owner.topics_label': 'Planned topics',
      'request_owner.topics_placeholder': 'For example: NestJS, Angular, PostgreSQL...',
      'request_owner.already_owner': 'Your account is already a BLOG_OWNER.',
      'request_owner.reviewed_at': 'Reviewed at',
      'request_owner.rejection_reason': 'Rejection reason',
      'request_owner.history': 'Request history',
      'request_owner.all_statuses': 'All statuses',
      'request_owner.empty': 'You have no Blog Owner requests.',

      'post.unlike': 'Unlike',
      'post.unsave': 'Remove bookmark',
      'post.report': 'Report post',

      'comments.replying_to': 'Replying to',
      'comments.editing': 'Editing comment',
      'comments.save_edit': 'Save edit',
      'comments.login_required': 'Log in to comment and interact.',

      'report.reason': 'Report reason',
      'report.description': 'Additional details',
      'report.submit': 'Submit report',

      'author.follow': 'Follow',
      'author.unfollow': 'Unfollow',

      // Profile Extended & Toasts
      'profile.new_avatar_title': 'Choose a new avatar',
      'profile.avatar_limit_hint': 'JPG, PNG or WebP. Maximum size 5MB.',
      'profile.choose_avatar': 'Select image',
      'profile.choose_other_avatar': 'Select another image',
      'profile.deselect_avatar': 'Deselect',
      'profile.uploading_avatar': 'Uploading image...',
      'profile.update_avatar_only': 'Update avatar only',
      'profile.security_desc': 'Manage your password and active account sessions.',
      'profile.login_password': 'Login password',
      'profile.password_advice': 'Should use a password with at least 6 characters.',
      'profile.change_password': 'Change password',
      'profile.new_password_placeholder': 'Enter new password',
      'profile.hide_password': 'Hide password',
      'profile.show_password': 'Show password',
      'profile.min_6_chars': 'Minimum 6 characters.',
      'profile.confirm_new_password': 'Confirm new password',
      'profile.confirm_new_password_placeholder': 'Re-enter new password',
      'profile.passwords_do_not_match': 'Passwords do not match.',
      'profile.updating_password': 'Updating...',
      'profile.update_password_btn': 'Update password',
      'profile.login_sessions': 'Login sessions',
      'profile.login_sessions_desc': 'Log out of your account on all browsers and active devices.',
      'profile.delete_account_desc': 'Your account will be locked and logged out immediately.',
      'profile.load_error': 'Unable to load profile',
      'profile.only_image_allowed': 'Only image files are allowed.',
      'profile.image_size_limit': 'Avatar image cannot exceed 5MB.',
      'profile.update_success': 'Profile updated successfully.',
      'profile.update_failed': 'Profile update failed',
      'profile.select_image_first': 'Please select an image first.',
      'profile.avatar_update_success': 'Avatar updated successfully.',
      'profile.avatar_upload_failed': 'Avatar upload failed',
      'profile.logout_all_success': 'Logged out from all devices successfully.',
      'profile.logout_failed': 'Logout failed',
      'profile.delete_confirm':
        'Deleting account will lock it and log you out immediately. Continue?',
      'profile.delete_success': 'Account deleted successfully.',
      'profile.delete_failed': 'Account deletion failed',
      'profile.password_min_length': 'New password must be at least 6 characters.',
      'profile.passwords_not_match': 'New passwords do not match.',
      'profile.change_password_success': 'Password changed successfully.',
      'profile.change_password_failed': 'Password change failed',

      // Common Toasts & Dialogs
      'common.success': 'Success',
      'common.error': 'Error',
      'common.notice': 'Notice',
      'common.draft_saved': 'Draft Saved',

      // Post Toasts
      'post.liked_success': 'Liked article.',
      'post.unliked_success': 'Unliked article.',
      'post.like_error': 'Unable to update like',
      'post.bookmarked_success': 'Bookmarked article.',
      'post.unbookmarked_success': 'Removed bookmark.',
      'post.bookmark_error': 'Unable to update bookmark',
      'post.delete_confirm': 'Are you sure you want to delete this post?',

      // Comments & Reports Toasts
      'comments.empty_warning': 'Comment content cannot be empty.',
      'comments.max_length_warning': 'Comment maximum 1000 characters.',
      'comments.submit_success': 'Comment submitted.',
      'comments.edit_success': 'Comment updated.',
      'comments.submit_error': 'Failed to submit comment',
      'comments.edit_error': 'Failed to edit comment',
      'comments.delete_confirm': 'Delete this comment?',
      'comments.delete_success': 'Comment deleted.',
      'comments.delete_error': 'Failed to delete comment',
      'report.max_length_warning': 'Report description maximum 1000 characters.',
      'report.submit_success': 'Report submitted to moderation.',
      'report.submit_error': 'Failed to submit report',

      // Author & Auth Toasts
      'author.cannot_follow_self': 'You cannot follow yourself.',
      'author.followed_success': 'Followed author.',
      'author.unfollowed_success': 'Unfollowed author.',
      'author.follow_error': 'Unable to update follow',
      'author.load_connections_error': 'Unable to load follow list',
      'auth.login_required_toast': 'Please log in to perform this action.',
      'auth.login_fill_fields': 'Please fill in all login fields.',
      'auth.login_success': 'Logged in successfully!',
      'auth.register_fill_fields': 'Please fill in all registration fields.',
      'auth.register_success': 'Account created successfully! Please log in.',
      'auth.forgot_enter_email': 'Please enter your recovery email.',
      'auth.reset_fill_fields': 'Please fill in token code and new password.',

      // Request Blog Owner Toasts
      'request_owner.enter_reason_warning': 'Please enter a reason.',
      'request_owner.length_limit_warning': 'Reason max 1000 chars and topics max 500 chars.',
      'request_owner.submit_success': 'Blog Owner request submitted.',
      'request_owner.submit_error': 'Failed to submit request',
      'request_owner.load_list_error': 'Unable to load request list',
      'request_owner.load_detail_error': 'Unable to load details',
      'request_owner.cancel_confirm': 'Cancel this pending request?',
      'request_owner.cancel_success': 'Request cancelled.',
      'request_owner.cancel_error': 'Failed to cancel request',

      // Post Form & Dashboard Toasts
      'post_form.enter_title_error': 'Please enter original article title!',
      'post_form.enter_content_error': 'Please enter original article content!',
      'post_form.publish_success': 'Article published successfully!',
      'post_form.draft_success': 'Draft saved successfully!',
      'post_form.update_success': 'Article updated successfully!',
      'post_form.cancel_confirm': 'Are you sure you want to cancel changes? Returns to post list.',
    },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app_lang');
      if (savedLang?.trim()) {
        this.currentLang.set(savedLang.trim().toUpperCase());
      }
    }
  }

  setLanguage(lang: SupportedLang) {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_lang', lang);
    }
  }

  /**
   * Load active UI languages from the shared API. Both the public header and
   * every dashboard role consume this single cached source.
   */
  loadLanguages(force = false): void {
    if ((this.languagesRequested || this.languagesLoading()) && !force) {
      return;
    }

    this.languagesRequested = true;
    this.languagesLoading.set(true);
    this.languagesLoadError.set(false);

    this.getLanguagesFromApi()
      .subscribe({
        next: (languages) => {
          const apiLanguages = (languages || [])
            .map((language): LanguageOption => ({
              id: language.id,
              code: language.code.trim().toUpperCase(),
              name: language.name,
              flag: this.toFlagEmoji(language.flag),
              isDefault: language.isDefault,
            }));

          if (apiLanguages.length > 0) {
            this.languages.set(apiLanguages);
          } else if (this.languages().length === 0) {
            this.languages.set(DEFAULT_LANGUAGES);
          }
          this.languagesLoading.set(false);

          const currentLangs = this.languages();
          if (!currentLangs.some((language) => language.code === this.currentLang())) {
            const defaultLanguage = currentLangs.find(
              (language) => language.isDefault,
            );
            const nextLanguage = defaultLanguage?.code.trim().toUpperCase();

            if (nextLanguage) {
              this.setLanguage(nextLanguage);
            } else if (currentLangs[0]) {
              this.setLanguage(currentLangs[0].code);
            }
          }
        },
        error: () => {
          if (this.languages().length === 0) {
            this.languages.set(DEFAULT_LANGUAGES);
          }
          this.languagesLoading.set(false);
          this.languagesLoadError.set(true);
        },
      });
  }

  private getLanguagesFromApi(): Observable<ApiLanguageRecord[]> {
    return this.http
      .get<ApiResponse<ApiLanguageRecord[]>>(`${this.apiUrl}/languages`)
      .pipe(map((response) => response?.data ?? []));
  }

  currentLanguageOption(): LanguageOption | undefined {
    return this.languages().find((language) => language.code === this.currentLang());
  }

  private toFlagEmoji(flag: string | null): string {
    const value = flag?.trim() ?? '';
    if (!/^[a-zA-Z]{2}$/.test(value)) {
      return value || '🌐';
    }

    return [...value.toUpperCase()]
      .map((character) => String.fromCodePoint(character.charCodeAt(0) + 127397))
      .join('');
  }

  translate(key: string): string {
    const lang = this.currentLang();
    return this.translations[lang]?.[key] || this.translations['VI']?.[key] || key;
  }
}

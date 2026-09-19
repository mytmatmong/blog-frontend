import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { PostCard, PostItem } from './post-card';
import { PostInteractionService } from '../../../core/services/post-interaction.service';

describe('PostCard', () => {
  let component: PostCard;
  let fixture: ComponentFixture<PostCard>;

  const mockInteractions = {
    isLiked: vi.fn().mockReturnValue(false),
    isBookmarked: vi.fn().mockReturnValue(false),
    isLoadingState: vi.fn().mockReturnValue(false),
    isBusy: vi.fn().mockReturnValue(false),
    ensureLoaded: vi.fn(),
    toggleLike: vi.fn().mockReturnValue(of({ active: true })),
    toggleBookmark: vi.fn().mockReturnValue(of({ active: true })),
  };

  const basePost: PostItem = {
    id: 200,
    parentPostId: 100,
    authorId: 1,
    title: 'Bản dịch tiếng Anh',
    excerpt: '',
    authorName: 'admin',
    authorAvatar: 'A',
    authorAvatarUrl: null,
    timeAgo: '',
    readTime: '',
    categories: [],
    tags: [],
    likes: 3,
    views: 10,
    comments: 0,
    thumbnailUrl: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [PostCard],
      providers: [
        {
          provide: PostInteractionService,
          useValue: mockInteractions,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostCard);
    component = fixture.componentInstance;
    component.post = basePost;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Bug thật đã gặp: PostCard hiển thị bản dịch (id=200, parentPostId=100)
   * nhưng check "đã thích chưa" bằng đúng id đang xem — vì like luôn
   * được backend lưu vào bài GỐC (id=100), check này luôn ra false dù
   * người dùng đã thích bài ở ngôn ngữ khác. PostCard phải dùng
   * parentPostId ?? id (rootId) cho mọi lệnh gọi tương tác.
   */
  it('should check "liked" state using the group root id, not the translation id being displayed', () => {
    component.isLiked();

    expect(mockInteractions.isLiked).toHaveBeenCalledWith(100);
    expect(mockInteractions.isLiked).not.toHaveBeenCalledWith(200);
  });

  it('should check "bookmarked" state using the group root id', () => {
    component.isBookmarked();

    expect(mockInteractions.isBookmarked).toHaveBeenCalledWith(100);
  });

  it('should toggle like using the group root id', () => {
    component.requestLikeAction();

    expect(mockInteractions.toggleLike).toHaveBeenCalledWith(100);
  });

  it('should toggle bookmark using the group root id', () => {
    component.requestBookmarkAction();

    expect(mockInteractions.toggleBookmark).toHaveBeenCalledWith(100);
  });

  it('should fall back to its own id as root when the post has no parentPostId (it is already the root)', () => {
    component.post = { ...basePost, id: 100, parentPostId: null };

    component.isLiked();

    expect(mockInteractions.isLiked).toHaveBeenCalledWith(100);
  });
});

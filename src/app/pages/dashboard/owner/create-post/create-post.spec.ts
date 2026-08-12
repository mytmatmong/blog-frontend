import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BlogOwnerApiService } from '../../../../core/services/blog-owner-api.service';
import { CreatePost } from './create-post';

describe('CreatePost', () => {
  let component: CreatePost;
  let fixture: ComponentFixture<CreatePost>;

  beforeEach(async () => {
    const apiMock = {
      getOptions: () =>
        of({
          success: true as const,
          statusCode: 200,
          data: {
            languages: [
              {
                id: 26,
                code: 'vi',
                name: 'Tiếng Việt',
                flag: '🇻🇳',
                isDefault: true,
                isActive: true,
              },
              {
                id: 27,
                code: 'en',
                name: 'English',
                flag: '🇬🇧',
                isDefault: false,
                isActive: true,
              },
            ],
            categories: [],
            tags: [],
          },
          timestamp: '2026-08-05T00:00:00.000Z',
        }),
    };

    await TestBed.configureTestingModule({
      imports: [CreatePost],
      providers: [
        {
          provide: BlogOwnerApiService,
          useValue: apiMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePost);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('must exclude the original language from translation options', () => {
    expect(component.availableTranslationLanguages().map((item) => item.id)).toEqual([27]);
  });
});

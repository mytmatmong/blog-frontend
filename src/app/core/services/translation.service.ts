import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import viTranslations from '../i18n/locales/vi.json';
import enTranslations from '../i18n/locales/en.json';
import zhTranslations from '../i18n/locales/zh.json';
import jaTranslations from '../i18n/locales/ja.json';

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
  { id: 3, code: 'ZH', name: '中文', flag: '🇨🇳', isDefault: false },
  { id: 4, code: 'JA', name: '日本語', flag: '🇯🇵', isDefault: false },
];

const LOCALE_TAGS: Record<string, string> = {
  VI: 'vi-VN',
  EN: 'en-US',
  ZH: 'zh-CN',
  JA: 'ja-JP',
};

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

  /**
   * Single source of truth for every UI-language dictionary: one JSON file
   * per language under core/i18n/locales/. There is no separate "owner"
   * dictionary or per-feature dictionary — every translatable string in the
   * app goes through translate() / the `| translate` pipe against one of
   * these four files, so adding a language means adding one JSON file here,
   * not touching call sites scattered across the codebase.
   */
  private readonly translations: Record<string, Record<string, string>> = {
    VI: viTranslations,
    EN: enTranslations,
    ZH: zhTranslations,
    JA: jaTranslations,
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

  /**
   * BCP-47 locale tag for the current UI language, for Intl/toLocale* calls
   * (date formatting, DisplayNames, etc.) so those call sites don't each
   * hardcode their own VI/EN-only branch.
   */
  localeTag(): string {
    return LOCALE_TAGS[this.currentLang()] ?? LOCALE_TAGS['VI'];
  }
}

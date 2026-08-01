import { Component, AfterViewInit, signal, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

declare var Quill: any;

interface LangData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-create-post',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePost implements AfterViewInit {
  quill: any;

  originalLanguage = signal<'VI' | 'EN'>('VI');
  currentEditLang = signal<'VI' | 'EN'>('VI');

  postLangData: Record<'VI' | 'EN', LangData> = {
    VI: { title: '', content: '' },
    EN: { title: '', content: '' }
  };

  titleModel = '';
  hashtags = '#nodejs #angular';

  categories = [
    { id: 'catBackend', label: 'Backend', checked: true },
    { id: 'catFrontend', label: 'Frontend', checked: false },
    { id: 'catDatabase', label: 'Database', checked: false },
    { id: 'catAngular', label: 'Angular', checked: false },
    { id: 'catNodeJS', label: 'NodeJS', checked: false },
  ];

  private toastService = inject(ToastService);
  protected readonly ts = inject(TranslationService);

  constructor() {
    // Listen for language switch to preserve and load content
    effect(() => {
      const lang = this.currentEditLang();
    });
  }

  ngAfterViewInit() {
    this.initQuill();
  }

  initQuill() {
    if (typeof Quill !== 'undefined') {
      this.quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: this.ts.translate('post_form.editor_placeholder'),
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image', 'video'],
            ['clean']
          ]
        }
      });
      this.quill.root.innerHTML = this.postLangData[this.currentEditLang()].content;
    }
  }

  changeEditLang(lang: 'VI' | 'EN') {
    const prevLang = this.currentEditLang();
    if (prevLang === lang) return;

    // Save previous
    this.postLangData[prevLang].title = this.titleModel;
    if (this.quill) {
      this.postLangData[prevLang].content = this.quill.root.innerHTML;
    }

    // Set new
    this.currentEditLang.set(lang);
    this.titleModel = this.postLangData[lang].title;
    if (this.quill) {
      this.quill.root.innerHTML = this.postLangData[lang].content || '';
    }
  }

  changeOriginalLanguage(lang: 'VI' | 'EN') {
    this.originalLanguage.set(lang);
  }

  handleSave(status: 'PUBLISHED' | 'DRAFT') {
    // Save current active tab data
    const activeLang = this.currentEditLang();
    this.postLangData[activeLang].title = this.titleModel;
    if (this.quill) {
      this.postLangData[activeLang].content = this.quill.root.innerHTML;
    }

    const origLang = this.originalLanguage();
    const mainTitle = this.postLangData[origLang].title.trim();
    const mainContent = this.postLangData[origLang].content.trim();

    if (!mainTitle) {
      this.toastService.error(this.ts.translate('post_form.enter_title_error'), this.ts.translate('common.error'));
      return;
    }
    if (mainContent === '<p><br></p>' || mainContent === '') {
      this.toastService.error(this.ts.translate('post_form.enter_content_error'), this.ts.translate('common.error'));
      return;
    }

    const checkedCats = this.categories.filter(c => c.checked).map(c => c.label);

    const postData = {
      originalLanguage: origLang,
      translations: this.postLangData,
      categories: checkedCats,
      hashtags: this.hashtags,
      status: status
    };

    console.log("🚀 Dữ liệu bài viết mới:", postData);

    if (status === 'PUBLISHED') {
      this.toastService.success(this.ts.translate('post_form.publish_success'), this.ts.translate('common.success'));
    } else {
      this.toastService.info(this.ts.translate('post_form.draft_success'), this.ts.translate('common.draft_saved'));
    }
  }
}

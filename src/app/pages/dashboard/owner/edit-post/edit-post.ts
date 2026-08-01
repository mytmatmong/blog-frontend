import { Component, AfterViewInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

declare var Quill: any;

interface LangData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-edit-post',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './edit-post.html',
  styleUrl: './edit-post.css',
})
export class EditPost implements AfterViewInit {
  protected readonly ts = inject(TranslationService);
  private router = inject(Router);

  quill: any;

  originalLanguage = signal<'VI' | 'EN'>('VI');
  currentEditLang = signal<'VI' | 'EN'>('VI');

  postLangData: Record<'VI' | 'EN', LangData> = {
    VI: {
      title: "Thiết kế Blog đa ngôn ngữ",
      content: `
        <h2>1. Vấn đề đặt ra</h2>
        <p>Khi xây dựng một hệ thống bài viết hỗ trợ nhiều ngôn ngữ, chúng ta cần cân nhắc cấu trúc Database sao cho tối ưu nhất.</p>
      `
    },
    EN: {
      title: "Designing a Multi-language Blog",
      content: `
        <h2>1. The Problem</h2>
        <p>When building a multi-language blog, we need to consider the Database structure.</p>
      `
    }
  };

  titleModel = '';
  hashtags = "#mysql #i18n #backend";
  thumbnailName = "blog-banner-vn.jpg";
  videoName: string | null = null;

  categories = [
    { id: 'catBackend', label: 'Backend', checked: true },
    { id: 'catFrontend', label: 'Frontend', checked: false },
    { id: 'catDatabase', label: 'Database', checked: true },
    { id: 'catAngular', label: 'Angular', checked: false },
    { id: 'catNodeJS', label: 'NodeJS', checked: false },
  ];

  toastMsg = signal<string>('');
  toastType = signal<'success' | 'danger' | 'secondary'>('success');
  showToast = signal<boolean>(false);

  constructor() {
    this.titleModel = this.postLangData[this.currentEditLang()].title;
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

  triggerToast(msg: string, type: 'success' | 'danger' | 'secondary') {
    this.toastMsg.set(msg);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  handleUpdate() {
    const activeLang = this.currentEditLang();
    this.postLangData[activeLang].title = this.titleModel;
    if (this.quill) {
      this.postLangData[activeLang].content = this.quill.root.innerHTML;
    }

    const origLang = this.originalLanguage();
    const mainTitle = this.postLangData[origLang].title.trim();
    const mainContent = this.postLangData[origLang].content.trim();

    if (!mainTitle) {
      this.triggerToast(this.ts.translate('post_form.enter_title_error'), 'danger');
      return;
    }
    if (mainContent === '<p><br></p>' || mainContent === '') {
      this.triggerToast(this.ts.translate('post_form.enter_content_error'), 'danger');
      return;
    }

    const checkedCats = this.categories.filter(c => c.checked).map(c => c.label);

    const updatedData = {
      originalLanguage: origLang,
      translations: this.postLangData,
      categories: checkedCats,
      hashtags: this.hashtags,
      thumbnailName: this.thumbnailName,
      videoName: this.videoName
    };

    console.log("🚀 Dữ liệu CẬP NHẬT chuẩn bị gửi đi:", updatedData);
    this.triggerToast(this.ts.translate('post_form.update_success'), 'success');
  }

  cancelChanges() {
    if (confirm(this.ts.translate('post_form.cancel_confirm'))) {
      this.router.navigate(['/dashboard/owner/posts']);
    }
  }
}

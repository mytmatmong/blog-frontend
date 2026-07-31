import { Component, AfterViewInit, signal, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';

declare var Quill: any;

interface LangData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-create-post',
  imports: [FormsModule],
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

  constructor() {
    // Listen for language switch to preserve and load content
    effect(() => {
      const lang = this.currentEditLang();
      // Since effect runs in reactive context, we want to update the inputs when edit language changes
      // This is handled in changeEditLang() instead to keep it deterministic.
    });
  }

  ngAfterViewInit() {
    this.initQuill();
  }

  initQuill() {
    if (typeof Quill !== 'undefined') {
      this.quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Bắt đầu viết nội dung tuyệt vời của bạn tại đây...',
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
      this.toastService.error('Vui lòng nhập tiêu đề bài gốc!', 'Lỗi');
      return;
    }
    if (mainContent === '<p><br></p>' || mainContent === '') {
      this.toastService.error('Vui lòng nhập nội dung bài gốc!', 'Lỗi');
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
      this.toastService.success('Đã xuất bản bài viết thành công!', 'Thành công');
    } else {
      this.toastService.info('Đã lưu bản nháp thành công!', 'Lưu nháp');
    }
  }
}

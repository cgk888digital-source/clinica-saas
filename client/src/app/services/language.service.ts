import { Injectable, signal, computed } from '@angular/core';
import { ES_DICT } from '../i18n/es.dict';
import { EN_DICT } from '../i18n/en.dict';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang = signal<Language>('es');
  
  public locale = computed(() => this.currentLang() === 'es' ? 'es-ES' : 'en-US');
  
  private translations: Record<Language, any> = {
    es: ES_DICT,
    en: EN_DICT
  };

  constructor() {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
      this.currentLang.set(savedLang);
    }
  }

  get lang() {
    return this.currentLang.asReadonly();
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
  }

  translate(path: string, params: Record<string, any> = {}): string {
    const keys = path.split('.');
    let translation = this.translations[this.currentLang()];
    
    for (const key of keys) {
      if (translation && translation[key]) {
        translation = translation[key];
      } else {
        return path;
      }
    }
    
    if (typeof translation === 'string') {
      let result = translation;
      Object.keys(params).forEach(key => {
        result = result.replace(`{{${key}}}`, params[key]);
      });
      return result;
    }
    
    return translation;
  }
}

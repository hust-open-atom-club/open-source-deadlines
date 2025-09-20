'use client'

import i18next from "i18next";
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const supportedLngs = ['en', 'zh-CN'];
export const supportedLngDisplayNames: Record<string, string> = {
  'en': 'English',
  'zh-CN': '简体中文'
};

i18next
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    fallbackLng: 'zh-CN',
    interpolation: { escapeValue: false },
    defaultNS: 'common',
    supportedLngs: supportedLngs,
    nonExplicitSupportedLngs: false,
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['cookie'],
    },
    react: { useSuspense: false }
  });


export default i18next;
'use client'

import { I18nextProvider } from "react-i18next";
import i18next from "@/i18n/config";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
}
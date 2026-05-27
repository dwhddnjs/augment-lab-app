import { useLocale, type Locale } from '@/hooks/use-locale';

type Dict = Record<string, string>;

export function useTranslation<T extends Dict>(translations: Record<Locale, T>) {
  const { locale } = useLocale();
  return (key: keyof T): string =>
    (translations[locale] ?? translations.en)[key as string] ?? translations.en[key as string] ?? '';
}

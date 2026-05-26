export const FALLBACK_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES = ['de', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Language display names
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, { english: string; native: string }> = {
	de: { english: 'German', native: 'Deutsch' },
	en: { english: 'English', native: 'English' },
};

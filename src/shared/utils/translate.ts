// ============================================================
// shared/utils/translate.ts
// ============================================================
// Google Translate utility
// ============================================================

/**
 * Translates text to the specified target language.
 * Uses Google's free translation API
 *
 * @param text - The text to translate
 * @param targetLang - Target language code ("ar" for Arabic, "en" for English)
 * @returns The translated text, or the original text on failure
 */
export async function translateText(
  text: string,
  targetLang: "ar" | "en",
): Promise<string> {
  if (!text.trim()) return "";

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
    );

    if (!response.ok) {
      throw new Error(`Translation failed with status: ${response.status}`);
    }

    const data = await response.json();

    // The response format is: [[["translated text", "original", ...]], ...]
    const translated = data[0]?.map((item: any) => item[0]).join("") || text;
    return translated;
  } catch {
    // Return original text on any error (network, parsing, etc.)
    return text;
  }
}

/**
 * Translates text from English to Arabic
 */
export async function translateToArabic(text: string): Promise<string> {
  return translateText(text, "ar");
}

/**
 * Translates text from Arabic to English
 */
export async function translateToEnglish(text: string): Promise<string> {
  return translateText(text, "en");
}

/**
 * Translates text to the target language based on the current app language.
 * If app is in Arabic, translates to English. If app is in English, translates to Arabic.
 *
 * @param text - The text to translate
 * @param isAr - Whether the current app language is Arabic
 * @returns The translated text, or the original text on failure
 */
export async function translateOpposite(
  text: string,
  isAr: boolean,
): Promise<string> {
  return translateText(text, isAr ? "en" : "ar");
}

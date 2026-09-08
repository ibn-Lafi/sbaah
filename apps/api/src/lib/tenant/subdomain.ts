import type { SupabaseClient } from '@supabase/supabase-js';

/** Minimal Arabic -> Latin transliteration — good enough for a readable default slug, not linguistically exact. */
const ARABIC_TRANSLITERATION: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'th',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ة: 'h',
  ء: '',
  ئ: 'y',
  ؤ: 'w',
};

function transliterate(input: string): string {
  return input
    .split('')
    .map((char) => ARABIC_TRANSLITERATION[char] ?? char)
    .join('');
}

function slugify(input: string): string {
  const slug = transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return slug;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/**
 * Generates a unique subdomain from a display name. A readable default,
 * not a permanent brand asset — the owner requesting a change later is a
 * future settings feature, not built yet. Retries with a random suffix
 * on collision rather than failing registration outright.
 */
export async function generateUniqueSubdomain(
  displayName: string,
  supabase: SupabaseClient,
): Promise<string> {
  const base = slugify(displayName) || 'account';

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomSuffix()}`;
    const { data } = await supabase.from('tenants').select('id').eq('subdomain', candidate).maybeSingle();
    if (!data) return candidate;
  }

  return `account-${Math.random().toString(36).slice(2, 10)}`;
}

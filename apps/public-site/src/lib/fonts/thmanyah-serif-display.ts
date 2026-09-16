import localFont from 'next/font/local';

/**
 * خط "ثمانية" (thmanyah) — للعناوين الكبيرة فقط في صفحة الهبوط التسويقية
 * (marketing-home.tsx)، وليس لبقية النصوص: الملفات المُسلَّمة من المؤسس
 * تحتوي كل أوزان "Serif Display" لكنها لا تحتوي "Sans" إطلاقًا (المجلد
 * موجود فارغًا) ولا تحتوي "Serif Text" إلا وزن Light واحد — غير كافٍ
 * لنص واجهة (أزرار/فقرات) يحتاج عدة أوزان. لذلك يبقى IBM Plex Sans
 * Arabic (marketingFont في layout.tsx) هو خط النصوص والواجهة، بلا تغيير.
 *
 * ترخيص الخط (THMANYAH-FONT-LICENSE.pdf، بجانب هذا الملف) يمنع صراحةً
 * "web embedding" يسمح للمستخدم النهائي باستخراج ملف الخط، ويشترط تضمينه
 * فقط "كجزء من منتج مُجمَّع/مُغلَّف/مُبهَم" — بينما `next/font/local` هنا
 * ينتج ملف خط ذاتي الاستضافة عاديًا (قابلاً للتنزيل من تبويب Network في
 * أي متصفح، كأي خط ويب قياسي). المؤسس أكّد صراحةً المتابعة على مسؤوليته
 * كمالك المنصة رغم هذا القيد — لا قرار اتُّخذ من هذا الطرف بتجاوزه.
 */
export const thmanyahSerifDisplay = localFont({
  src: [
    { path: './files/thmanyahserifdisplay-Light.woff2', weight: '300', style: 'normal' },
    { path: './files/thmanyahserifdisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: './files/thmanyahserifdisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: './files/thmanyahserifdisplay-Bold.woff2', weight: '700', style: 'normal' },
    { path: './files/thmanyahserifdisplay-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-thmanyah-serif-display',
  display: 'swap',
});

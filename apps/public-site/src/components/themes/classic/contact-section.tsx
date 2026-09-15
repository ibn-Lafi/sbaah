import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { ContactSectionProps } from '../types';

// لا نموذج ثنائي اللغة للعنوان (الثيم الأساسي بلغة عربية واحدة فقط، طلب المؤسس).
// لا زر واتساب هنا (حُذف، طلب المؤسس) — رقم الهاتف يُعرض كنص فقط.
export function ContactSection({ config, whatsappPhone }: ContactSectionProps) {
  const title = config.title_ar || DEFAULT_SECTION_TITLE.contact.ar;

  return (
    <section id="contact" className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-12 text-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p dir="ltr" className="text-lg text-black/70">
        {whatsappPhone}
      </p>
    </section>
  );
}

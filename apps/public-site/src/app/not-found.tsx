import './globals.css';
import { ErrorState } from '@/components/system/error-state';

/**
 * This boundary also handles an unknown tenant host, before a tenant locale/theme
 * can be resolved. It is intentionally Sbaah-branded and bilingual.
 */
export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ErrorState
          code="404"
          eyebrowAr="العنوان غير معروف"
          eyebrowEn="Unknown address"
          titleAr="الموقع غير موجود"
          titleEn="Site not found"
          descriptionAr="لم نتمكن من العثور على موقع مرتبط بهذا العنوان. تأكد من الرابط أو ارجع للصفحة السابقة."
          descriptionEn="We couldn't find a site connected to this address. Check the link or return to the previous page."
        />
      </body>
    </html>
  );
}

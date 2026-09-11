import Link from 'next/link';
import type { HeaderProps } from '../types';

/** الثيم الأساسي — الشريط الترويجي (اختياري) + الهيدر (الشعار وقائمة التنقل). */
export function Header({ locale, dict, website, tenantName, otherLocaleHref }: HeaderProps) {
  return (
    <>
      {website.announcement_bar_text && (
        <div className="bg-tenant-primary px-6 py-2 text-center text-sm font-medium text-white">{website.announcement_bar_text}</div>
      )}
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
        <Link href={locale === 'ar' ? '/' : '/en'} className="flex items-center gap-2 font-semibold text-tenant-primary">
          {website.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={website.logo_url} alt={tenantName} className="h-9 w-auto" />
          ) : (
            <span className="text-lg">{tenantName}</span>
          )}
        </Link>
        <nav className="flex items-center gap-5">
          <Link href={locale === 'ar' ? '/properties' : '/en/properties'} className="text-sm hover:text-tenant-primary">
            {dict.properties}
          </Link>
          <Link href={locale === 'ar' ? '/projects' : '/en/projects'} className="text-sm hover:text-tenant-primary">
            {dict.projects}
          </Link>
          <Link href={locale === 'ar' ? '/about' : '/en/about'} className="text-sm hover:text-tenant-primary">
            {dict.about}
          </Link>
          <Link href={locale === 'ar' ? '/contact' : '/en/contact'} className="text-sm hover:text-tenant-primary">
            {dict.contact}
          </Link>
          <Link href={otherLocaleHref} className="text-sm text-tenant-primary hover:underline">
            {dict.languageSwitch}
          </Link>
        </nav>
      </header>
    </>
  );
}

import { SiteBadge } from '@/components/site-badge';
import {
  FacebookIcon,
  InstagramIcon,
  SnapchatIcon,
  TelegramIcon,
  TiktokIcon,
  XIcon,
} from '@/components/footer-icons';
import { safeExternalUrl } from '@/lib/security/public-values';
import type { FooterProps } from '../types';

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

export function Footer({ locale, dict, tenant, website, customPages }: FooterProps) {
  const name = locale === 'ar' ? tenant.name_ar : tenant.name_en,
    homeHref = locale === 'ar' ? '/' : '/en';
  const navigation = [
    { href: homeHref, label: locale === 'ar' ? 'الرئيسية' : 'Home' },
    { href: locale === 'ar' ? '/projects' : '/en/projects', label: dict.projects },
    { href: locale === 'ar' ? '/properties' : '/en/properties', label: dict.properties },
  ];
  const socialLinks = [
    safeExternalUrl(tenant.social_instagram) && {
      key: 'instagram',
      label: 'Instagram',
      href: safeExternalUrl(tenant.social_instagram)!,
      Icon: InstagramIcon,
    },
    safeExternalUrl(tenant.social_tiktok) && {
      key: 'tiktok',
      label: 'TikTok',
      href: safeExternalUrl(tenant.social_tiktok)!,
      Icon: TiktokIcon,
    },
    safeExternalUrl(tenant.social_snapchat) && {
      key: 'snapchat',
      label: 'Snapchat',
      href: safeExternalUrl(tenant.social_snapchat)!,
      Icon: SnapchatIcon,
    },
    safeExternalUrl(tenant.social_facebook) && {
      key: 'facebook',
      label: 'Facebook',
      href: safeExternalUrl(tenant.social_facebook)!,
      Icon: FacebookIcon,
    },
    safeExternalUrl(tenant.social_x) && {
      key: 'x',
      label: 'X',
      href: safeExternalUrl(tenant.social_x)!,
      Icon: XIcon,
    },
    safeExternalUrl(tenant.social_telegram) && {
      key: 'telegram',
      label: 'Telegram',
      href: safeExternalUrl(tenant.social_telegram)!,
      Icon: TelegramIcon,
    },
  ].filter(
    (entry): entry is { key: string; label: string; href: string; Icon: typeof InstagramIcon } =>
      Boolean(entry),
  );
  const registrations = [
    tenant.cr_number && { key: 'cr', label: dict.crNumber, value: tenant.cr_number },
    tenant.tax_number && { key: 'tax', label: dict.taxNumber, value: tenant.tax_number },
    tenant.fal_license_number && {
      key: 'fal',
      label: dict.falLicense,
      value: tenant.fal_license_number,
    },
  ].filter((entry): entry is { key: string; label: string; value: string } => Boolean(entry));
  return (
    <footer id="contact" className="bg-[#151915] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 border-t border-white/20 pt-8 lg:grid-cols-[1.35fr_.7fr_.8fr_1fr] lg:gap-10">
          <div>
            {website.logo_url ? (
              <img
                src={website.logo_url}
                alt={name}
                className="max-h-14 w-auto max-w-[220px] object-contain"
              />
            ) : (
              <p className="text-3xl font-medium">{name}</p>
            )}
            {website.footer_description && (
              <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
                {website.footer_description}
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3">
                {socialLinks.map(({ key, label, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="hover:border-tenant-primary hover:text-tenant-primary flex h-10 w-10 items-center justify-center border border-white/20 text-white/65 transition-colors"
                  >
                    <Icon className="h-[17px] w-[17px]" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[.2em] text-white/40">
              {locale === 'ar' ? 'روابط سريعة' : 'Navigation'}
            </h3>
            <div className="flex flex-col items-start gap-3 text-sm">
              {navigation.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-white/65 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[.2em] text-white/40">
              {dict.otherPages}
            </h3>
            <div className="flex flex-col items-start gap-3 text-sm">
              {customPages.length > 0 ? (
                customPages.map((page) => (
                  <a
                    key={page.id}
                    href={locale === 'ar' ? `/pages/${page.slug}` : `/en/pages/${page.slug}`}
                    className="text-white/65 transition-colors hover:text-white"
                  >
                    {page.title}
                  </a>
                ))
              ) : (
                <span className="text-white/35">—</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[.2em] text-white/40">
              {dict.contact}
            </h3>
            <div className="space-y-4 text-sm">
              {tenant.social_phone && (
                <div>
                  <span className="mb-1 block text-[11px] text-white/35">{dict.phoneNumber}</span>
                  <a
                    dir="ltr"
                    href={`tel:${digitsOnly(tenant.social_phone)}`}
                    className="text-white/75 hover:text-white"
                  >
                    {tenant.social_phone}
                  </a>
                </div>
              )}
              {tenant.social_whatsapp && (
                <div>
                  <span className="mb-1 block text-[11px] text-white/35">
                    {dict.whatsappNumber}
                  </span>
                  <a
                    dir="ltr"
                    href={`https://wa.me/${digitsOnly(tenant.social_whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/75 hover:text-white"
                  >
                    {tenant.social_whatsapp}
                  </a>
                </div>
              )}
              {website.address && (
                <div>
                  <span className="mb-1 block text-[11px] text-white/35">{dict.address}</span>
                  <p className="max-w-xs leading-6 text-white/65">{website.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {registrations.length > 0 && (
          <div className="mt-12 grid border-y border-white/15 sm:grid-cols-3">
            {registrations.map((entry) => (
              <div
                key={entry.key}
                className="border-b border-white/15 py-4 last:border-b-0 sm:border-b-0 sm:border-e sm:px-5 sm:first:ps-0 sm:last:border-e-0"
              >
                <span className="block text-[10px] text-white/35">{entry.label}</span>
                <strong dir="ltr" className="mt-1 block text-sm font-medium text-white/75">
                  {entry.value}
                </strong>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-5 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
          <SiteBadge accountType={tenant.account_type} locale={locale} />
        </div>
      </div>
    </footer>
  );
}

import {
  FacebookIcon,
  InstagramIcon,
  SnapchatIcon,
  TelegramIcon,
  TiktokIcon,
  WhatsappIcon,
  XIcon,
} from '@/components/footer-icons';
import { safeExternalUrl } from '@/lib/security/public-values';
import {
  OfficialRegistrationBadges,
  type RegistrationBadge,
} from '@/components/official-registration-badges';
import type { FooterProps } from '../types';

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

export function Footer({ locale, dict, tenant, website, customPages }: FooterProps) {
  const name = locale === 'ar' ? tenant.name_ar : tenant.name_en;
  const navigation = customPages.map((page) => ({
    href: locale === 'ar' ? `/pages/${page.slug}` : `/en/pages/${page.slug}`,
    label: page.title,
  }));
  const socialLinks = [
    tenant.social_whatsapp && {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${digitsOnly(tenant.social_whatsapp)}`,
      Icon: WhatsappIcon,
    },
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
  const isOrganization = tenant.account_type === 'institution' || tenant.account_type === 'company';
  const registrations = [
    isOrganization &&
      tenant.cr_number && { key: 'cr', label: dict.crNumber, value: tenant.cr_number },
    isOrganization &&
      tenant.tax_number && { key: 'tax', label: dict.taxNumber, value: tenant.tax_number },
    tenant.fal_license_number && {
      key: 'fal',
      label: dict.falLicense,
      value: tenant.fal_license_number,
    },
    isOrganization &&
      tenant.wafi_license_number && {
        key: 'wafi',
        label: dict.wafiLicense,
        value: tenant.wafi_license_number,
      },
    !isOrganization &&
      tenant.freelance_document_number && {
        key: 'freelance',
        label: dict.freelanceDocument,
        value: tenant.freelance_document_number,
      },
  ].filter((entry): entry is RegistrationBadge => Boolean(entry));
  return (
    <footer id="contact" className="bg-tenant-primary text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr_.9fr] lg:gap-16">
          <div>
            {website.logo_url ? (
              <img
                src={website.logo_url}
                alt={name}
                className="max-h-16 w-auto max-w-[230px] object-contain brightness-0 invert"
              />
            ) : (
              <p className="text-3xl font-medium">{name}</p>
            )}
            {website.footer_description && (
              <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
                {website.footer_description}
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {socialLinks.map(({ key, label, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-tenant-primary flex h-11 w-11 items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <nav className="flex flex-col items-start gap-4 text-[17px] sm:text-lg">
            {navigation.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white/85 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="space-y-8">
            <div>
              <h3 className="text-tenant-secondary mb-3 text-xl font-semibold">
                {locale === 'ar' ? 'تواصل معنا' : 'Contact us'}
              </h3>
              <div className="space-y-2 text-[15px] text-white/85">
                {tenant.inquiry_email && <a dir="ltr" href={`mailto:${tenant.inquiry_email}`} className="block w-fit">{tenant.inquiry_email}</a>}
                {tenant.inquiry_phone && <a dir="ltr" href={`tel:${tenant.inquiry_phone}`} className="block w-fit">{tenant.inquiry_phone}</a>}
              </div>
            </div>
            {website.address && (
              <div>
                <h3 className="text-tenant-secondary mb-3 text-xl font-semibold">
                  {locale === 'ar' ? 'الموقع' : 'Location'}
                </h3>
                <p className="max-w-sm text-[15px] leading-7 text-white/85">{website.address}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-6 border-t border-white/15 pt-6">
          {registrations.length > 0 && <OfficialRegistrationBadges entries={registrations} />}
          <p dir="auto" className="mx-auto w-full text-center text-sm leading-6 text-white/55">
            © {new Date().getFullYear()} {website.copyright_text || 'جميع الحقوق محفوظة @سبعة'}
          </p>
        </div>
      </div>
    </footer>
  );
}

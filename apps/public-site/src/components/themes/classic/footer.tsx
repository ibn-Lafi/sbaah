import Link from 'next/link';
import { SiteBadge } from '@/components/site-badge';
import {
  CallIcon,
  InstagramIcon,
  LocationIcon,
  SnapchatIcon,
  TiktokIcon,
  WhatsappIcon,
} from '@/components/footer-icons';
import type { FooterProps } from '../types';
import { safeExternalUrl } from '@/lib/security/public-values';

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

/**
 * الثيم الأساسي — فوتر بثلاثة أعمدة (شعار+حقوق+تواصل اجتماعي / تواصل
 * معنا / أخرى) + شارات الأرقام النظامية، ثم شريط الحقوق أسفل الكل —
 * نفس ترتيب المرجع الذي اعتمده المؤسس. الخلفية تستخدم `bg-tenant-secondary`
 * (اللون الثانوي الموجود أصلًا في تخصيص الثيم، افتراضيًا أسود) بدل لون
 * مخصص للفوتر وحده — حتى يتغيّر مع نفس أداة الألوان الموجودة، لا أداة
 * جديدة.
 */
export function Footer({ locale, dict, tenant, website, customPages }: FooterProps) {
  const tenantName = locale === 'ar' ? tenant.name_ar : tenant.name_en;

  // "تواصل معنا" (الاتصال/واتساب) لهما سطر خاص بهما بالعمود الأوسط —
  // هذه القائمة فقط حسابات التواصل الاجتماعي البحتة (عمود يمين، صف أيقونات).
  const socialLinks = [
    safeExternalUrl(tenant.social_instagram) && { key: 'instagram', href: safeExternalUrl(tenant.social_instagram)!, Icon: InstagramIcon },
    safeExternalUrl(tenant.social_tiktok) && { key: 'tiktok', href: safeExternalUrl(tenant.social_tiktok)!, Icon: TiktokIcon },
    safeExternalUrl(tenant.social_snapchat) && { key: 'snapchat', href: safeExternalUrl(tenant.social_snapchat)!, Icon: SnapchatIcon },
  ].filter((entry): entry is { key: string; href: string; Icon: typeof InstagramIcon } => Boolean(entry));

  const businessNumbers = [
    tenant.cr_number && {
      key: 'cr' as const,
      label: dict.crNumber,
      src: '/business-badges/saudi-business-center.png',
      alt: 'المركز السعودي للأعمال',
      objectPosition: '50% 50%',
      scale: 'scale-[1.85]',
    },
    tenant.tax_number && {
      key: 'tax' as const,
      label: dict.taxNumber,
      src: '/business-badges/zatca.jpeg',
      alt: 'هيئة الزكاة والضريبة والجمارك',
      objectPosition: '50% 50%',
      scale: 'scale-[1.35]',
    },
    tenant.fal_license_number && {
      key: 'fal' as const,
      label: dict.falLicense,
      src: '/business-badges/rega.png',
      alt: 'الهيئة العامة للعقار',
      objectPosition: '50% 50%',
      scale: 'scale-[1.3]',
    },
  ].filter(
    (entry): entry is {
      key: 'cr' | 'tax' | 'fal';
      label: string;
      src: string;
      alt: string;
      objectPosition: string;
      scale: string;
    } => Boolean(entry),
  );

  return (
    <footer className="bg-tenant-secondary text-sm text-white/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-6 sm:py-12">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_0.8fr]">
        {/* الشعار — حسابات التواصل الاجتماعي */}
        <div className="flex min-w-[220px] max-w-[280px] flex-col items-start gap-4">
          {website.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={website.logo_url} alt={tenantName} style={{ maxWidth: 200, maxHeight: 80 }} className="w-auto" />
          ) : (
            <span className="text-lg font-semibold text-white">{tenantName}</span>
          )}
          {website.footer_description && <p className="text-white/60">{website.footer_description}</p>}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map(({ key, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-tenant-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* تواصل معنا — الاتصال، واتساب، العنوان */}
        <div className="flex min-w-[220px] flex-col items-start gap-4">
          <h3 className="text-base font-semibold text-white">{dict.contact}</h3>
          {tenant.social_phone && (
            <a href={`tel:${digitsOnly(tenant.social_phone)}`} className="flex items-center gap-3 hover:text-tenant-primary">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-tenant-primary">
                <CallIcon className="h-[16px] w-[16px]" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs text-white/40">{dict.phoneNumber}</span>
                <span className="font-medium text-white" dir="ltr">
                  {tenant.social_phone}
                </span>
              </span>
            </a>
          )}
          {tenant.social_whatsapp && (
            <a
              href={`https://wa.me/${digitsOnly(tenant.social_whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:text-tenant-primary"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-tenant-primary">
                <WhatsappIcon className="h-[16px] w-[16px]" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs text-white/40">{dict.whatsappNumber}</span>
                <span className="font-medium text-white" dir="ltr">
                  {tenant.social_whatsapp}
                </span>
              </span>
            </a>
          )}
          {website.address && (
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-tenant-primary">
                <LocationIcon className="h-[16px] w-[16px]" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs text-white/40">{dict.address}</span>
                <span className="text-white">{website.address}</span>
              </span>
            </div>
          )}
        </div>

        {/* أخرى — روابط الصفحات */}
        {customPages.length > 0 && (
          <div className="flex min-w-[160px] flex-col items-start gap-3">
            <h3 className="text-base font-semibold text-white">{dict.otherPages}</h3>
            {customPages.map((page) => (
              <Link
                key={page.id}
                href={locale === 'ar' ? `/pages/${page.slug}` : `/en/pages/${page.slug}`}
                className="text-white/60 hover:text-tenant-primary"
              >
                {page.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
        {businessNumbers.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {businessNumbers.map(({ key, label, src, alt, objectPosition, scale }) => (
              <span
                key={key}
                title={label}
                className="relative flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-white/10"
              >
                {/* Keep the existing 40×40 badge footprint while cropping the whitespace baked into some official source files. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span
                  role="img"
                  aria-label={alt}
                  className={`block h-full w-full bg-contain bg-center bg-no-repeat ${scale}`}
                  style={{
                    backgroundImage: `url("${src}")`,
                    backgroundPosition: objectPosition,
                  }}
                />
              </span>
            ))}
          </div>
        )}
        <SiteBadge accountType={tenant.account_type} locale={locale} />
      </div>
      </div>
    </footer>
  );
}

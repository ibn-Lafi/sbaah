import { BrandMark } from '@/components/ui/brand-mark';
import { InstagramIcon, TiktokIcon, XIcon, MailIcon } from '@/components/website/editor-icons';
import { apiGet } from '@/lib/api/client';

interface PublicPlatformSettings {
  social_tiktok: string | null;
  social_instagram: string | null;
  social_x: string | null;
  contact_email: string | null;
}

async function loadSocialLinks() {
  try {
    const settings = await apiGet<PublicPlatformSettings>('/public/platform-settings');
    return [
      settings.social_tiktok && { key: 'tiktok', href: settings.social_tiktok, Icon: TiktokIcon, label: 'تيك توك' },
      settings.social_instagram && { key: 'instagram', href: settings.social_instagram, Icon: InstagramIcon, label: 'إنستغرام' },
      settings.social_x && { key: 'x', href: settings.social_x, Icon: XIcon, label: 'إكس' },
      settings.contact_email && { key: 'email', href: `mailto:${settings.contact_email}`, Icon: MailIcon, label: 'البريد الإلكتروني' },
    ].filter((entry): entry is { key: string; href: string; Icon: typeof TiktokIcon; label: string } => Boolean(entry));
  } catch {
    // Auth panel is decorative chrome on the login/register/forgot-password
    // pages — never let a platform-settings fetch failure break the ability
    // to sign in.
    return [];
  }
}

/**
 * The branded purple side panel from the founder's mockup — the only
 * consumer of brand-surface-2/brand-surface-3 (docs/DASHBOARD_DESIGN_SYSTEM.md
 * section 2 names them explicitly for "لوحة الدخول"). Shared by
 * login/register/forgot-password via (auth)/layout.tsx; hidden on small
 * screens where the form alone fills the page.
 *
 * The social row links to سبعة's OWN accounts (the platform owner's, set
 * via console's "إعدادات المنصة") — not any tenant's — replacing the
 * earlier decorative "عقار←موقع←زائر←Lead←متابعة" pipeline row.
 */
export async function AuthPanel() {
  const socialLinks = await loadSocialLinks();

  return (
    <div className="hidden flex-col justify-between bg-brand p-10 text-white lg:flex lg:w-[420px] lg:shrink-0">
      <BrandMark invert width={110} height={28} />

      <div className="space-y-4">
        <p className="text-2xl font-semibold leading-relaxed">
          موقعك العقاري ولوحة متابعة عملائك، في مكان واحد
        </p>
        <p className="text-sm text-brand-surface-3">
          أضف العقار مرة واحدة، يظهر على موقعك، وكل تفاعل زائر عليه يتحول تلقائيًا لعميل محتمل تتابعه من هنا.
        </p>
      </div>

      {socialLinks.length > 0 && (
        <div className="flex items-center gap-3">
          {socialLinks.map(({ key, href, Icon, label }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-hover text-white hover:bg-brand-surface-2 hover:text-brand"
            >
              <Icon className="h-[17px] w-[17px]" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

import Image from 'next/image';

export type RegistrationKind = 'cr' | 'tax' | 'fal' | 'wafi' | 'freelance';

export interface RegistrationBadge {
  key: RegistrationKind;
  label: string;
  value: string;
}

const logos: Record<
  RegistrationKind,
  { src: string; alt: string; width: number; height: number; className: string }
> = {
  cr: {
    src: '/business-badges/saudi-competitiveness-business-center.png',
    alt: 'المركز السعودي للتنافسية والأعمال',
    width: 3308,
    height: 1859,
    className: 'h-14 w-full scale-[1.45]',
  },
  tax: {
    src: '/business-badges/zatca.png',
    alt: 'هيئة الزكاة والضريبة والجمارك',
    width: 500,
    height: 113,
    className: 'h-11 w-full',
  },
  fal: {
    src: '/business-badges/fal.png',
    alt: 'فال',
    width: 498,
    height: 302,
    className: 'h-14 w-full scale-[1.12]',
  },
  wafi: {
    src: '/business-badges/wafi.png',
    alt: 'وافي للبيع والتأجير على الخارطة',
    width: 1364,
    height: 674,
    className: 'h-14 w-full scale-[1.3]',
  },
  freelance: {
    src: '/business-badges/freelance.webp',
    alt: 'منصة العمل الحر',
    width: 732,
    height: 454,
    className: 'h-14 w-full scale-[1.25]',
  },
};

/**
 * Displays the issuing program's official mark instead of a textual heading.
 * The number remains visible, while the hidden accessible label preserves its meaning.
 */
export function OfficialRegistrationBadges({ entries }: { entries: RegistrationBadge[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {entries.map(({ key, label, value }) => {
        const logo = logos[key];

        return (
          <figure
            key={key}
            aria-label={`${label}: ${value}`}
            className="flex min-h-28 min-w-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm"
          >
            <div className="flex min-h-20 flex-1 items-center justify-center overflow-hidden px-3 py-2">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 170px"
                className={`${logo.className} object-contain`}
              />
            </div>
            <figcaption
              dir="auto"
              className="border-t border-black/10 bg-slate-50 px-3 py-2 text-center text-sm font-semibold tracking-wide text-slate-800"
            >
              {value}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

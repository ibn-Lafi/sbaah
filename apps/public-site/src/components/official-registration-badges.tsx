import Image from 'next/image';

export type RegistrationKind = 'cr' | 'tax' | 'fal' | 'wafi' | 'freelance';

export interface RegistrationBadge {
  key: RegistrationKind;
  label: string;
  value: string;
}

const logos: Record<RegistrationKind, { src: string; alt: string; width: number; height: number }> =
  {
    cr: {
      src: '/business-badges/commercial-registration-card.png',
      alt: 'بطاقة السجل التجاري — المركز السعودي للتنافسية والأعمال',
      width: 357,
      height: 203,
    },
    tax: {
      src: '/business-badges/tax-number-card.png',
      alt: 'بطاقة الرقم الضريبي — هيئة الزكاة والضريبة والجمارك',
      width: 357,
      height: 201,
    },
    fal: {
      src: '/business-badges/fal-license-card.png',
      alt: 'بطاقة رخصة فال',
      width: 355,
      height: 200,
    },
    wafi: {
      src: '/business-badges/wafi-license-card.png',
      alt: 'بطاقة رخصة وافي للبيع والتأجير على الخارطة',
      width: 357,
      height: 203,
    },
    freelance: {
      src: '/business-badges/freelance-certificate-card.png',
      alt: 'بطاقة وثيقة العمل الحر',
      width: 354,
      height: 200,
    },
  };

/**
 * Displays the supplied official card artwork without an extra frame.
 * Each registration number is kept immediately beside its matching card.
 */
export function OfficialRegistrationBadges({ entries }: { entries: RegistrationBadge[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex w-full flex-nowrap items-center justify-start gap-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center sm:gap-5 [&::-webkit-scrollbar]:hidden">
      {entries.map(({ key, label, value }) => {
        const logo = logos[key];

        return (
          <figure
            key={key}
            aria-label={`${label}: ${value}`}
            className="flex flex-none items-center gap-1.5 sm:gap-2.5"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              sizes="(max-width: 639px) 50px, 120px"
              className="h-[30px] w-[50px] flex-none object-contain sm:h-[68px] sm:w-[120px]"
            />
            <figcaption
              dir="ltr"
              className="max-w-[72px] break-words text-[7px] font-semibold leading-3 tracking-wide text-white/90 sm:max-w-[150px] sm:text-xs sm:leading-5"
            >
              {value}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

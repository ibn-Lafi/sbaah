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
 * Cards are arranged four per row, with each registration number below its matching card.
 */
export function OfficialRegistrationBadges({ entries }: { entries: RegistrationBadge[] }) {
  if (entries.length === 0) return null;

  const lastRowCount = entries.length % 4;
  const lastRowStart = entries.length - lastRowCount;
  const centeredLastRowStarts: Record<number, number[]> = {
    1: [4],
    2: [3, 5],
    3: [2, 4, 6],
  };

  return (
    <div className="mx-auto grid w-fit max-w-full grid-cols-8 items-start gap-x-1 gap-y-4 sm:gap-x-2 sm:gap-y-6">
      {entries.map(({ key, label, value }, index) => {
        const logo = logos[key];
        const lastRowIndex = index - lastRowStart;
        const gridColumnStart =
          lastRowCount > 0 && lastRowIndex >= 0
            ? centeredLastRowStarts[lastRowCount]?.[lastRowIndex]
            : undefined;

        return (
          <figure
            key={key}
            aria-label={`${label}: ${value}`}
            style={{ gridColumnStart }}
            className="col-span-2 flex w-[56px] flex-col items-center gap-1.5 sm:w-[150px] sm:gap-2.5"
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
              className="w-full break-words text-center text-[7px] font-semibold leading-3 tracking-wide text-white/90 sm:text-xs sm:leading-5"
            >
              {value}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

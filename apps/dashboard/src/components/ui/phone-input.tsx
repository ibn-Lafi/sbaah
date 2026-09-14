import type { ChangeEvent, InputHTMLAttributes } from 'react';

const DISPLAY_PREFIX = '+966';

interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'dir'
> {
  value: string;
  onChange: (value: string) => void;
  /**
   * بادئة القيمة المخزّنة فعليًا: "+966" لحقول saudiPhoneSchema (تسجيل
   * الدخول، العملاء، الإيجارات...)، أو "966" بلا + لحقول واتساب/اتصال
   * الحرة بالإعدادات (تُستهلك لاحقًا عبر digitsOnly في الموقع العام).
   * العرض للمستخدم دائمًا "+966" بغض النظر عن هذا الفرق.
   */
  storagePrefix?: '+966' | '966';
}

/** كل أرقام الجوال بالمنصة سعودية فقط — رمز الدولة +966 ثابت مع علم السعودية، والمستخدم يكتب التسعة أرقام المتبقية فقط. */
export function PhoneInput({
  value,
  onChange,
  storagePrefix = '+966',
  className = '',
  ...props
}: PhoneInputProps) {
  const digits = value.startsWith(storagePrefix)
    ? value.slice(storagePrefix.length)
    : value.replace(/\D/g, '').slice(-9);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDigits = event.target.value.replace(/\D/g, '').slice(0, 9);
    onChange(nextDigits ? `${storagePrefix}${nextDigits}` : '');
  }

  return (
    <div
      dir="ltr"
      className={`rounded-input border-border-default text-text-primary focus-within:border-text-primary flex h-[54px] w-full min-w-0 items-center border px-4 text-base focus-within:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
    >
      <span className="border-border-default text-text-secondary flex items-center gap-1.5 border-r pr-3">
        <span aria-hidden="true">🇸🇦</span>
        <span>{DISPLAY_PREFIX}</span>
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={digits}
        onChange={handleChange}
        className="placeholder:text-text-placeholder h-full min-w-0 flex-1 bg-transparent pl-3 outline-none"
        {...props}
      />
    </div>
  );
}

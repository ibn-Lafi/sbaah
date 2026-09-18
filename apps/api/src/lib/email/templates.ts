import type { OtpPurpose } from '@sbaah/shared';

export interface EmailContent {
  subject: string;
  html: string;
}

/**
 * Shared RTL wrapper so every email template (this file) looks like it
 * comes from the same product instead of each one reinventing layout.
 * Adding a new notification type — e.g. a marketing announcement, or any
 * other "certain notification a user type needs" — means adding one more
 * function here that returns `{subject, html}` via this wrapper, and
 * calling `sendEmail()` (./send.ts) with it from wherever that event
 * happens; there is no registry to update.
 */
function layout(bodyHtml: string): string {
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:#1F1D22;line-height:1.7">
    ${bodyHtml}
    <p style="margin-top:28px;padding-top:16px;border-top:1px solid #eee;color:#888;font-size:12px">
      سبعة (SBAAH) — منصة إدارة العقارات
    </p>
  </div>`;
}

const OTP_PURPOSE_COPY: Record<Extract<OtpPurpose, 'login' | 'reset_password' | 'change_email'>, { intro: string; note: string }> = {
  login: {
    intro: 'رمز تسجيل الدخول الخاص بك',
    note: 'إن لم تحاول تسجيل الدخول، تجاهل هذه الرسالة.',
  },
  reset_password: {
    intro: 'رمز إعادة تعيين كلمة المرور',
    note: 'إن لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة.',
  },
  change_email: {
    intro: 'رمز تأكيد البريد الإلكتروني الجديد',
    note: 'إن لم تطلب تغيير بريد حسابك، تجاهل هذه الرسالة.',
  },
};

/** (1) email-OTP login and (3) email-OTP password reset — same template, `purpose` picks the copy. */
export function otpCodeEmail(params: {
  code: string;
  purpose: Extract<OtpPurpose, 'login' | 'reset_password' | 'change_email'>;
}): EmailContent {
  const copy = OTP_PURPOSE_COPY[params.purpose];
  return {
    subject: `${params.code} — ${copy.intro}`,
    html: layout(`
      <p>${copy.intro}:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:20px 0">${params.code}</p>
      <p style="color:#666;font-size:13px">${copy.note}</p>
    `),
  };
}

/** (2) sent when a new team member is invited, if an email was given for them. */
export function teamInviteEmail(params: { fullName: string; tenantName: string }): EmailContent {
  return {
    subject: `تمت إضافتك كموظف لدى ${params.tenantName} — سبعة`,
    html: layout(`
      <p>مرحبًا ${params.fullName}،</p>
      <p>تمت إضافتك كموظف في حساب <strong>${params.tenantName}</strong> على منصة سبعة.</p>
      <p>يمكنك تسجيل الدخول برقم جوالك عبر رمز التحقق المرسل بالرسائل النصية.</p>
    `),
  };
}

/** (4) sent to the agent a lead was just assigned to. */
export function newLeadAssignedEmail(params: {
  agentName: string;
  leadName: string;
  leadPhone: string | null;
}): EmailContent {
  return {
    subject: `تم تعيين عميل محتمل جديد لك — سبعة`,
    html: layout(`
      <p>مرحبًا ${params.agentName}،</p>
      <p>تم تعيين عميل محتمل جديد لك:</p>
      <p style="padding:12px 16px;background:#F7F5FA;border-radius:8px">
        <strong>${params.leadName}</strong><br />
        <span dir="ltr">${params.leadPhone ?? '—'}</span>
      </p>
      <p style="color:#666;font-size:13px">يمكنك متابعته من لوحة التحكم.</p>
    `),
  };
}

import { describe, expect, it } from 'vitest';
import { newLeadAssignedEmail, otpCodeEmail, teamInviteEmail } from './templates';

describe('email templates', () => {
  it('escapes names typed by anonymous website visitors', () => {
    const { html } = newLeadAssignedEmail({
      agentName: 'Agent',
      leadName: '<a href="https://evil.example">اضغط هنا</a>',
      leadPhone: '"+966500000000"',
    });
    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;');
    expect(html).toContain('&quot;+966500000000&quot;');
  });

  it('escapes member and tenant names in invites', () => {
    const { html } = teamInviteEmail({ fullName: '<img src=x onerror=alert(1)>', tenantName: 'A & B' });
    expect(html).not.toContain('<img');
    expect(html).toContain('A &amp; B');
  });

  it('shows the OTP code and purpose copy', () => {
    const { subject, html } = otpCodeEmail({ code: '0421', purpose: 'change_email' });
    expect(subject.startsWith('0421')).toBe(true);
    expect(html).toContain('0421');
  });
});

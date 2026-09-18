-- تغيير بيانات الحساب الحساسة — OTP للرقم والبريد.
-- نفّذ هذا الملف مرة واحدة في Supabase SQL Editor قبل نشر الكود.
alter table public.otp_verifications
  drop constraint if exists otp_verifications_purpose_check;

alter table public.otp_verifications
  add constraint otp_verifications_purpose_check
  check (purpose in ('register','login','reset_password','change_phone','change_email'));

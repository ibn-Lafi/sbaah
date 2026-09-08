import type { Session, SupabaseClient } from '@supabase/supabase-js';

/**
 * docs/OTP_FLOW.md section 4 — mints a real Supabase session for a user
 * who was verified via Twilio Verify, not Supabase's own OTP flow.
 * `supabase` MUST be a service-role client (`admin.generateLink` requires
 * it). UNTESTED against a live Supabase project — see the warning in
 * that section; validate this first when task 12/35 credentials exist.
 */
export async function mintSessionForUser(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<Session> {
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(authUserId);
  if (userError || !userData?.user?.email) {
    throw new Error('Cannot mint a session: user has no internal email set');
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user.email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    throw new Error('Cannot mint a session: generateLink failed');
  }

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });
  if (verifyError || !verifyData.session) {
    throw new Error('Cannot mint a session: verifyOtp failed');
  }

  return verifyData.session;
}

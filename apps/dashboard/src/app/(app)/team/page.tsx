import { redirect } from 'next/navigation';

export default function CanonicalSettingsRedirect() {
  redirect('/settings?tab=team');
}

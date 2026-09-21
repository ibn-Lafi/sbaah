import { redirect } from 'next/navigation';

export default function LegacyBuildingsPage() {
  redirect('/properties?type=building');
}

import { redirect } from 'next/navigation';

export default function RentPlusPropertiesRedirect() {
  redirect('/properties?view=rent');
}

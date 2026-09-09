import Link from 'next/link';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';

export default function ConsoleHomePage() {
  return (
    <ConsoleShell title="إدارة منصة سبعة">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/accounts">
          <Card className="p-6 hover:shadow-[0_2px_16px_rgba(31,29,34,.14)]">
            <h2 className="mb-1 font-semibold text-brand">الحسابات</h2>
            <p className="text-sm text-black/60">قائمة حسابات المنصة — تفعيل، تعليق، وتغيير الباقة.</p>
          </Card>
        </Link>
        <Link href="/plans">
          <Card className="p-6 hover:shadow-[0_2px_16px_rgba(31,29,34,.14)]">
            <h2 className="mb-1 font-semibold text-brand">الباقات</h2>
            <p className="text-sm text-black/60">أسعار وحدود الباقات المعروضة للعملاء.</p>
          </Card>
        </Link>
      </div>
    </ConsoleShell>
  );
}

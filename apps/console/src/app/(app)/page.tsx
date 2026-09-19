import Link from 'next/link';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';

const modules = [
  { href:'/accounts', title:'الحسابات والعملاء', body:'متابعة جميع حسابات المنصة، حالتها، الباقة وتفاصيل العميل.' },
  { href:'/plans', title:'الاشتراكات والباقات', body:'إدارة الباقات والأسعار والحدود ومتابعة نموذج الاشتراك.' },
  { href:'/themes', title:'المواقع والثيمات', body:'إدارة ثيمات المواقع العقارية وتوفرها داخل المنصة.' },
  { href:'/support', title:'الدعم والتذاكر', body:'متابعة تذاكر العملاء وحالاتها والردود المرتبطة بها.' },
  { href:'/cities', title:'المدن والأحياء', body:'إدارة البيانات الجغرافية المستخدمة في العقارات والمشاريع.' },
  { href:'/settings', title:'المنصة وصفحة الهبوط', body:'إعدادات سبعة، التواصل، وسياسة الخصوصية والشروط والأحكام.' },
];

export default function ConsoleHomePage() {
 return <ConsoleShell title="نظرة عامة">
  <div className="mb-6">
   <h1 className="text-2xl font-semibold text-text-primary">إدارة منصة سبعة</h1>
   <p className="mt-1 text-sm text-text-secondary">مركز متابعة وتشغيل المنصة وإدارة العملاء والمحتوى والخدمات.</p>
  </div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
   {modules.map(x=><Link key={x.href} href={x.href}><Card className="h-full p-5 transition-shadow hover:shadow-[0_4px_20px_rgba(31,29,34,.12)]"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface text-brand">↗</div><h2 className="font-semibold text-text-primary">{x.title}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{x.body}</p></Card></Link>)}
  </div>
  <Card className="mt-6 p-5">
   <h2 className="font-semibold text-text-primary">التحليلات التشغيلية</h2>
   <p className="mt-2 text-sm text-text-secondary">سيتم عرض مؤشرات المنصة هنا من البيانات الفعلية فقط: الحسابات النشطة، الاشتراكات، العقارات، العملاء، المواقع والتذاكر. لن يتم استخدام أرقام تجريبية.</p>
  </Card>
 </ConsoleShell>;
}

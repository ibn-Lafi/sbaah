import { BrandMark } from '@/components/ui/brand-mark';

const PIPELINE_STEPS = ['عقار', 'موقع', 'زائر', 'Lead', 'متابعة'];

/**
 * The branded purple side panel from the founder's mockup — the only
 * consumer of brand-surface-2/brand-surface-3 (docs/DASHBOARD_DESIGN_SYSTEM.md
 * section 2 names them explicitly for "لوحة الدخول"). Shared by
 * login/register/forgot-password via (auth)/layout.tsx; hidden on small
 * screens where the form alone fills the page.
 */
export function AuthPanel() {
  return (
    <div className="hidden flex-col justify-between bg-brand p-10 text-white lg:flex lg:w-[420px] lg:shrink-0">
      <BrandMark invert width={110} height={28} />

      <div className="space-y-4">
        <p className="text-2xl font-semibold leading-relaxed">
          موقعك العقاري ولوحة متابعة عملائك، في مكان واحد
        </p>
        <p className="text-sm text-brand-surface-3">
          أضف العقار مرة واحدة، يظهر على موقعك، وكل تفاعل زائر عليه يتحول تلقائيًا لعميل محتمل تتابعه من هنا.
        </p>
      </div>

      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm text-brand-surface-2">
        {PIPELINE_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-full bg-brand-hover px-3 py-1 text-white">{step}</span>
            {index < PIPELINE_STEPS.length - 1 && <span aria-hidden="true">←</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

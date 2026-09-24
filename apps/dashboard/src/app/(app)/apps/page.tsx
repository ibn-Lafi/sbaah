'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';

type AgentRole = 'sales' | 'support' | 'assistant';
type AgentStatus = 'active' | 'paused';

interface AgentDraft {
  name: string;
  role: AgentRole;
  personality: string;
  status: AgentStatus;
}

const EMPTY_AGENT: AgentDraft = {
  name: '',
  role: 'sales',
  personality: '',
  status: 'active',
};

export default function AppsPage() {
  const { me } = useCurrentUser();
  const { locale } = useLocale();
  const [agent, setAgent] = useState<AgentDraft>(EMPTY_AGENT);
  const ar = locale === 'ar';

  return (
    <AppShell
      title={ar ? 'سبعة Ai' : 'Sbaah AI'}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5">
          <h1 className="text-text-primary text-xl font-bold sm:text-2xl">
            {ar ? 'إنشاء وكيل' : 'Create agent'}
          </h1>
          <p className="text-text-secondary mt-1 text-sm leading-6">
            {ar
              ? 'أنشئ وكيلك وحدد دوره وشخصيته وحالته. سيتم إضافة الأدوات والإعدادات المتقدمة لاحقًا.'
              : 'Create an agent and define its role, personality, and status. Tools and advanced settings will be added later.'}
          </p>
        </div>

        <section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-text-primary text-sm font-semibold">{ar ? 'الاسم' : 'Name'}</span>
              <input
                type="text"
                value={agent.name}
                onChange={(event) => setAgent((current) => ({ ...current, name: event.target.value }))}
                placeholder={ar ? 'اسم الوكيل' : 'Agent name'}
                className="border-border-default bg-surface-card text-text-primary placeholder:text-text-placeholder h-11 w-full rounded-[10px] border px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-text-primary text-sm font-semibold">{ar ? 'الدور' : 'Role'}</span>
              <select
                value={agent.role}
                onChange={(event) => setAgent((current) => ({ ...current, role: event.target.value as AgentRole }))}
                className="border-border-default bg-surface-card text-text-primary h-11 w-full rounded-[10px] border px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              >
                <option value="sales">{ar ? 'فريق المبيعات' : 'Sales team'}</option>
                <option value="support">{ar ? 'دعم عملاء' : 'Customer support'}</option>
                <option value="assistant">{ar ? 'مساعد' : 'Assistant'}</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-text-primary text-sm font-semibold">{ar ? 'الشخصية والدور' : 'Personality and role'}</span>
              <textarea
                value={agent.personality}
                onChange={(event) => setAgent((current) => ({ ...current, personality: event.target.value }))}
                placeholder={ar ? 'اكتب كيف يتحدث الوكيل، أسلوبه، مهامه ودوره...' : 'Describe how the agent speaks, behaves, and what it should do...'}
                rows={5}
                className="border-border-default bg-surface-card text-text-primary placeholder:text-text-placeholder min-h-[132px] w-full resize-y rounded-[10px] border px-3 py-3 text-sm leading-6 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-text-primary mb-2 text-sm font-semibold">{ar ? 'الحالة' : 'Status'}</legend>
              <div className="flex gap-2">
                {([
                  ['active', ar ? 'نشط' : 'Active'],
                  ['paused', ar ? 'متوقف' : 'Paused'],
                ] as const).map(([value, label]) => {
                  const selected = agent.status === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAgent((current) => ({ ...current, status: value }))}
                      aria-pressed={selected}
                      className={`h-10 rounded-[10px] border px-4 text-sm font-semibold transition ${
                        selected
                          ? 'border-brand bg-brand-surface text-brand'
                          : 'border-border-default bg-surface-card text-text-secondary hover:bg-surface-subtle'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="border-border-default mt-6 flex items-center justify-end border-t pt-4">
            <button
              type="button"
              disabled
              title={ar ? 'سيتم ربط الحفظ عند بناء نظام الوكلاء' : 'Saving will be connected when the agent system is built'}
              className="bg-brand cursor-not-allowed rounded-[10px] px-5 py-2.5 text-sm font-semibold text-white opacity-55"
            >
              {ar ? 'إنشاء الوكيل' : 'Create agent'}
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

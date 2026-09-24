'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getAiAssistant, saveAiAssistant, type AiAssistant } from '@/lib/api/ai';

type Section = 'assistant' | 'whatsapp';

export default function AppsPage() {
  const { me, accessToken } = useCurrentUser();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const [section, setSection] = useState<Section>('assistant');
  const [assistant, setAssistant] = useState<AiAssistant | null>(null);
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getAiAssistant(accessToken)
      .then((data) => {
        if (!active) return;
        setAssistant(data);
        if (data) {
          setName(data.name);
          setPersonality(data.personality);
        }
      })
      .catch(() => {
        if (active) setError(ar ? 'تعذر تحميل مساعد Ai.' : 'Could not load AI assistant.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken, ar]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const saved = await saveAiAssistant(accessToken, { name: name.trim(), personality: personality.trim() });
      setAssistant(saved);
      setName(saved.name);
      setPersonality(saved.personality);
    } catch {
      setError(ar ? 'تعذر حفظ المساعد. حاول مرة أخرى.' : 'Could not save the assistant. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={ar ? 'سبعة Ai' : 'Sbaah AI'} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-surface-subtle mb-6 grid w-full grid-cols-2 rounded-[12px] p-1">
          {([
            ['assistant', ar ? 'مساعد Ai' : 'AI Assistant'],
            ['whatsapp', ar ? 'واتس اب Ai' : 'WhatsApp AI'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSection(value)}
              aria-pressed={section === value}
              className={`h-10 rounded-[9px] px-3 text-sm font-semibold transition ${
                section === value
                  ? 'bg-surface-card text-text-primary border-border-default border shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'assistant' ? (
          loading ? (
            <div className="border-border-default bg-surface-card rounded-card border p-6">
              <div className="bg-surface-subtle h-5 w-32 animate-pulse rounded" />
              <div className="bg-surface-subtle mt-3 h-4 w-64 max-w-full animate-pulse rounded" />
            </div>
          ) : assistant ? (
            <section className="border-border-default bg-surface-card flex min-h-[560px] flex-col overflow-hidden rounded-card border">
              <header className="border-border-default flex items-center gap-3 border-b px-4 py-4 sm:px-5">
                <div className="bg-brand-surface text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {assistant.name.trim().slice(0, 1) || 'Ai'}
                </div>
                <div className="min-w-0">
                  <h1 className="text-text-primary truncate text-base font-bold">{assistant.name}</h1>
                  <p className="text-text-secondary text-xs">{ar ? 'مساعدك في سبعة' : 'Your Sbaah assistant'}</p>
                </div>
                <span className="ms-auto flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {ar ? 'نشط' : 'Active'}
                </span>
              </header>

              <div className="flex flex-1 items-center justify-center px-5 py-10 text-center">
                <div className="max-w-md">
                  <h2 className="text-text-primary text-lg font-bold">
                    {ar ? `مرحبًا، أنا ${assistant.name}` : `Hi, I'm ${assistant.name}`}
                  </h2>
                  <p className="text-text-secondary mt-2 text-sm leading-6">
                    {ar
                      ? 'تم إنشاء مساعدك وحفظ شخصيته. سنربط المحادثة وأدوات سبعة هنا مباشرة.'
                      : 'Your assistant and personality are saved. Chat and Sbaah tools will be connected here.'}
                  </p>
                </div>
              </div>

              <div className="border-border-default border-t p-3 sm:p-4">
                <div className="border-border-default bg-surface-subtle flex min-h-12 items-center rounded-[12px] border px-4">
                  <span className="text-text-placeholder flex-1 text-sm">
                    {ar ? `اكتب رسالة إلى ${assistant.name}...` : `Message ${assistant.name}...`}
                  </span>
                  <button type="button" disabled className="bg-brand rounded-[9px] px-4 py-2 text-sm font-semibold text-white opacity-50">
                    {ar ? 'إرسال' : 'Send'}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="mx-auto max-w-2xl">
              <div className="mb-6">
                <h1 className="text-text-primary text-xl font-bold sm:text-2xl">{ar ? 'أنشئ مساعدك' : 'Create your assistant'}</h1>
                <p className="text-text-secondary mt-2 text-sm leading-6">
                  {ar
                    ? 'سمّ مساعدك وحدد شخصيته مرة واحدة. بعدها سيكون مساعدك داخل سبعة للمحادثة معك وتنفيذ المهام المسموحة.'
                    : 'Name your assistant and define its personality once. It will then become your assistant inside Sbaah.'}
                </p>
              </div>

              <form onSubmit={(event) => void handleCreate(event)} className="border-border-default bg-surface-card rounded-card border p-4 sm:p-6">
                <label className="flex flex-col gap-2">
                  <span className="text-text-primary text-sm font-semibold">{ar ? 'اسم المساعد' : 'Assistant name'}</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    placeholder={ar ? 'مثال: سعود' : 'Example: Saud'}
                    className="border-border-default bg-surface-card text-text-primary placeholder:text-text-placeholder h-11 rounded-[10px] border px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                </label>

                <label className="mt-5 flex flex-col gap-2">
                  <span className="text-text-primary text-sm font-semibold">{ar ? 'الشخصية والتعليمات' : 'Personality and instructions'}</span>
                  <textarea
                    value={personality}
                    onChange={(event) => setPersonality(event.target.value)}
                    maxLength={6000}
                    rows={6}
                    placeholder={ar ? 'مثال: تحدث معي باختصار وبأسلوب مهني، ووضح لي الأرقام والنتائج بشكل مباشر...' : 'Example: Be concise, professional, and explain numbers and results clearly...'}
                    className="border-border-default bg-surface-card text-text-primary placeholder:text-text-placeholder min-h-36 resize-y rounded-[10px] border px-3 py-3 text-sm leading-6 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                </label>

                {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

                <div className="border-border-default mt-6 flex justify-end border-t pt-4">
                  <button
                    type="submit"
                    disabled={!name.trim() || saving}
                    className="bg-brand rounded-[10px] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (ar ? 'جاري الإنشاء...' : 'Creating...') : ar ? 'إنشاء المساعد' : 'Create assistant'}
                  </button>
                </div>
              </form>
            </section>
          )
        ) : (
          <section className="border-border-default bg-surface-card rounded-card border p-6 sm:p-8">
            <h2 className="text-text-primary text-lg font-bold">{ar ? 'واتس اب Ai' : 'WhatsApp AI'}</h2>
            <p className="text-text-secondary mt-2 text-sm leading-6">
              {ar ? 'سيتم بناء واتس اب Ai كقسم مستقل بعد اكتمال مساعد Ai.' : 'WhatsApp AI will remain a separate section and will be built after the AI Assistant.'}
            </p>
          </section>
        )}

        {error && assistant ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </AppShell>
  );
}

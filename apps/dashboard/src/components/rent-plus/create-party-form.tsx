'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormWizard, WizardActions } from '@/components/forms/form-wizard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createEjarParty, listEjarTenants, type EjarPartyRow } from '@/lib/api/rent-plus';
import { listLeads } from '@/lib/api/leads';

type LeadOption = Awaited<ReturnType<typeof listLeads>>['leads'][number];

export function CreatePartyForm({ accessToken, onCreated }: { accessToken: string; onCreated: () => void }) {
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<'crm' | 'new'>('crm');
  const [busy, setBusy] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [tenants, setTenants] = useState<EjarPartyRow[]>([]);
  const [leadId, setLeadId] = useState('');
  const [form, setForm] = useState({ type: 'individual', name: '', phone: '', email: '', nationalId: '', commercialRegistration: '' });
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;
    void Promise.all([listLeads(accessToken, {}), listEjarTenants(accessToken)])
      .then(([leadResult, tenantResult]) => {
        if (!active) return;
        setLeads(leadResult.leads);
        setTenants(tenantResult.tenants);
      })
      .catch(() => { if (active) setError('تعذر تحميل العملاء المسجلين'); })
      .finally(() => { if (active) setLoadingOptions(false); });
    return () => { active = false; };
  }, [accessToken]);

  const existingLeadIds = useMemo(() => new Set(tenants.map(t => t.lead_id).filter(Boolean)), [tenants]);
  const selectedLead = leads.find(lead => lead.id === leadId);
  const alreadyTenant = Boolean(leadId && existingLeadIds.has(leadId));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (source === 'crm') {
        if (!selectedLead) { setError('اختر عميلاً من قائمة العملاء'); return; }
        await createEjarParty(accessToken, {
          party_type: 'individual',
          name: selectedLead.full_name,
          phone: selectedLead.phone || null,
          email: selectedLead.email || null,
          lead_id: selectedLead.id,
        });
      } else {
        await createEjarParty(accessToken, {
          party_type: form.type,
          name: form.name,
          phone: form.phone || null,
          email: form.email || null,
          national_id: form.nationalId || null,
          commercial_registration: form.commercialRegistration || null,
          lead_id: null,
        });
      }
      onCreated();
    } catch (x) {
      setError(x instanceof Error ? x.message : 'تعذر حفظ المستأجر');
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (source === 'crm' && !leadId) { setError('اختر عميلاً من قائمة العملاء'); return; }
    if (source === 'new' && !form.name.trim()) { setError('اسم المستأجر مطلوب'); return; }
    setError('');
    setStep(1);
  }

  return <form onSubmit={submit} className="flex flex-col gap-5">
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-subtle-3 p-1">
      <button type="button" onClick={() => { setSource('crm'); setStep(0); setError(''); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${source === 'crm' ? 'bg-surface-card text-brand shadow-sm' : 'text-text-secondary'}`}>اختيار عميل مسجل</button>
      <button type="button" onClick={() => { setSource('new'); setStep(0); setError(''); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${source === 'new' ? 'bg-surface-card text-brand shadow-sm' : 'text-text-secondary'}`}>مستأجر جديد</button>
    </div>

    <FormWizard steps={['اختيار المستأجر', 'المراجعة']} current={step} onStepChange={target => target < step && setStep(target)} />

    {step === 0 && source === 'crm' && <div className="space-y-3">
      <Select value={leadId} disabled={loadingOptions} onChange={e => setLeadId(e.target.value)}>
        <option value="">{loadingOptions ? 'جاري تحميل العملاء…' : 'اختر من قائمة العملاء'}</option>
        {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.full_name}{lead.phone ? ` · ${lead.phone}` : ''}{existingLeadIds.has(lead.id) ? ' · مستأجر مسجل' : ''}</option>)}
      </Select>
      {selectedLead && <div className="rounded-xl border border-border-default p-4 text-sm">
        <p className="font-semibold">{selectedLead.full_name}</p>
        <p className="mt-1 text-text-secondary">{selectedLead.phone || 'بدون رقم جوال'}{selectedLead.email ? ` · ${selectedLead.email}` : ''}</p>
        {alreadyTenant && <p className="mt-2 text-xs font-semibold text-emerald-700">هذا العميل مسجل مسبقًا كمستأجر، وسيتم استخدام سجله الحالي دون تكرار.</p>}
      </div>}
    </div>}

    {step === 0 && source === 'new' && <div className="grid gap-4 sm:grid-cols-2">
      <Select value={form.type} onChange={e => set('type', e.target.value)}><option value="individual">فرد</option><option value="organization">منشأة</option></Select>
      <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="الاسم" required />
      <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="رقم الجوال" />
      <Input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="البريد الإلكتروني" />
    </div>}

    {step === 1 && source === 'crm' && selectedLead && <div className="rounded-xl border border-border-default p-4 text-sm">
      <span className="text-text-secondary">المستأجر: </span><strong>{selectedLead.full_name}</strong>
      <p className="mt-2 text-text-secondary">{alreadyTenant ? 'سيتم استخدام سجل المستأجر الموجود.' : 'سيتم ربط المستأجر بملف العميل في CRM.'}</p>
    </div>}

    {step === 1 && source === 'new' && <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input value={form.nationalId} onChange={e => set('nationalId', e.target.value)} placeholder="رقم الهوية" />
        <Input value={form.commercialRegistration} onChange={e => set('commercialRegistration', e.target.value)} placeholder="السجل التجاري" />
      </div>
      <div className="rounded-xl border border-border-default p-4 text-sm"><span className="text-text-secondary">المستأجر: </span><strong>{form.name}</strong><span className="mx-2 text-text-secondary">·</span>{form.type === 'individual' ? 'فرد' : 'منشأة'}</div>
    </div>}

    {error && <p className="text-sm text-red-600">{error}</p>}
    <WizardActions step={step} total={2} loading={busy} submitLabel={alreadyTenant && source === 'crm' ? 'استخدام المستأجر' : 'حفظ المستأجر'} onBack={() => setStep(0)} onNext={next} />
  </form>;
}

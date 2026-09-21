'use client';

import { useMemo, useState } from 'react';
import type { Customer360Snapshot, LeadWithNotes } from '@/lib/api/leads';

type JourneyStage = {
  id: string;
  label: string;
  detail: string;
  at: string | null;
  icon: string;
  tone: 'violet' | 'blue' | 'pink' | 'green' | 'cyan' | 'amber';
};

const tones = {
  violet: { node: 'border-violet-300/70 bg-violet-500', glow: 'shadow-[0_0_32px_rgba(139,92,246,.55)]' },
  blue: { node: 'border-blue-300/70 bg-blue-500', glow: 'shadow-[0_0_32px_rgba(59,130,246,.5)]' },
  pink: { node: 'border-pink-300/70 bg-pink-500', glow: 'shadow-[0_0_32px_rgba(236,72,153,.5)]' },
  green: { node: 'border-emerald-300/70 bg-emerald-500', glow: 'shadow-[0_0_32px_rgba(16,185,129,.5)]' },
  cyan: { node: 'border-cyan-300/70 bg-cyan-500', glow: 'shadow-[0_0_32px_rgba(6,182,212,.5)]' },
  amber: { node: 'border-amber-300/70 bg-amber-500', glow: 'shadow-[0_0_36px_rgba(245,158,11,.55)]' },
} as const;

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '';

function firstDate(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort()[0] ?? null;
}

function buildStages(lead: LeadWithNotes, data: Customer360Snapshot): JourneyStage[] {
  const stages: JourneyStage[] = [{
    id: 'start',
    label: 'تواصل أولي',
    detail: 'بداية علاقة العميل',
    at: lead.created_at,
    icon: '☎',
    tone: 'violet',
  }];

  const interestAt = firstDate(data.activities.map((item) => item.occurred_at));
  if (interestAt || ['contacted', 'qualified', 'in_progress', 'won'].includes(lead.status)) {
    stages.push({ id: 'interest', label: 'اهتمام', detail: 'تم التواصل وتحديد الاحتياج', at: interestAt, icon: '✦', tone: 'blue' });
  }

  const viewing = [...data.viewings].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
  if (viewing) stages.push({ id: 'viewing', label: 'معاينة', detail: viewing.outcome ? 'تم تسجيل نتيجة المعاينة' : 'معاينة عقارية', at: viewing.scheduled_at, icon: '◉', tone: 'pink' });

  const reservation = [...data.reservations].sort((a, b) => a.reserved_at.localeCompare(b.reserved_at))[0];
  if (reservation) stages.push({ id: 'reservation', label: 'حجز', detail: `الحجز ${reservation.reservation_number}`, at: reservation.reserved_at, icon: '⌂', tone: 'cyan' });

  const contract = [...data.contracts].sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
  if (contract) stages.push({ id: 'contract', label: 'عقد', detail: `العقد ${contract.contract_number}`, at: contract.start_date, icon: '▤', tone: 'green' });

  const payment = [...data.payments].filter((item) => item.status === 'recorded').sort((a, b) => a.paid_at.localeCompare(b.paid_at))[0];
  if (payment) stages.push({ id: 'payment', label: 'مدفوعات', detail: 'بدأ السجل المالي للعميل', at: payment.paid_at, icon: '▣', tone: 'blue' });

  const maintenance = [...data.maintenance].sort((a, b) => a.opened_at.localeCompare(b.opened_at))[0];
  if (maintenance) stages.push({ id: 'maintenance', label: 'صيانة', detail: maintenance.title, at: maintenance.opened_at, icon: '⌘', tone: 'violet' });

  if (lead.status === 'won' || data.contracts.some((item) => item.status === 'active')) {
    stages.push({ id: 'loyal', label: 'عميل مستمر', detail: 'علاقة قائمة مع العميل', at: null, icon: '★', tone: 'amber' });
  }

  return stages;
}

export function CustomerJourney3D({ lead, data }: { lead: LeadWithNotes; data: Customer360Snapshot }) {
  const [expanded, setExpanded] = useState(false);
  const stages = useMemo(() => buildStages(lead, data), [lead, data]);
  const interactionCount = data.activities.length + data.viewings.length + data.reservations.length + data.deals.length + data.payments.length + data.maintenance.length;
  const days = Math.max(1, Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000));

  return (
    <section className="overflow-hidden rounded-card border border-slate-700/60 bg-[#071426] text-white shadow-[0_24px_70px_rgba(2,8,23,.22)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/20 text-lg text-violet-200">◇</span>
            <div><h2 className="font-semibold">رحلة العميل</h2><p className="mt-0.5 text-xs text-slate-400">من أول تواصل إلى العلاقة الحالية</p></div>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-control border border-white/15 bg-white/[.06] px-3 py-2 text-xs font-semibold transition hover:bg-white/10">
          {expanded ? 'عرض مختصر' : 'مشاهدة الرحلة'}
        </button>
      </div>

      <div className={`relative transition-[min-height] duration-500 ${expanded ? 'min-h-[610px] md:min-h-[570px]' : 'min-h-[390px] md:min-h-[430px]'}`}>
        <div aria-hidden="true" className="absolute inset-0 opacity-70" style={{background:'radial-gradient(circle at 52% 42%, rgba(104,69,138,.34), transparent 28%), radial-gradient(circle at 70% 72%, rgba(14,165,233,.16), transparent 24%), linear-gradient(180deg,#08182c,#06111f)'}} />
        <div aria-hidden="true" className="absolute inset-x-[5%] bottom-10 top-14 origin-bottom rounded-[45%] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.01))] shadow-[inset_0_0_80px_rgba(104,69,138,.16)] [transform:perspective(900px)_rotateX(57deg)_rotateZ(-4deg)] motion-safe:animate-[pulse_5s_ease-in-out_infinite]" />

        <div className="relative z-10 flex min-h-[390px] flex-col justify-end px-4 pb-5 pt-16 md:min-h-[430px] md:px-7 md:pb-7">
          <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3 md:inset-x-7">
            <div><p className="text-lg font-bold md:text-2xl">رحلة {lead.full_name}</p><p className="mt-1 text-xs text-slate-400 md:text-sm">مسار حي مبني على بيانات العميل الفعلية</p></div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-slate-300">3D حي</span>
          </div>

          <div className="relative mx-auto w-full max-w-5xl">
            <svg aria-hidden="true" viewBox="0 0 1000 180" preserveAspectRatio="none" className="absolute inset-x-0 top-[48px] hidden h-36 w-full overflow-visible md:block">
              <defs><linearGradient id="journey-line" x1="0" x2="1"><stop offset="0" stopColor="#8b5cf6"/><stop offset=".5" stopColor="#22d3ee"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
              <path d="M40 122 C180 18 300 160 445 72 S700 20 960 92" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="12" strokeLinecap="round"/>
              <path d="M40 122 C180 18 300 160 445 72 S700 20 960 92" fill="none" stroke="url(#journey-line)" strokeWidth="3" strokeLinecap="round" className="motion-safe:[stroke-dasharray:16_12] motion-safe:animate-[dash_4s_linear_infinite]"/>
            </svg>

            <div className="relative grid grid-cols-1 gap-3 md:grid-cols-none md:grid-flow-col md:auto-cols-fr md:gap-2">
              {stages.map((stage, index) => {
                const tone = tones[stage.tone];
                const lift = [48, 0, 64, 20, 72, 30, 88, 48][index % 8];
                return <div key={stage.id} className="relative md:flex md:flex-col md:items-center" style={{transform: expanded ? undefined : undefined}}>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/25 md:w-full md:flex-col md:text-center" style={{marginBottom: expanded ? undefined : undefined, marginTop: expanded ? 0 : undefined}}>
                    <span className={`grid h-11 w-11 flex-none place-items-center rounded-full border text-lg text-white ${tone.node} ${tone.glow} motion-safe:animate-[pulse_3s_ease-in-out_infinite]`}>{stage.icon}</span>
                    <div className="min-w-0 md:min-h-[70px]"><p className="font-semibold">{stage.label}</p><p className="mt-0.5 truncate text-xs text-slate-400 md:whitespace-normal">{stage.detail}</p>{stage.at&&<p className="mt-1 text-[11px] text-slate-500">{formatDate(stage.at)}</p>}</div>
                  </div>
                  <span className="absolute -top-2 right-5 h-2 w-2 rounded-full bg-white/70 md:right-auto" />
                  <style>{`@media (min-width:768px){[data-journey-node="${stage.id}"]{transform:translateY(-${lift}px)}}`}</style>
                </div>;
              })}
            </div>
          </div>

          {expanded && <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 md:mx-auto md:w-full md:max-w-3xl">
            <div className="rounded-xl bg-white/[.05] p-3 text-center"><p className="text-lg font-bold">{days}</p><p className="text-[11px] text-slate-400">يوم منذ البداية</p></div>
            <div className="rounded-xl bg-white/[.05] p-3 text-center"><p className="text-lg font-bold">{interactionCount}</p><p className="text-[11px] text-slate-400">تفاعل مسجل</p></div>
            <div className="rounded-xl bg-white/[.05] p-3 text-center"><p className="text-lg font-bold">{stages.length}</p><p className="text-[11px] text-slate-400">مرحلة في الرحلة</p></div>
          </div>}
        </div>
      </div>
      <style>{`@keyframes dash{to{stroke-dashoffset:-56}} @media (prefers-reduced-motion:reduce){.motion-safe\\:animate-\\[dash_4s_linear_infinite\\],.motion-safe\\:animate-\\[pulse_3s_ease-in-out_infinite\\],.motion-safe\\:animate-\\[pulse_5s_ease-in-out_infinite\\]{animation:none!important}}`}</style>
    </section>
  );
}

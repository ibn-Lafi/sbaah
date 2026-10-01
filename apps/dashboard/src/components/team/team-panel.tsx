'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Permission } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormError } from '@/components/ui/form-error';
import { Modal } from '@/components/ui/modal';
import { FormWizard, WizardActions } from '@/components/forms/form-wizard';
import { ApiRequestError } from '@/lib/api/client';
import { createTeamMember, deleteTeamMember, getTeam, updateTeamMember, type TeamMember } from '@/lib/api/team';

const GROUPS: Array<{ title: string; permissions: Array<[Permission, string]> }> = [
  { title: 'الرئيسية', permissions: [['dashboard.read','عرض الرئيسية'],['dashboard.metrics.read','عرض الإحصائيات والمؤشرات']] },
  { title: 'العملاء', permissions: [['crm.read','عرض العملاء'],['crm.create','إضافة'],['crm.update','تعديل'],['crm.assign','إسناد'],['crm.manage','إدارة'],['customers.delete','حذف'],['customers.import','استيراد'],['customers.export','تصدير']] },
  { title: 'المشاريع', permissions: [['projects.read','عرض'],['projects.create','إضافة'],['projects.update','تعديل'],['projects.properties.manage','إدارة عقارات المشروع'],['projects.units.manage','إدارة الوحدات'],['projects.media.manage','إدارة الوسائط'],['projects.publish','نشر'],['projects.archive','أرشفة']] },
  { title: 'العقارات', permissions: [['properties.read','عرض'],['properties.create','إضافة'],['properties.update','تعديل'],['properties.units.manage','إدارة الوحدات'],['properties.media.manage','إدارة الوسائط'],['properties.publish','نشر'],['properties.archive','أرشفة']] },
  { title: 'العقود', permissions: [['contracts.read','عرض'],['contracts.create','إضافة'],['contracts.update','تعديل'],['contracts.attachments.manage','إدارة المرفقات'],['contracts.delete','حذف']] },
  { title: 'المواعيد', permissions: [['appointments.read','عرض'],['appointments.create','إضافة'],['appointments.update','تعديل'],['appointments.delete','حذف']] },
  { title: 'إيجار Plus', permissions: [['ejar_plus.read','عرض'],['ejar_plus.manage','إدارة العمليات']] },
  { title: 'الموقع الإلكتروني', permissions: [['website.read','عرض'],['website.theme.manage','تخصيص الموقع والثيم'],['website.pages.manage','إدارة الصفحات'],['website.domain.manage','إدارة الدومين'],['website.identity.manage','بيانات التواصل والهوية'],['website.publish','نشر وحفظ التغييرات']] },
  { title: 'سبعة AI', permissions: [['ai.assistant.use','استخدام المساعد'],['ai.data.read','عرض البيانات'],['ai.data.create','إضافة البيانات'],['ai.data.update','تعديل البيانات'],['ai.whatsapp.manage','إدارة واتساب AI'],['ai.agents.manage','إدارة الوكلاء'],['ai.credits.use','استخدام الرصيد والكروت']] },
  { title: 'التقارير', permissions: [['reports.read','عرض'],['reports.export','تصدير']] },
  { title: 'التنبيهات', permissions: [['notifications.read','عرض'],['notifications.manage','إدارة الحالة']] },
  { title: 'الإعدادات', permissions: [['tenant.settings.read','عرض'],['settings.account.manage','تعديل الحساب'],['settings.organization.manage','بيانات المنشأة'],['settings.contact.manage','معلومات التواصل'],['settings.brand.manage','الهوية التجارية']] },
  { title: 'فريق العمل', permissions: [['team.read','عرض الأعضاء'],['team.create','إضافة عضو'],['team.update','تعديل العضو'],['team.permissions.manage','تعديل الصلاحيات'],['team.status.manage','تفعيل وتعطيل'],['team.delete','حذف']] },
  { title: 'الاشتراك والفوترة', permissions: [['billing.read','عرض الباقة'],['billing.subscription.manage','إدارة الاشتراك'],['billing.invoices.read','الفواتير والمدفوعات'],['billing.payment_methods.manage','وسائل الدفع']] },
];
const ALL = GROUPS.flatMap((group) => group.permissions.map(([key]) => key));

function PermissionPicker({value,onChange}:{value:Permission[];onChange:(value:Permission[])=>void}) {
  const [open,setOpen]=useState<string|null>('فريق العمل');
  const selected=new Set(value);
  const toggle=(key:Permission)=>onChange(selected.has(key)?value.filter((item)=>item!==key):[...value,key]);
  return <div className="overflow-hidden rounded-[18px] border border-border-default">
    <label className="flex cursor-pointer items-center justify-between border-b border-border-subtle p-4">
      <span className="font-semibold text-text-primary">منح جميع الصلاحيات</span>
      <input type="checkbox" className="h-5 w-5" checked={ALL.every((key)=>selected.has(key))} onChange={()=>onChange(ALL.every((key)=>selected.has(key))?[]:[...ALL])}/>
    </label>
    {GROUPS.map((group)=>{const keys=group.permissions.map(([key])=>key);const all=keys.every((key)=>selected.has(key));return <div key={group.title} className="border-b border-border-subtle last:border-0">
      <div className="flex items-center gap-3 p-4"><input type="checkbox" className="h-5 w-5" checked={all} onChange={()=>onChange(all?value.filter((key)=>!keys.includes(key)):[...new Set([...value,...keys])])}/>
      <button type="button" className="flex flex-1 items-center justify-between text-start" onClick={()=>setOpen(open===group.title?null:group.title)}><span className="text-sm font-semibold">{group.title}</span><span>{open===group.title?'−':'+'}</span></button></div>
      {open===group.title&&<div className="grid gap-2 bg-surface-subtle p-3 sm:grid-cols-2">{group.permissions.map(([key,label])=><label key={key} className="flex cursor-pointer items-center gap-2 rounded-control bg-surface-card p-3 text-sm"><input type="checkbox" checked={selected.has(key)} onChange={()=>toggle(key)}/>{label}</label>)}</div>}
    </div>})}
  </div>;
}

export function TeamPanel({accessToken}:{accessToken:string}) {
  const [members,setMembers]=useState<TeamMember[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null); const [member,setMember]=useState<TeamMember|null|undefined>(undefined);
  async function load(){try{setLoading(true);setMembers((await getTeam(accessToken)).members);setError(null)}catch(e){setError(e instanceof ApiRequestError?e.message:'تعذر تحميل فريق العمل')}finally{setLoading(false)}}
  useEffect(()=>{void load()},[accessToken]);
  return <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">فريق العمل</h2><p className="text-sm text-text-secondary">{members.length} عضو</p></div><Button type="button" onClick={()=>setMember(null)}>إضافة عضو</Button></div>
    <FormError message={error}/>
    <Card className="overflow-hidden p-0">{loading?<div className="p-6 text-sm text-text-secondary">جارٍ التحميل...</div>:members.length===0?<div className="flex flex-col items-center gap-3 p-10 text-center"><strong>لم يتم إضافة أعضاء فريق</strong><span className="text-sm text-text-secondary">أضف عضوًا وحدد صلاحياته.</span><Button type="button" onClick={()=>setMember(null)}>إضافة عضو فريق</Button></div>:<div className="divide-y divide-border-subtle">{members.map((item)=><button key={item.id} type="button" disabled={item.role==='owner'} onClick={()=>setMember(item)} className="flex w-full items-center justify-between p-4 text-start disabled:cursor-default"><div><div className="font-semibold">{item.full_name}{item.role==='owner'?' · المالك':''}</div><div className="text-xs text-text-secondary">{item.email||item.phone}</div></div><span className="text-xs text-text-secondary">{item.status==='active'?'نشط':'معطل'}</span></button>)}</div>}</Card>
    {member!==undefined&&<MemberForm accessToken={accessToken} member={member} onClose={()=>setMember(undefined)} onSaved={async()=>{setMember(undefined);await load()}}/>}
  </div>;
}

function MemberForm({accessToken,member,onClose,onSaved}:{accessToken:string;member:TeamMember|null;onClose:()=>void;onSaved:()=>Promise<void>}) {
  const [name,setName]=useState(member?.full_name||'');const [email,setEmail]=useState(member?.email||'');const [phone,setPhone]=useState(member?.phone||'');const [password,setPassword]=useState('');const [permissions,setPermissions]=useState<Permission[]>(member?.permissions||[]);const [step,setStep]=useState(0);const [status,setStatus]=useState<'active'|'disabled'>(member?.status==='disabled'?'disabled':'active');const [saving,setSaving]=useState(false);const [error,setError]=useState<string|null>(null);
  async function submit(event:FormEvent){event.preventDefault();setSaving(true);setError(null);try{if(member)await updateTeamMember(accessToken,member.id,{full_name:name,status,permissions});else await createTeamMember(accessToken,{full_name:name,email,phone,temporary_password:password,permissions});await onSaved()}catch(e){setError(e instanceof ApiRequestError?e.message:'تعذر حفظ عضو الفريق');setSaving(false)}}
  async function remove(){if(!member||!window.confirm('هل تريد حذف حساب هذا الموظف؟ سيتم إلغاء دخوله وصلاحياته نهائيًا.'))return;setSaving(true);setError(null);try{await deleteTeamMember(accessToken,member.id);await onSaved()}catch(e){setError(e instanceof ApiRequestError?e.message:'تعذر حذف حساب الموظف');setSaving(false)}}
  return <Modal title={member?'تعديل عضو الفريق':'إضافة عضو فريق'} onClose={onClose} maxWidth="760px" mobileCentered><form onSubmit={submit} className="flex flex-col gap-5">
    {!member&&<FormWizard steps={['بيانات العضو','الصلاحيات']} current={step} onStepChange={target=>target<step&&setStep(target)}/>} 
    {(member||step===0)&&<div><h3 className="mb-3 text-sm font-bold">معلومات العضو</h3><div className="grid gap-3 sm:grid-cols-2"><Input required placeholder="الاسم" value={name} onChange={(e)=>setName(e.target.value)}/><Input required={!member} disabled={!!member} type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} dir="ltr"/><PhoneInput placeholder="5xxxxxxxx" value={phone} onChange={setPhone} disabled={!!member}/>{!member&&<PasswordInput required placeholder="كلمة المرور المؤقتة" value={password} onChange={(e)=>setPassword(e.target.value)}/>}</div></div>}
    {member&&<label className="flex items-center justify-between rounded-[16px] border border-border-default p-4"><span className="text-sm font-semibold">حالة الحساب</span><select value={status} onChange={(e)=>setStatus(e.target.value as 'active'|'disabled')} className="rounded-control border border-border-default bg-surface-card p-2 text-sm"><option value="active">نشط</option><option value="disabled">معطل</option></select></label>}
    {(member||step===1)&&<div><h3 className="mb-3 text-sm font-bold">الصلاحيات</h3><PermissionPicker value={permissions} onChange={setPermissions}/></div>}<FormError message={error}/>{!member?<WizardActions step={step} total={2} loading={saving} submitLabel="إنشاء الحساب" onBack={()=>setStep(0)} onNext={()=>{setError(null);if(!name.trim()||!email.trim()||!phone.trim()||password.length<8){setError('أكمل الاسم والبريد ورقم الجوال وكلمة المرور المؤقتة (8 خانات على الأقل)');return;}setStep(1)}}/>:<div className="flex gap-2"><Button type="submit" loading={saving}>حفظ</Button><Button type="button" variant="secondary" onClick={onClose}>إلغاء</Button><Button type="button" variant="secondary" onClick={remove} disabled={saving}>حذف الحساب</Button></div>}
  </form></Modal>;
}

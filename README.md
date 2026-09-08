# سبعة (SBAAH)

منصة SaaS عقارية للسوق السعودي. المواصفة الكاملة والمعتمدة: [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md).
تتبع تقدم البناء: [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md).

## البنية (Monorepo)

```
apps/
  public-site/   # الموقع العام لكل الحسابات (Multi-tenant, SSR/SEO)
  dashboard/     # لوحة الوسيط (Owner/Admin/Agent)
  console/       # لوحة إدارة المنصة (مالك سبعة فقط)
  api/           # الخدمة الوحيدة المتصلة بـSupabase مباشرة (/v1)
packages/
  shared/        # أنواع TypeScript + Zod schemas مشتركة بين كل التطبيقات
supabase/
  migrations/    # SQL — يُشغَّل يدويًا في Supabase (انظر تعليمات كل migration)
```

**قاعدة أساسية:** `api` هي الوحيدة التي تتصل بـSupabase مباشرة. أي تطبيق آخر (`dashboard`/`console`/`public-site`) يمر عبر `api`. التفاصيل الكاملة في قسم 7 من `PRODUCT_SPEC.md`.

## التشغيل محليًا

يتطلب Node 20+ وpnpm.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/console/.env.example apps/console/.env.local
cp apps/public-site/.env.example apps/public-site/.env.local
# عبّئ القيم الفعلية في كل .env.local (مفاتيح Supabase، Twilio، إلخ)
pnpm dev
```

## الأوامر

| الأمر | الوظيفة |
|---|---|
| `pnpm dev` | تشغيل كل التطبيقات محليًا (Turborepo) |
| `pnpm build` | بناء كل التطبيقات |
| `pnpm lint` | ESLint على كل الحزم |
| `pnpm typecheck` | فحص TypeScript على كل الحزم |
| `pnpm format` | تنسيق الكود بـPrettier |

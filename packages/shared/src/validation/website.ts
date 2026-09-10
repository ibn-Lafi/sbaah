import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'اللون يجب أن يكون بصيغة hex (مثال: #68458A)');

/**
 * PRODUCT_SPEC section 6: "خط من قائمة مدعومة" — no concrete font list was
 * specified in the spec, so this stays a plain non-empty string rather
 * than a guessed enum. Tighten to an actual whitelist once the founder
 * names the supported fonts (matters for what public-site actually loads).
 */
export const websiteUpdateSchema = z.object({
  theme_id: z.string().uuid().optional(),
  primary_color: hexColorSchema.optional(),
  secondary_color: hexColorSchema.optional(),
  font_family: z.string().min(1).optional(),
  logo_url: z.string().url().optional().nullable(),
  banner_image_url: z.string().url().optional().nullable(),
  announcement_bar_text: z.string().max(200).optional().nullable(),
  footer_description: z.string().max(2000).optional().nullable(),
});
export type WebsiteUpdateInput = z.infer<typeof websiteUpdateSchema>;

/** الصفحات — العنوان يولّد slug تلقائيًا في الواجهة، لكن الـ API يتحقق من نفس الصيغة (أحرف/أرقام/شرطات). */
const websiteCustomPageSlugSchema = z
  .string()
  .min(1, 'رابط الصفحة مطلوب')
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'الرابط يجب أن يكون أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط');

export const websiteCustomPageCreateSchema = z.object({
  title: z.string().min(1, 'عنوان الصفحة مطلوب').max(120),
  slug: websiteCustomPageSlugSchema,
  content: z.string().max(20000).default(''),
});
export type WebsiteCustomPageCreateInput = z.infer<typeof websiteCustomPageCreateSchema>;

export const websiteCustomPageUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  slug: websiteCustomPageSlugSchema.optional(),
  content: z.string().max(20000).optional(),
  order_index: z.number().int().nonnegative().optional(),
});
export type WebsiteCustomPageUpdateInput = z.infer<typeof websiteCustomPageUpdateSchema>;

export const sectionUpdateSchema = z.object({
  is_visible: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;

/** Drag-and-drop reorder sends the whole new order at once (PRODUCT_SPEC section 6). */
export const sectionReorderSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.string().uuid(),
        order_index: z.number().int().nonnegative(),
      }),
    )
    .min(1, 'قائمة الأقسام لا يمكن أن تكون فارغة'),
});
export type SectionReorderInput = z.infer<typeof sectionReorderSchema>;

/**
 * PRODUCT_SPEC section 6 gives no explicit size limit for logo/banner
 * uploads (only the video-risk case in section 12 has one) — a single
 * small branding image, so 5MB is a generous, low-risk default rather
 * than an arbitrary guess needing later revisiting like the video limit.
 */
export const MAX_WEBSITE_ASSET_SIZE_MB = 5;

/**
 * PRODUCT_SPEC section 6: "خط من قائمة مدعومة" without naming the list —
 * resolved here with four free, Arabic-supporting Google Fonts already
 * common in Saudi products. IBM Plex Sans Arabic matches the dashboard's
 * own font (docs/DASHBOARD_DESIGN_SYSTEM.md) so it's the default.
 */
export const SUPPORTED_WEBSITE_FONTS = ['IBM Plex Sans Arabic', 'Cairo', 'Tajawal', 'Almarai'] as const;
export type SupportedWebsiteFont = (typeof SUPPORTED_WEBSITE_FONTS)[number];

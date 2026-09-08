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
});
export type WebsiteUpdateInput = z.infer<typeof websiteUpdateSchema>;

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

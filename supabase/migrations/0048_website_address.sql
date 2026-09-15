-- =============================================================================
-- Migration 0048: website address field
--
-- Founder's request: "العنوان" (address) and "وصف الموقع" (website
-- description) become two genuinely separate fields — previously the
-- dashboard's "حسابي" AddressCard reused `footer_description` for both
-- concepts (one column, dual-purpose). `footer_description` keeps its
-- existing meaning/column (a general footer blurb, already shown on the
-- public site's footer under "تواصل معنا"/location icon); this migration
-- adds a real `address` column instead of continuing to overload
-- footer_description. Same pattern as migration 0025 (one nullable text
-- column on `websites`, edited via the existing generic PATCH /v1/website,
-- no RLS change needed — the table's existing owner/admin update policy
-- already covers any column on the row).
-- =============================================================================

alter table websites add column if not exists address text;

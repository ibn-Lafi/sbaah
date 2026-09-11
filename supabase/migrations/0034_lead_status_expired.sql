-- =============================================================================
-- Migration 0034: حالة عميل محتمل جديدة "منتهية" (expired)
--
-- Founder's redesign of /leads: the status set shown across the list's
-- filter tabs, the inline status switcher, and the detail page's "حالة
-- الطلب" select must be جديد/تم التواصل/مؤهل/صفقة/مرفوض/منتهية — six
-- values, one more than the current five (new/contacted/qualified/won/
-- lost). "منتهية" covers a lead that went stale/unreachable rather than
-- an explicit rejection (lost) — a distinct end-state, not a rename of
-- an existing one.
-- =============================================================================

alter type lead_status add value if not exists 'expired';

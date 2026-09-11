-- =============================================================================
-- Migration 0036: حذف الثيم الثاني ("العصري"/modern)
--
-- Founder's decision: إبقاء ثيم واحد فقط ("الأساسي"/classic) للمنصة
-- حاليًا. يحذف صف الثيم من الجدول بعد إعادة أي موقع كان عليه (إن وُجد)
-- إلى الثيم الأساسي أولًا — websites.theme_id مفتاح خارجي غير قابل
-- للـ null (migration 0002)، فلا يمكن حذف الصف بينما موقع ما لا يزال
-- يشير إليه.
--
-- الكود (apps/public-site/src/components/themes/modern) يُحذف في نفس
-- الدفعة على مستوى المستودع — لا حاجة لإبقائه: getThemeComponents()
-- (registry.ts) أصلًا يتراجع تلقائيًا لثيم classic عند أي مفتاح غير
-- معروف، فحتى لو بقي صف قديم بمفتاح 'modern' في نسخة أقدم من القاعدة
-- لن ينكسر الموقع.
-- =============================================================================

update websites
set theme_id = (select id from themes where key = 'classic')
where theme_id = (select id from themes where key = 'modern');

delete from themes where key = 'modern';

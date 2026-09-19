-- Harden platform FAQ administration: public may only read active rows,
-- while authenticated platform admins can manage the complete collection.
-- Reuse the project's existing is_platform_admin() and set_updated_at().
drop policy if exists platform_faq_items_admin_all on public.platform_faq_items;
create policy platform_faq_items_admin_all
on public.platform_faq_items
for all
to authenticated
using (is_platform_admin())
with check (is_platform_admin());

drop trigger if exists platform_faq_items_set_updated_at on public.platform_faq_items;
create trigger platform_faq_items_set_updated_at
before update on public.platform_faq_items
for each row
execute function set_updated_at();

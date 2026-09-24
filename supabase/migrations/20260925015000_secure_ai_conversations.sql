-- Keep assistant-generated messages server-only and conversations private to their creator.
revoke execute on function public.append_ai_assistant_message(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.append_ai_assistant_message(uuid,text,jsonb) to service_role;

drop policy if exists ai_conversations_tenant_select on public.ai_conversations;
create policy ai_conversations_private_select
on public.ai_conversations for select to authenticated
using (tenant_id = auth_tenant_id() and created_by = auth_app_user_id());

drop policy if exists ai_messages_tenant_select on public.ai_messages;
create policy ai_messages_private_select
on public.ai_messages for select to authenticated
using (
  tenant_id = auth_tenant_id()
  and exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.tenant_id = auth_tenant_id()
      and c.created_by = auth_app_user_id()
  )
);

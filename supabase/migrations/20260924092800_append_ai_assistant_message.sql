-- Persist model-generated assistant messages without allowing clients to forge assistant rows directly.
create or replace function public.append_ai_assistant_message(
  p_conversation_id uuid,
  p_content text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.ai_messages
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_app_user_id uuid;
  v_message public.ai_messages;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  v_tenant_id := auth_tenant_id();
  v_app_user_id := auth_app_user_id();
  if not exists (
    select 1 from public.ai_conversations c
    where c.id = p_conversation_id
      and c.tenant_id = v_tenant_id
      and c.created_by = v_app_user_id
  ) then
    raise exception 'conversation not found';
  end if;
  insert into public.ai_messages (tenant_id, conversation_id, sender, content, metadata, created_by)
  values (v_tenant_id, p_conversation_id, 'assistant', p_content, coalesce(p_metadata, '{}'::jsonb), null)
  returning * into v_message;
  update public.ai_conversations
  set last_message_at = now(), updated_at = now()
  where id = p_conversation_id and tenant_id = v_tenant_id;
  return v_message;
end;
$$;
revoke all on function public.append_ai_assistant_message(uuid,text,jsonb) from public, anon;
grant execute on function public.append_ai_assistant_message(uuid,text,jsonb) to authenticated;

import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptWhatsAppCredential } from './credentials';

export type MetaConnectionInput={
  tenantId:string; accessToken:string; metaBusinessId?:string|null; metaWabaId:string;
  metaPhoneNumberId:string; displayPhoneNumber?:string|null; verifiedName?:string|null; tokenExpiresAt?:string|null;
};

export async function saveMetaConnection(systemSupabase:SupabaseClient,input:MetaConnectionInput,keyBase64:string){
  const ciphertext=encryptWhatsAppCredential(input.accessToken,keyBase64);
  const now=new Date().toISOString();
  const {data,error}=await systemSupabase.from('whatsapp_connections').upsert({
    tenant_id:input.tenantId,provider:'meta_cloud',status:'connected',
    meta_business_id:input.metaBusinessId??null,meta_waba_id:input.metaWabaId,meta_phone_number_id:input.metaPhoneNumberId,
    display_phone_number:input.displayPhoneNumber??null,verified_name:input.verifiedName??null,
    access_token_ciphertext:ciphertext,token_expires_at:input.tokenExpiresAt??null,connected_at:now,last_error:null,updated_at:now,
  },{onConflict:'tenant_id'}).select('id,tenant_id,provider,status,meta_business_id,meta_waba_id,meta_phone_number_id,display_phone_number,verified_name,token_expires_at,connected_at,last_error,created_at,updated_at').single();
  if(error) throw new Error(`Failed to save WhatsApp connection: ${error.message}`);
  return data;
}

export async function revokeMetaConnection(systemSupabase:SupabaseClient,tenantId:string,reason='revoked'){
  const {data,error}=await systemSupabase.from('whatsapp_connections').update({
    status:'revoked',access_token_ciphertext:null,token_expires_at:null,last_error:reason,updated_at:new Date().toISOString(),
  }).eq('tenant_id',tenantId).select('id,tenant_id,status,updated_at').single();
  if(error) throw new Error(`Failed to revoke WhatsApp connection: ${error.message}`);
  return data;
}

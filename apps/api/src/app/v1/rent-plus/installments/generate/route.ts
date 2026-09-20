import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';

const schema=z.object({contract_id:z.string().uuid()});

export const POST=withErrorHandling(async(request)=>{
  const {supabase}=getAuthenticatedClient(request);
  const {contract_id}=schema.parse(await request.json());
  const {data,error}=await supabase.rpc('generate_lease_installments',{p_contract_id:contract_id});
  if(error) throw new Error(`Failed to generate lease installments: ${error.message}`);
  return okResponse({installments:data},201);
});
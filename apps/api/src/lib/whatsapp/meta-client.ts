export interface MetaSendTextInput {
  phoneNumberId:string; accessToken:string; to:string; text:string; graphApiVersion:string;
}
export type MetaSendErrorKind='config'|'rejected'|'ambiguous';
export class MetaSendError extends Error {
  constructor(public readonly kind:MetaSendErrorKind,message:string,public readonly status?:number,public readonly providerCode?:number){
    super(message); this.name='MetaSendError';
  }
}
export async function sendMetaTextMessage(input:MetaSendTextInput){
  if(!/^v\d+\.\d+$/.test(input.graphApiVersion)) throw new MetaSendError('config','META_GRAPH_API_VERSION is invalid');
  if(!input.phoneNumberId||!input.accessToken||!input.to) throw new MetaSendError('config','Meta WhatsApp credentials are incomplete');
  let response:Response;
  try{
    response=await fetch(`https://graph.facebook.com/${input.graphApiVersion}/${encodeURIComponent(input.phoneNumberId)}/messages`,{
      method:'POST',headers:{Authorization:`Bearer ${input.accessToken}`,'Content-Type':'application/json'},
      body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to:input.to.replace(/^\+/,''),type:'text',text:{preview_url:false,body:input.text}}),
      signal:AbortSignal.timeout(20_000),
    });
  }catch(error){
    const message=error instanceof Error?error.message:'Meta request failed before a response was received';
    throw new MetaSendError('ambiguous',`Meta send outcome is unknown: ${message}`);
  }
  const raw=await response.text();
  let body:{messages?:Array<{id?:string}>;error?:{message?:string;code?:number}}={};
  try{body=raw?JSON.parse(raw) as typeof body:{}}catch{body={}}
  if(!response.ok) throw new MetaSendError('rejected',`Meta rejected send (${response.status}): ${body.error?.message??'provider error'}`,response.status,body.error?.code);
  const messageId=body.messages?.[0]?.id;
  if(!messageId) throw new MetaSendError('ambiguous','Meta accepted the request without returning a message id');
  return {messageId};
}

import { createClient } from '@supabase/supabase-js';
import { processAiTaskBatch } from '@/lib/ai/task-worker';
import { createWhatsAppInboundHandler } from '@/lib/whatsapp/inbound-handler';
import { createWhatsAppOutboundHandler } from '@/lib/whatsapp/outbound-handler';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const systemSupabase=createClient(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const workerId=`sbaah-worker:${process.env.RAILWAY_REPLICA_ID ?? process.pid}`;
const pollMs=Math.max(500,Number(process.env.AI_WORKER_POLL_MS ?? 1500));
let stopping=false;
let running=false;

async function resolveAccessToken(connection:{access_token_ciphertext:string|null}): Promise<string> {
  if (!connection.access_token_ciphertext) throw new Error('WhatsApp access token is not configured');
  // Ciphertext must never be treated as a usable token. A real decryptor is wired during Meta onboarding.
  throw new Error('WhatsApp secure token resolver is not configured');
}

const handlers={
  'whatsapp.process_inbound':createWhatsAppInboundHandler(systemSupabase),
  'whatsapp.send_outbound':createWhatsAppOutboundHandler({
    systemSupabase,
    resolveAccessToken,
    graphApiVersion:process.env.META_GRAPH_API_VERSION ?? '',
  }),
};

async function tick(){
  if(stopping||running)return;
  running=true;
  try{
    const results=await processAiTaskBatch({systemSupabase,workerId,handlers,limit:10});
    if(results.length) console.info('AI worker batch',results);
  }catch(error){
    console.error('AI worker batch failed',error);
  }finally{running=false;}
}

async function shutdown(signal:string){
  if(stopping)return;
  stopping=true;
  console.info(`AI worker received ${signal}; waiting for active batch`);
  while(running) await new Promise((resolve)=>setTimeout(resolve,100));
  process.exit(0);
}
process.on('SIGTERM',()=>void shutdown('SIGTERM'));
process.on('SIGINT',()=>void shutdown('SIGINT'));

async function main(): Promise<void> {
  console.info('Sbaah AI worker started',{workerId,pollMs, runtime:'durable-task-processor'});
  while(!stopping){
    await tick();
    await new Promise((resolve)=>setTimeout(resolve,pollMs));
  }
}

void main().catch((error) => {
  console.error('Sbaah AI worker crashed', error);
  process.exit(1);
});

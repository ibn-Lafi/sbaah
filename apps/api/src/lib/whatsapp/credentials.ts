import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION='v1';
function keyFromBase64(value:string): Buffer {
  const key=Buffer.from(value,'base64');
  if(key.length!==32) throw new Error('WHATSAPP_CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes');
  return key;
}
export function encryptWhatsAppCredential(plaintext:string,keyBase64:string):string{
  if(!plaintext) throw new Error('Credential is empty');
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',keyFromBase64(keyBase64),iv);
  const ciphertext=Buffer.concat([cipher.update(plaintext,'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return [VERSION,iv.toString('base64url'),tag.toString('base64url'),ciphertext.toString('base64url')].join('.');
}
export function decryptWhatsAppCredential(payload:string,keyBase64:string):string{
  const [version,ivPart,tagPart,cipherPart,...extra]=payload.split('.');
  if(version!==VERSION||!ivPart||!tagPart||!cipherPart||extra.length) throw new Error('Unsupported WhatsApp credential ciphertext');
  const decipher=createDecipheriv('aes-256-gcm',keyFromBase64(keyBase64),Buffer.from(ivPart,'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(cipherPart,'base64url')),decipher.final()]).toString('utf8');
}

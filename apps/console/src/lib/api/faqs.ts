import { apiDelete, apiGet, apiPatch, apiPost } from './client';
export interface PlatformFaq {id:string;question_ar:string;answer_ar:string;question_en:string;answer_en:string;order_index:number;is_active:boolean;created_at:string;updated_at:string}
export type PlatformFaqInput=Omit<PlatformFaq,'id'|'created_at'|'updated_at'>;
export const listFaqs=(token:string)=>apiGet<PlatformFaq[]>('/console/faqs',token);
export const createFaq=(token:string,input:PlatformFaqInput)=>apiPost<PlatformFaq>('/console/faqs',input,token);
export const updateFaq=(token:string,id:string,input:Partial<PlatformFaqInput>)=>apiPatch<PlatformFaq>(`/console/faqs/${id}`,input,token);
export const deleteFaq=(token:string,id:string)=>apiDelete<{status:string}>(`/console/faqs/${id}`,token);

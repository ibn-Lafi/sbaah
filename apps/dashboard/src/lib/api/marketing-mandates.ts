import type { MarketingMandateInput,MarketingMandateUpdateInput,MarketingMandateV2 } from '@sbaah/shared';
import { apiDelete,apiGet,apiPatch,apiPost } from './client';
export type MarketingMandateDetail=MarketingMandateV2&{marketing_mandate_assets:Array<{asset_id:string}>};
export const listMarketingMandates=(token:string,status?:string)=>apiGet<{mandates:MarketingMandateDetail[]}>(`/v1/marketing-mandates${status?`?status=${encodeURIComponent(status)}`:''}`,token);
export const getMarketingMandate=(token:string,id:string)=>apiGet<{mandate:MarketingMandateDetail}>(`/v1/marketing-mandates/${id}`,token);
export const createMarketingMandate=(token:string,input:MarketingMandateInput)=>apiPost<{mandate:MarketingMandateDetail}>('/v1/marketing-mandates',input,token);
export const updateMarketingMandate=(token:string,id:string,input:MarketingMandateUpdateInput)=>apiPatch<{mandate:MarketingMandateV2}>(`/v1/marketing-mandates/${id}`,token,input);
export const cancelMarketingMandate=(token:string,id:string)=>apiDelete<{status:string}>(`/v1/marketing-mandates/${id}`,token);

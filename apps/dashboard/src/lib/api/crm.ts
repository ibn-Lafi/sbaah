import { apiGet, apiPatch, apiPost } from './client';
export interface CrmTask { id:string; lead_id:string|null; assigned_user_id:string|null; title:string; due_at:string|null; completed_at:string|null; }
export interface Viewing { id:string; lead_id:string; asset_id:string; listing_id:string|null; assigned_user_id:string; scheduled_at:string; status:string; outcome:string|null; notes:string|null; }
export interface Deal { id:string; lead_id:string; listing_id:string|null; responsible_user_id:string|null; status:string; value:number|null; expected_close_date:string|null; deal_assets:Array<{asset_id:string}>; }
export function listTasks(token:string){return apiGet<{tasks:CrmTask[]}>('/v1/crm/tasks',token);}
export function createTask(token:string,input:Record<string,unknown>){return apiPost<{task:CrmTask}>('/v1/crm/tasks',input,token);}
export function updateTask(token:string,id:string,input:Record<string,unknown>){return apiPatch<{task:CrmTask}>(`/v1/crm/tasks/${id}`,input,token);}
export function listViewings(token:string){return apiGet<{viewings:Viewing[]}>('/v1/crm/viewings',token);}
export function createViewing(token:string,input:Record<string,unknown>){return apiPost<{viewing:Viewing}>('/v1/crm/viewings',input,token);}
export function updateViewing(token:string,id:string,input:Record<string,unknown>){return apiPatch<{viewing:Viewing}>(`/v1/crm/viewings/${id}`,input,token);}
export function listDeals(token:string){return apiGet<{deals:Deal[]}>('/v1/crm/deals',token);}
export function createDeal(token:string,input:Record<string,unknown>){return apiPost<{deal:Deal}>('/v1/crm/deals',input,token);}

export interface LeadRequirement { id:string; lead_id:string; purpose_v2:string|null; budget_min:number|null; budget_max:number|null; asset_types:string[]|null; city_ids:string[]|null; district_ids:string[]|null; area_min:number|null; area_max:number|null; bedrooms_min:number|null; }
export function listRequirements(token:string,leadId:string){return apiGet<{requirements:LeadRequirement[]}>(`/v1/crm/requirements?lead_id=${encodeURIComponent(leadId)}`,token);}
export function createRequirement(token:string,input:Record<string,unknown>){return apiPost<{requirement:LeadRequirement}>('/v1/crm/requirements',input,token);}
export function getMatches(token:string,leadId:string){return apiGet<{matches:Array<{id:string;title_ar:string;price:number;area_sqm:number}>}>(`/v1/crm/matching?lead_id=${encodeURIComponent(leadId)}`,token);}

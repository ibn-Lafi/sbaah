import { apiGet, apiPost } from './client';
export interface CrmTask { id:string; lead_id:string|null; assigned_user_id:string|null; title:string; due_at:string|null; completed_at:string|null; }
export interface Viewing { id:string; lead_id:string; property_id:string|null; unit_id:string|null; assigned_user_id:string; scheduled_at:string; status:string; outcome:string|null; notes:string|null; }
export interface Deal { id:string; lead_id:string; property_id:string|null; unit_id:string|null; responsible_user_id:string|null; status:string; value:number|null; expected_close_date:string|null; }
export function listTasks(token:string){return apiGet<{tasks:CrmTask[]}>('/v1/crm/tasks',token);}
export function createTask(token:string,input:Record<string,unknown>){return apiPost<{task:CrmTask}>('/v1/crm/tasks',input,token);}
export function listViewings(token:string){return apiGet<{viewings:Viewing[]}>('/v1/crm/viewings',token);}
export function createViewing(token:string,input:Record<string,unknown>){return apiPost<{viewing:Viewing}>('/v1/crm/viewings',input,token);}
export function listDeals(token:string){return apiGet<{deals:Deal[]}>('/v1/crm/deals',token);}
export function createDeal(token:string,input:Record<string,unknown>){return apiPost<{deal:Deal}>('/v1/crm/deals',input,token);}

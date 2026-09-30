import { apiGet, apiPatch } from './client';
export type PlanRequestStatus='new'|'contacted'|'negotiating'|'accepted'|'closed';
export interface PlanRequest {id:string;tenant_id:string;plan_id:string;full_name:string;email:string;phone:string;details:string|null;status:PlanRequestStatus;created_at:string;updated_at:string;plans:{name_ar:string;name_en:string;billing_cycle:'annual'}|null}
export function listPlanRequests(token:string){return apiGet<{requests:PlanRequest[]}>('/console/plan-requests',token)}
export function updatePlanRequest(token:string,id:string,status:PlanRequestStatus){return apiPatch<{request:PlanRequest}>('/console/plan-requests',{id,status},token)}

import { apiGet, apiPost } from './client';
import type { Asset, AssetInput, AssetType } from '@sbaah/shared';
export interface ProjectPhase { id:string; project_id:string; name_ar:string; name_en:string|null; order_index:number; start_date:string|null; expected_completion_date:string|null; }
export interface UnitType { id:string; project_id:string|null; name_ar:string; name_en:string|null; asset_type:AssetType|null; area_sqm:number; base_price:number|null; specifications:Record<string,unknown>; }
export function listPhases(token:string){return apiGet<{phases:ProjectPhase[]}>('/v1/projects/phases',token);}
export function createPhase(token:string,input:Record<string,unknown>){return apiPost<{phase:ProjectPhase}>('/v1/projects/phases',input,token);}
export function listUnitTypes(token:string){return apiGet<{unit_types:UnitType[]}>('/v1/projects/unit-types',token);}
export function createUnitType(token:string,input:Record<string,unknown>){return apiPost<{unit_type:UnitType}>('/v1/projects/unit-types',input,token);}
export function listProjectAssets(token:string,projectId:string){return apiGet<{assets:Asset[];page:number;page_size:number;total:number}>(`/v1/assets?project_id=${encodeURIComponent(projectId)}&page_size=50`,token);}
export function createProjectAsset(token:string,projectId:string,input:AssetInput){return apiPost<{asset:Asset}>('/v1/assets',{...input,project_id:projectId},token);}

export interface ProjectSalesCenterItem { id:string;name_ar:string;asset_type:string;physical_status:string;unit_number:string|null;unit_type_id:string|null;phase_id:string|null;availability:Record<string,unknown>|null;sale_listings:Array<{id:string;listing_type:string;asking_price:number|null;publication_status:string;commercial_status:string}>;won_sale:{id:string;status:string;deal_type:string;value:number|null;closed_at:string|null}|null;active_sale_deal:{id:string;status:string;deal_type:string;value:number|null;closed_at:string|null}|null; }
export interface ProjectSalesCenter { project:{id:string;name_ar:string};summary:{total:number;available:number;reserved:number;negotiation:number;sold:number;asking_value:number;sold_value:number};inventory:ProjectSalesCenterItem[]; }
export function getProjectSalesCenter(token:string,projectId:string){return apiGet<ProjectSalesCenter>(`/v1/projects/${projectId}/sales-center`,token);}

import { apiGet, apiPost } from './client';
export interface ProjectPhase { id:string; project_id:string; name_ar:string; name_en:string|null; order_index:number; }
export interface UnitType { id:string; project_id:string; name_ar:string; property_type:string; area_sqm:number; base_price:number|null; }
export interface Unit { id:string; project_id:string; phase_id:string|null; building_id:string|null; unit_type_id:string; unit_number:string; floor_number:number|null; area_sqm:number|null; price:number|null; orientation:string|null; availability:string; }
export function listPhases(token:string){return apiGet<{phases:ProjectPhase[]}>('/v1/projects/phases',token);}
export function createPhase(token:string,input:Record<string,unknown>){return apiPost<{phase:ProjectPhase}>('/v1/projects/phases',input,token);}
export function listUnitTypes(token:string){return apiGet<{unit_types:UnitType[]}>('/v1/projects/unit-types',token);}
export function createUnitType(token:string,input:Record<string,unknown>){return apiPost<{unit_type:UnitType}>('/v1/projects/unit-types',input,token);}
export function listUnits(token:string){return apiGet<{units:Unit[]}>('/v1/projects/units',token);}
export function createUnit(token:string,input:Record<string,unknown>){return apiPost<{unit:Unit}>('/v1/projects/units',input,token);}

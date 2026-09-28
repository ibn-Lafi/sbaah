import { apiGet, apiPost } from './client';
export type ContractStatus='active'|'expired'|'cancelled'|'terminated'|'renewed'|'archived'|'unknown';
export type ContractSource='ejar'|'rega'|'moj'|'bank'|'external'|'other';
export interface ContractRow {id:string;title:string;contract_type:string;contract_category:string;contract_number:string|null;source:ContractSource;source_name:string|null;official_reference_number:string|null;status:ContractStatus;total_value:number|null;currency:string;start_date:string|null;end_date:string|null;auto_renew:boolean;notes:string|null;created_at:string;contract_parties?:Array<{id:string;party_id:string|null;role:string;display_name:string}>;contract_links?:Array<Record<string,unknown>>;contract_documents?:Array<Record<string,unknown>>;}
export const listContracts=(token:string,params='')=>apiGet<{contracts:ContractRow[];total:number}>(`/v1/contracts${params?`?${params}`:''}`,token);
export const createContract=(token:string,input:unknown)=>apiPost<{contract:ContractRow}>('/v1/contracts',input,token);

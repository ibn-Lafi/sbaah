import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from './client';
export type ContractStatus='active'|'expired'|'cancelled'|'terminated'|'renewed'|'archived'|'unknown';
export type ContractSource='ejar'|'rega'|'moj'|'bank'|'external'|'other';
export interface ContractParty{id:string;party_id:string|null;role:string;display_name:string;identifier_type?:string|null;identifier_number?:string|null;email?:string|null;phone?:string|null}
export interface ContractLink{id:string;link_type:'project'|'asset'|'lead'|'deal'|'listing'|'party';project_id?:string|null;asset_id?:string|null;lead_id?:string|null;deal_id?:string|null;listing_id?:string|null;party_id?:string|null;relation_type?:string|null}
export interface ContractDocument{id:string;document_type:string;file_name:string;storage_path:string;mime_type?:string|null;file_size?:number|null;is_primary:boolean;created_at:string}
export interface ContractReminder{id:string;remind_at:string;kind:string;note?:string|null;sent_at?:string|null}
export interface ContractRow{id:string;title:string;contract_type:string;contract_category:string;contract_number:string|null;source:ContractSource;source_name:string|null;official_reference_number:string|null;official_url?:string|null;status:ContractStatus;total_value:number|null;currency:string;start_date:string|null;end_date:string|null;auto_renew:boolean;renewal_period_months?:number|null;notes:string|null;created_at:string;contract_parties?:ContractParty[];contract_links?:ContractLink[];contract_documents?:ContractDocument[];contract_reminders?:ContractReminder[]}
export const listContracts=(token:string,params='')=>apiGet<{contracts:ContractRow[];total:number}>(`/v1/contracts${params?`?${params}`:''}`,token);
export const getContract=(token:string,id:string)=>apiGet<{contract:ContractRow}>(`/v1/contracts/${id}`,token);
export const createContract=(token:string,input:unknown)=>apiPost<{contract:ContractRow}>('/v1/contracts',input,token);
export const updateContract=(token:string,id:string,input:unknown)=>apiPatch<{contract:ContractRow}>(`/v1/contracts/${id}`,input,token);
export const addContractParty=(token:string,id:string,input:unknown)=>apiPost<{party:ContractParty}>(`/v1/contracts/${id}/parties`,input,token);
export const addContractLink=(token:string,id:string,input:unknown)=>apiPost<{link:ContractLink}>(`/v1/contracts/${id}/links`,input,token);
export const addContractReminder=(token:string,id:string,input:unknown)=>apiPost<{reminder:ContractReminder}>(`/v1/contracts/${id}/reminders`,input,token);
export const uploadContractDocument=(token:string,id:string,file:File,documentType='attachment')=>{const f=new FormData();f.set('file',file);f.set('document_type',documentType);return apiUpload<{document:ContractDocument}>(`/v1/contracts/${id}/documents`,f,token)};
export const contractDocumentUrl=(id:string,documentId:string)=>{const base=(process.env.NEXT_PUBLIC_API_URL??'').replace(/\/+$/,'');const path=base.endsWith('/v1')?`/contracts/${id}/documents/${documentId}`:`/v1/contracts/${id}/documents/${documentId}`;return `${base}${path}`};

export const listContractsForEntity=(token:string,type:'project'|'asset'|'lead'|'deal'|'listing'|'party',id:string)=>apiGet<{contracts:ContractRow[]}>(`/v1/contracts/by-entity?type=${type}&id=${encodeURIComponent(id)}`,token);

export const removeContractParty=(token:string,id:string,partyId:string)=>apiDelete<{deleted:boolean}>(`/v1/contracts/${id}/parties/${partyId}`,token);
export const removeContractLink=(token:string,id:string,linkId:string)=>apiDelete<{deleted:boolean}>(`/v1/contracts/${id}/links/${linkId}`,token);
export const removeContractReminder=(token:string,id:string,reminderId:string)=>apiDelete<{deleted:boolean}>(`/v1/contracts/${id}/reminders/${reminderId}`,token);
export const removeContractDocument=(token:string,id:string,documentId:string)=>apiDelete<{deleted:boolean}>(`/v1/contracts/${id}/documents/${documentId}`,token);

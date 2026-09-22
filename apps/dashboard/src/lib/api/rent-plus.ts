import { apiGet, apiPost, apiPatch } from './client';
export interface ManagedPropertyRow { id:string; asset_id:string; status:string; starts_at:string; ends_at:string|null; management_fee_type:string|null; management_fee_value:number|null; assets?:{id:string;name_ar:string;reference_number:string|null;asset_type:string}|null; }
export interface LeaseContractRow { id:string; contract_number:string; source:string; start_date:string; end_date:string; total_value:number; status:string; lease_contract_assets?:Array<{asset_id:string}>; lease_contract_parties?:Array<{party_id:string;role:string}>; }
export interface EjarPartyRow { id:string; name:string; party_type:string; phone:string|null; email:string|null; lead_id?:string|null; }
export interface MaintenanceRow { id:string; request_number:string; title:string; priority:string; status:string; opened_at:string; assets?:{name_ar:string;reference_number:string|null}|null; }
export interface LeasePaymentRow { id:string; payment_number:string; contract_id:string; payer_party_id?:string|null; amount:number; paid_at:string; payment_method:string; status:string; lease_contracts?:{contract_number:string}|null; payer?:{id:string;name:string}|null; }
export const listManagedProperties=(token:string)=>apiGet<{properties:ManagedPropertyRow[]}>('/v1/rent-plus/properties',token);
export const createManagementAssignment=(token:string,input:unknown)=>apiPost<{property:ManagedPropertyRow}>('/v1/rent-plus/properties',input,token);
export const listLeaseContracts=(token:string)=>apiGet<{contracts:LeaseContractRow[]}>('/v1/rent-plus/contracts',token);
export const createLeaseContract=(token:string,input:unknown)=>apiPost<{contract:LeaseContractRow}>('/v1/rent-plus/contracts',input,token);
export const listEjarTenants=(token:string)=>apiGet<{tenants:EjarPartyRow[]}>('/v1/rent-plus/tenants',token);
export const createEjarParty=(token:string,input:unknown)=>apiPost<{party:EjarPartyRow}>('/v1/rent-plus/tenants',input,token);
export const listMaintenance=(token:string)=>apiGet<{maintenance:MaintenanceRow[]}>('/v1/rent-plus/maintenance',token);
export const createMaintenance=(token:string,input:unknown)=>apiPost<{maintenance:MaintenanceRow}>('/v1/rent-plus/maintenance',input,token);
export const listLeasePayments=(token:string)=>apiGet<{payments:LeasePaymentRow[]}>('/v1/rent-plus/payments',token);
export const recordLeasePayment=(token:string,input:unknown)=>apiPost<{payment:LeasePaymentRow}>('/v1/rent-plus/payments',input,token);

export interface AssetOption { id:string; name_ar:string; reference_number:string|null; asset_type:string; }
export interface InstallmentRow { id:string; contract_id:string; installment_number:number; due_date:string; amount:number; paid_amount:number; remaining_amount:number; status:string; }
export const listAssetOptions=(token:string)=>apiGet<{assets:AssetOption[]}>('/v1/assets?page_size=50',token);
export const listInstallments=(token:string,contractId?:string)=>apiGet<{installments:InstallmentRow[]}>(`/v1/rent-plus/installments${contractId?`?contract_id=${encodeURIComponent(contractId)}`:''}`,token);
export const createInstallment=(token:string,input:unknown)=>apiPost<{installment:InstallmentRow}>('/v1/rent-plus/installments',input,token);
export const getLeaseContract=(token:string,id:string)=>apiGet<{contract:LeaseContractRow & Record<string,unknown>}>(`/v1/rent-plus/contracts/${id}`,token);
export const updateLeaseContract=(token:string,id:string,input:unknown)=>apiPatch<{contract:LeaseContractRow}>(`/v1/rent-plus/contracts/${id}`,input,token);

export const generateInstallments=(token:string,contractId:string)=>apiPost<{installments:InstallmentRow[]}>('/v1/rent-plus/installments/generate',{contract_id:contractId},token);

export interface TenantRentalProfile { tenant:EjarPartyRow; contracts:Array<LeaseContractRow & { lease_contract_assets?:Array<{asset_id:string;assets?:{name_ar:string;reference_number:string|null}|null}> }>; installments:InstallmentRow[]; payments:LeasePaymentRow[]; maintenance:MaintenanceRow[]; }
export const getEjarTenant=(token:string,id:string)=>apiGet<TenantRentalProfile>(`/v1/rent-plus/tenants/${id}`,token);

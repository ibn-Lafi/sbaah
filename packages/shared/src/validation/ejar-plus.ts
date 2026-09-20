import { z } from 'zod';
import {
  LEASE_CONTRACT_SOURCES, LEASE_CONTRACT_STATUSES, LEASE_INSTALLMENT_STATUSES,
  LEASE_PARTY_ROLES, LEASE_PAYMENT_FREQUENCIES, LEASE_PAYMENT_METHODS,
  MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES, MANAGEMENT_FEE_TYPES,
  PARTY_TYPES, PROPERTY_MANAGEMENT_STATUSES,
} from '../types/enums';
const uuid=z.string().uuid(); const nullableUuid=uuid.optional().nullable();
export const managementAssignmentInputSchema=z.object({
 asset_id:uuid,starts_at:z.string().date().optional(),ends_at:z.string().date().optional().nullable(),
 status:z.enum(PROPERTY_MANAGEMENT_STATUSES).optional(),management_fee_type:z.enum(MANAGEMENT_FEE_TYPES).optional().nullable(),
 management_fee_value:z.number().nonnegative().optional().nullable(),notes:z.string().optional().nullable(),
}).superRefine((v,c)=>{if((v.management_fee_type==null)!=(v.management_fee_value==null))c.addIssue({code:'custom',path:['management_fee_value'],message:'نوع وقيمة رسوم الإدارة يجب إدخالهما معًا'});if(v.management_fee_type==='percentage'&&v.management_fee_value!=null&&v.management_fee_value>100)c.addIssue({code:'custom',path:['management_fee_value'],message:'النسبة لا تتجاوز 100'});});
export const leaseContractInputSchema=z.object({
 contract_number:z.string().trim().min(1),source:z.enum(LEASE_CONTRACT_SOURCES).optional(),external_contract_number:z.string().optional().nullable(),
 start_date:z.string().date(),end_date:z.string().date(),total_value:z.number().nonnegative(),security_deposit:z.number().nonnegative().optional(),
 payment_frequency:z.enum(LEASE_PAYMENT_FREQUENCIES),status:z.enum(LEASE_CONTRACT_STATUSES).optional(),signed_at:z.string().datetime().optional().nullable(),
 renewed_from_contract_id:nullableUuid,notes:z.string().optional().nullable(),asset_ids:z.array(uuid).min(1),
 parties:z.array(z.object({party_id:uuid,role:z.enum(LEASE_PARTY_ROLES)})).min(2),
}).refine(v=>v.end_date>=v.start_date,{path:['end_date'],message:'تاريخ نهاية العقد يجب ألا يسبق البداية'});
export const leaseInstallmentInputSchema=z.object({contract_id:uuid,installment_number:z.number().int().positive(),due_date:z.string().date(),amount:z.number().nonnegative(),status:z.enum(LEASE_INSTALLMENT_STATUSES).optional()});
export const leasePaymentInputSchema=z.object({payment_number:z.string().trim().min(1),contract_id:uuid,payer_party_id:nullableUuid,amount:z.number().positive(),paid_at:z.string().datetime().optional(),payment_method:z.enum(LEASE_PAYMENT_METHODS),reference_number:z.string().optional().nullable(),notes:z.string().optional().nullable(),allocations:z.array(z.object({installment_id:uuid,amount:z.number().positive()})).optional()});
export const maintenanceRequestInputSchema=z.object({request_number:z.string().trim().min(1),asset_id:uuid,contract_id:nullableUuid,reported_by_party_id:nullableUuid,category:z.string().optional().nullable(),title:z.string().trim().min(2),description:z.string().optional().nullable(),priority:z.enum(MAINTENANCE_PRIORITIES).optional(),status:z.enum(MAINTENANCE_STATUSES).optional(),assigned_user_id:nullableUuid,vendor_party_id:nullableUuid,estimated_cost:z.number().nonnegative().optional().nullable(),notes:z.string().optional().nullable()});
export const ejarPartyInputSchema=z.object({party_type:z.enum(PARTY_TYPES),name:z.string().trim().min(2),phone:z.string().optional().nullable(),email:z.string().email().optional().nullable(),national_id:z.string().optional().nullable(),commercial_registration:z.string().optional().nullable(),tax_number:z.string().optional().nullable(),notes:z.string().optional().nullable()});

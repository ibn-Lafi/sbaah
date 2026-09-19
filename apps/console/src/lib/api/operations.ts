import { apiGet } from './client';
export interface OperationsOverview {
 totals:{properties:number;projects:number;leads:number;websites:number;verified_domains:number;tickets:number;open_tickets:number};
 last_30_days:{properties:number;projects:number;leads:number};
 recent_accounts:Array<{id:string;name_ar:string;status:string;created_at:string}>;
}
export function getOperations(accessToken:string){return apiGet<OperationsOverview>('/console/operations',accessToken);}

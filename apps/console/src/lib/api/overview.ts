import { apiGet, apiPost } from './client';

export interface ConsoleOverview {
  metrics: { accounts:number; active_accounts:number; properties:number; projects:number; leads:number; websites:number; open_tickets:number };
  recent_accounts: Array<{id:string;name_ar:string;name_en:string|null;status:string;created_at:string}>;
  marketing_analytics: { configured:boolean; visitors:number; sessions:number; page_views:number; daily:Array<{date:string;visitors:number;sessions:number;page_views:number}> };
}
export function getConsoleOverview(accessToken:string){ return apiGet<ConsoleOverview>('/console/overview', accessToken); }

export function connectPlatformGoogleAnalytics(accessToken:string){ return apiPost<{authorization_url:string}>('/console/analytics/google/connect', {}, accessToken); }

import { apiGet, apiPatch } from './client';

export type NotificationCategory='customers'|'real_estate'|'calendar'|'rent'|'system';
export type NotificationLevel='high'|'important'|'new'|'info';
export interface DashboardNotification {id:string;category:NotificationCategory;level:NotificationLevel;title:string;body:string;href:string|null;read_at:string|null;created_at:string}
export interface NotificationsResponse {notifications:DashboardNotification[];unread:number}

export function getNotifications(token:string){return apiGet<NotificationsResponse>('/v1/notifications',token)}
export function markNotificationRead(token:string,id:string){return apiPatch<{notification:{id:string;read_at:string}}>('/v1/notifications/'+id,{},token)}

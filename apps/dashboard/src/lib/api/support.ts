import { apiGet, apiPost } from './client';
export type SupportTicket={id:string;ticket_number:string;type:string;category:string;subject:string;description:string;status:string;priority:string;created_at:string;updated_at:string;support_ticket_messages?:{id?:string;sender_type:'customer'|'admin';message:string;created_at:string}[]};
export const listSupportTickets=(token:string)=>apiGet<{tickets:SupportTicket[]}>('/support/tickets',token);
export const createSupportTicket=(token:string,input:{type:string;category:string;subject:string;description:string})=>apiPost<{ticket:SupportTicket}>('/support/tickets',input,token);
export const getSupportTicket=(token:string,id:string)=>apiGet<{ticket:SupportTicket}>(`/support/tickets/${id}`,token);
export const replySupportTicket=(token:string,id:string,message:string)=>apiPost(`/support/tickets/${id}`,{message},token);

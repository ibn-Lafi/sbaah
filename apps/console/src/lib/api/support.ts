import { apiGet,apiPatch,apiPost } from './client';
export type AdminTicket={id:string;ticket_number:string;requester_name:string;requester_email:string;requester_phone:string|null;type:string;category:string;subject:string;description:string;status:string;priority:string;created_at:string;support_ticket_messages?:{id:string;sender_type:'customer'|'admin';message:string;created_at:string}[]};
export const listTickets=(token:string,status='')=>apiGet<{tickets:AdminTicket[]}>(`/console/support/tickets${status?`?status=${status}`:''}`,token);
export const getTicket=(token:string,id:string)=>apiGet<{ticket:AdminTicket}>(`/console/support/tickets/${id}`,token);
export const updateTicket=(token:string,id:string,input:{status?:string;priority?:string})=>apiPatch<{ticket:AdminTicket}>(`/console/support/tickets/${id}`,input,token);
export const replyTicket=(token:string,id:string,message:string)=>apiPost(`/console/support/tickets/${id}`,{message},token);

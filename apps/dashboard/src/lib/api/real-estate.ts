import type { Asset, AssetInput, AssetPhysicalStatus, AssetType, Listing, ListingInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface AssetListResponse { assets:Asset[]; page:number; page_size:number; total:number; }
export function listAssets(accessToken:string,params:{asset_type?:AssetType;physical_status?:AssetPhysicalStatus;page?:number}={}):Promise<AssetListResponse>{const q=new URLSearchParams();if(params.asset_type)q.set('asset_type',params.asset_type);if(params.physical_status)q.set('physical_status',params.physical_status);if(params.page)q.set('page',String(params.page));return apiGet<AssetListResponse>(`/v1/assets${q.size?`?${q}`:''}`,accessToken);}
export function createAsset(accessToken:string,input:AssetInput):Promise<{asset:Asset}>{return apiPost<{asset:Asset}>('/v1/assets',accessToken,input);}
export interface ListingWithAssets extends Listing { listing_assets:Array<{asset_id:string}>; }
export function listListings(accessToken:string):Promise<{listings:ListingWithAssets[];page:number;page_size:number;total:number}>{return apiGet('/v1/listings',accessToken);}
export function createListing(accessToken:string,input:ListingInput):Promise<{listing:Listing}>{return apiPost<{listing:Listing}>('/v1/listings',accessToken,input);}

export type AssetWithMedia=Asset&{asset_media:Array<{id:string;media_type:string;url:string;order_index:number}>};
export const getAsset=(token:string,id:string)=>apiGet<{asset:AssetWithMedia}>(`/v1/assets/${id}`,token);
export const updateAsset=(token:string,id:string,input:Partial<AssetInput>)=>apiPatch<{asset:Asset}>(`/v1/assets/${id}`,token,input);
export const archiveAsset=(token:string,id:string)=>apiDelete<{status:string}>(`/v1/assets/${id}`,token);

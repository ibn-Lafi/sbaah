import type { Asset, AssetInput, AssetPhysicalStatus, AssetType, Listing, ListingInput, ListingUpdateInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface AssetListResponse { assets:Asset[]; page:number; page_size:number; total:number; }
export interface AssetListParams { asset_type?:AssetType; physical_status?:AssetPhysicalStatus; parent_asset_id?:string; project_id?:string; page?:number; page_size?:number; }
export function listAssets(accessToken:string,params:AssetListParams={}):Promise<AssetListResponse>{const q=new URLSearchParams();for(const[key,value]of Object.entries(params))if(value!=null&&value!=='')q.set(key,String(value));return apiGet<AssetListResponse>(`/v1/assets${q.size?`?${q}`:''}`,accessToken);}
export function createAsset(accessToken:string,input:AssetInput):Promise<{asset:Asset}>{return apiPost<{asset:Asset}>('/v1/assets',input,accessToken);}
export interface ListingWithAssets extends Listing { listing_assets:Array<{asset_id:string}>; }
export function listListings(accessToken:string):Promise<{listings:ListingWithAssets[];page:number;page_size:number;total:number}>{return apiGet('/v1/listings',accessToken);}
export function createListing(accessToken:string,input:ListingInput):Promise<{listing:Listing}>{return apiPost<{listing:Listing}>('/v1/listings',input,accessToken);}

export type AssetWithMedia=Asset&{asset_media:Array<{id:string;media_type:string;url:string;order_index:number}>};
export interface AssetDetailResponse { asset:AssetWithMedia; parent:Asset|null; children:Asset[]; }
export const getAsset=(token:string,id:string)=>apiGet<AssetDetailResponse>(`/v1/assets/${id}`,token);
export const updateAsset=(token:string,id:string,input:Partial<AssetInput>)=>apiPatch<{asset:Asset}>(`/v1/assets/${id}`,input,token);
export const archiveAsset=(token:string,id:string)=>apiDelete<{status:string}>(`/v1/assets/${id}`,token);

export type ListingDetail=Listing&{listing_assets:Array<{asset_id:string;assets:Asset}>};
export const getListing=(token:string,id:string)=>apiGet<{listing:ListingDetail}>(`/v1/listings/${id}`,token);
export const updateListing=(token:string,id:string,input:ListingUpdateInput)=>apiPatch<{listing:Listing}>(`/v1/listings/${id}`,input,token);
export const archiveListing=(token:string,id:string)=>apiDelete<{status:string}>(`/v1/listings/${id}`,token);


export interface AssetMedia { id:string; tenant_id:string; asset_id:string; media_type:'image'|'video'; url:string; alt_ar:string|null; alt_en:string|null; order_index:number; is_primary:boolean; created_at:string; }
export interface AssetMediaInput { media_type:'image'|'video'; url:string; alt_ar?:string|null; alt_en?:string|null; order_index?:number; is_primary?:boolean; }
export const listAssetMedia=(token:string,assetId:string)=>apiGet<{media:AssetMedia[]}>(`/v1/assets/${assetId}/media`,token);
export const createAssetMedia=(token:string,assetId:string,input:AssetMediaInput)=>apiPost<{media:AssetMedia}>(`/v1/assets/${assetId}/media`,input,token);
export const updateAssetMedia=(token:string,assetId:string,mediaId:string,input:Partial<Omit<AssetMediaInput,'media_type'|'url'>>)=>apiPatch<{media:AssetMedia}>(`/v1/assets/${assetId}/media/${mediaId}`,input,token);
export const deleteAssetMedia=(token:string,assetId:string,mediaId:string)=>apiDelete<{status:string}>(`/v1/assets/${assetId}/media/${mediaId}`,token);

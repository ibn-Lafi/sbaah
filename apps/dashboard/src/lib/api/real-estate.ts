import type { Asset, AssetInput, AssetPhysicalStatus, AssetType, Listing, ListingInput } from '@sbaah/shared';
import { apiGet, apiPost } from './client';

export interface AssetListResponse { assets:Asset[]; page:number; page_size:number; total:number; }
export function listAssets(accessToken:string,params:{asset_type?:AssetType;physical_status?:AssetPhysicalStatus;page?:number}={}):Promise<AssetListResponse>{const q=new URLSearchParams();if(params.asset_type)q.set('asset_type',params.asset_type);if(params.physical_status)q.set('physical_status',params.physical_status);if(params.page)q.set('page',String(params.page));return apiGet<AssetListResponse>(`/v1/assets${q.size?`?${q}`:''}`,accessToken);}
export function createAsset(accessToken:string,input:AssetInput):Promise<{asset:Asset}>{return apiPost<{asset:Asset}>('/v1/assets',accessToken,input);}
export interface ListingWithAssets extends Listing { listing_assets:Array<{asset_id:string}>; }
export function listListings(accessToken:string):Promise<{listings:ListingWithAssets[];page:number;page_size:number;total:number}>{return apiGet('/v1/listings',accessToken);}
export function createListing(accessToken:string,input:ListingInput):Promise<{listing:Listing}>{return apiPost<{listing:Listing}>('/v1/listings',accessToken,input);}

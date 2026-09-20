import type { SupabaseClient } from '@supabase/supabase-js';

interface InventoryQuery {
  listing_type?: string;
  property_type?: string;
  max_price?: number;
}

export async function searchInventory(supabase: SupabaseClient, tenantId: string, query: InventoryQuery) {
  const { data, error } = await supabase.rpc('public_listing_feed', {
    p_tenant_id: tenantId,
    p_listing_type: query.listing_type ?? null,
    p_asset_type: query.property_type ?? null,
    p_max_price: query.max_price ?? null,
    p_limit: 10,
    p_offset: 0,
  });
  if (error) throw new Error(`Failed to search inventory: ${error.message}`);
  return data ?? [];
}

export async function getInventoryItem(supabase: SupabaseClient, tenantId: string, id: string) {
  const { data, error } = await supabase.rpc('public_listing_detail', {
    p_tenant_id: tenantId,
    p_identifier: id,
  });
  if (error) throw new Error(`Failed to load inventory item: ${error.message}`);
  return data;
}

import { describe, expect, it } from 'vitest';
import { assetSearchSchema, manualLeadInputSchema } from '@sbaah/shared';

describe('customer intake validation',()=>{
  const base={full_name:'محمد العتيبي',phone:'+966501234567',source:'manual' as const};

  it('accepts a prospect with an atomic note and follow-up',()=>{
    const parsed=manualLeadInputSchema.parse({...base,notes:'يتابع الأحد',follow_up_at:'2026-09-27T09:00:00+03:00'});
    expect(parsed.customer_relationship).toBeUndefined();
    expect(parsed.follow_up_at).toContain('2026-09-27');
  });

  it.each(['purchase','tenant','owner','former'] as const)('accepts the %s customer relationship',customer_relationship=>{
    expect(manualLeadInputSchema.parse({...base,customer_relationship}).customer_relationship).toBe(customer_relationship);
  });

  it('rejects more than one real-estate interest target',()=>{
    const result=manualLeadInputSchema.safeParse({...base,project_id:'11111111-1111-4111-8111-111111111111',asset_id:'22222222-2222-4222-8222-222222222222'});
    expect(result.success).toBe(false);
  });
});

describe('property list organization',()=>{
  it('accepts the independent top-level scope',()=>{
    expect(assetSearchSchema.parse({scope:'top_level'}).scope).toBe('top_level');
  });
});

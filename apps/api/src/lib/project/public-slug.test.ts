import { describe, expect, it } from 'vitest';
import { publicProjectSlug } from './public-slug';

describe('publicProjectSlug', () => {
  const id = '6f1d0c1e-3b8a-4c55-9d2e-6a7b8c9d0e1f';

  it('keeps an explicit slug', () => {
    expect(publicProjectSlug({ id, slug: 'al-waha' })).toBe('al-waha');
  });

  it('falls back to the id when the project has no usable slug', () => {
    expect(publicProjectSlug({ id, slug: null })).toBe(id);
    expect(publicProjectSlug({ id, slug: '  ' })).toBe(id);
  });
});

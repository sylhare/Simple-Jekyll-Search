import { describe, expect, it } from 'vitest';
// @ts-expect-error build script has no type declarations
import { stamp } from '../scripts/stamp.js';

const bundle = 'console.log("bundle");\n';
const countBanners = (code: string) => code.match(/Simple-Jekyll-Search v/g)?.length ?? 0;

describe('stamp', () => {

  it('prepends the license banner', () => {
    const stamped = stamp(bundle);

    expect(stamped.startsWith('/*!')).toBe(true);
    expect(countBanners(stamped)).toBe(1);
  });

  it('keeps the bundle intact', () => {
    expect(stamp(bundle).endsWith(bundle)).toBe(true);
  });

  it('does not stack banners when stamped twice', () => {
    expect(stamp(stamp(bundle))).toBe(stamp(bundle));
  });

  it('collapses an already doubled banner', () => {
    expect(countBanners(stamp(stamp(stamp(bundle))))).toBe(1);
  });

  it('leaves an unrelated leading banner in place', () => {
    const vendor = '/*! Vendor v1.0 */\n';

    expect(stamp(vendor + bundle)).toContain(vendor);
  });
});

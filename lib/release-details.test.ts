/// <reference types="jest" />

import { formatReleaseDetails } from '@/lib/release-details';

describe('formatReleaseDetails', () => {
  it('labels a Metro bundle as development when Expo provides an empty channel', () => {
    expect(formatReleaseDetails({ version: '1.0.6', channel: '', updateId: null })).toBe(
      'Version 1.0.6 (development)'
    );
  });

  it('includes the running EAS Update ID and channel', () => {
    expect(
      formatReleaseDetails({
        version: '1.0.6',
        channel: 'production',
        updateId: '8dcb3f8a-1111-2222-3333-444444444444',
      })
    ).toBe('Version 1.0.6 • 8dcb3f8 (production)');
  });

  it('keeps the channel for an embedded build without an EAS Update ID', () => {
    expect(formatReleaseDetails({ version: '1.0.6', channel: 'production', updateId: null })).toBe(
      'Version 1.0.6 (production)'
    );
  });
});

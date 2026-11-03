import { collectRecoverySnapshot } from '../../public/recovery.js';

const createStorage = entries => {
  const values = new Map(Object.entries(entries));
  return {
    getItem: key => values.get(key) ?? null,
  };
};

describe('offline recovery snapshot', () => {
  it('exports only the allowlisted BlinkBudget data keys as raw strings', () => {
    const storage = createStorage({
      blinkbudget_transactions:
        '[{"id":"old-1","timestamp":"2025-01-02T00:00:00.000Z"}]',
      custom_categories: '[{"id":"food","name":"Food"}]',
      firebaseAuthUser: '{"refreshToken":"must not export"}',
    });

    const snapshot = collectRecoverySnapshot(
      storage,
      'https://blinkbudget.netlify.app',
      '2026-11-04T00:00:00.000Z'
    );

    expect(snapshot.metadata).toMatchObject({
      format: 'blinkbudget-local-recovery',
      version: 1,
      origin: 'https://blinkbudget.netlify.app',
      capturedAt: '2026-11-04T00:00:00.000Z',
    });
    expect(snapshot.data.blinkbudget_transactions).toBe(
      '[{"id":"old-1","timestamp":"2025-01-02T00:00:00.000Z"}]'
    );
    expect(snapshot.data.custom_categories).toBe(
      '[{"id":"food","name":"Food"}]'
    );
    expect(snapshot.data).not.toHaveProperty('firebaseAuthUser');
    expect(snapshot.summary[0]).toMatchObject({
      key: 'blinkbudget_transactions',
      status: 'available',
      count: 1,
      dateRange: {
        earliest: '2025-01-02T00:00:00.000Z',
        latest: '2025-01-02T00:00:00.000Z',
      },
      benchmarkRows: 0,
    });
    expect(
      snapshot.summary.find(item => item.key === 'custom_categories')
    ).toMatchObject({
      status: 'available',
      count: 1,
    });
  });

  it('reports missing and invalid values without changing their raw contents', () => {
    const storage = createStorage({
      blinkbudget_transactions: '{invalid',
    });

    const snapshot = collectRecoverySnapshot(storage);

    expect(snapshot.data.blinkbudget_transactions).toBe('{invalid');
    expect(snapshot.summary[0]).toMatchObject({
      status: 'invalid JSON',
      count: null,
    });
    expect(snapshot.summary[1]).toMatchObject({
      key: 'blinkbudget_accounts',
      status: 'missing',
      count: 0,
    });
  });

  it('identifies benchmark rows in a local transaction copy', () => {
    const storage = createStorage({
      blinkbudget_transactions: JSON.stringify([
        { id: 'bench-001', timestamp: '2026-10-01T10:00:00.000Z' },
        { id: 'user-tx', timestamp: '2026-10-02T10:00:00.000Z' },
      ]),
    });

    const snapshot = collectRecoverySnapshot(storage);

    expect(snapshot.summary[0]).toMatchObject({
      count: 2,
      benchmarkRows: 1,
      dateRange: {
        earliest: '2026-10-01T10:00:00.000Z',
        latest: '2026-10-02T10:00:00.000Z',
      },
    });
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { DataManagementSection } from '../../src/components/DataManagementSection.js';
import { DateFormatSection } from '../../src/components/DateFormatSection.js';

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: { getAll: () => [] },
}));
vi.mock('../../src/core/settings-service.js', () => ({
  SettingsService: { getSetting: () => null, saveSetting: vi.fn() },
}));

describe('Settings sections - label[for] associations', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('every label[for] references an existing element id', () => {
    const host = document.createElement('div');
    host.appendChild(DataManagementSection());
    host.appendChild(DateFormatSection({ allowManualChange: true }));
    document.body.appendChild(host);

    const labels = [...host.querySelectorAll('label[for]')];
    expect(labels.length).toBeGreaterThan(0);

    const dangling = labels.filter(label => {
      const targetId = label.getAttribute('for');
      if (!targetId) return true;
      try {
        return !host.querySelector(`#${CSS.escape(targetId)}`);
      } catch {
        return !host.querySelector(`[id="${targetId}"]`);
      }
    });

    expect(
      dangling.map(l => `${l.textContent.trim()} -> ${l.getAttribute('for')}`)
    ).toEqual([]);
  });
});

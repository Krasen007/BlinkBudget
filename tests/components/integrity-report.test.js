import { afterEach, expect, it, vi } from 'vitest';
import { DataManagementSection } from '../../src/components/DataManagementSection.js';
import { dataIntegrityService } from '../../src/core/data-integrity-service.js';

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: { getAll: vi.fn(() => []) },
}));
vi.mock('../../src/components/DateInput.js', () => ({
  DateInput: () => {
    const input = document.createElement('input');
    input.getDate = () => '2026-09-17';
    return input;
  },
}));
vi.mock('../../src/core/data-integrity-service.js', () => ({
  dataIntegrityService: { performIntegrityCheck: vi.fn() },
}));

const button = (root, text) =>
  [...root.querySelectorAll('button')].find(el => el.textContent === text);

afterEach(() => {
  document.querySelectorAll('.mobile-modal-overlay').forEach(el => el.closeModal());
  document.body.replaceChildren();
  delete navigator.clipboard;
  vi.restoreAllMocks();
});

it('opens read-only details and reports copy success and failure without changing data', async () => {
  const result = {
    summary: { corruptionDetected: true, failedChecks: 1, totalChecks: 2 },
    issues: [{ message: '<img src=x onerror=alert(1)>' }],
    recommendations: ['Review your entries'],
  };
  const original = JSON.stringify(result);
  dataIntegrityService.performIntegrityCheck.mockResolvedValue(result);
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const section = DataManagementSection();
  document.body.append(section);

  button(section, '🔍 Data Integrity Check').click();
  await vi.dynamicImportSettled();
  expect(button(document.body, 'View Details')).toBeDefined();
  button(document.body, 'View Details').click();
  const report = section.querySelector('.integrity-report');
  expect(report.querySelector('img')).toBeNull();
  expect(report.textContent).toContain(result.issues[0].message);
  expect(report.textContent).toContain('Review your entries');
  expect(document.activeElement).toBe(report);
  expect(writeText).not.toHaveBeenCalled();

  button(report, 'Copy Report').click();
  await vi.waitFor(() => expect(report.textContent).toContain('Report copied.'));
  expect(JSON.parse(writeText.mock.calls[0][0])).toEqual(result);
  writeText.mockRejectedValueOnce(new Error('Permission denied'));
  button(report, 'Copy Report').click();
  await vi.waitFor(() => expect(report.textContent).toContain('Unable to copy report'));
  expect(button(report, 'Copy Report').disabled).toBe(false);
  expect(button(section, '🔍 Data Integrity Check').disabled).toBe(false);
  expect(JSON.stringify(result)).toBe(original);
  expect(dataIntegrityService.performIntegrityCheck).toHaveBeenCalledTimes(1);
});

const DATA_KEYS = Object.freeze([
  'blinkbudget_transactions',
  'blinkbudget_accounts',
  'custom_categories',
  'blink_settings',
  'blinkbudget_investments',
  'blinkbudget_goals',
  'blinkbudget_budgets',
]);

const LABELS = Object.freeze({
  blinkbudget_transactions: 'Transactions',
  blinkbudget_accounts: 'Accounts',
  custom_categories: 'Custom categories',
  blink_settings: 'Settings',
  blinkbudget_investments: 'Investments',
  blinkbudget_goals: 'Goals',
  blinkbudget_budgets: 'Budgets',
});
const PRODUCTION_ORIGIN = 'https://blinkbudget.netlify.app';

export const collectRecoverySnapshot = (
  storage = localStorage,
  origin = location.origin,
  capturedAt = new Date().toISOString()
) => {
  const values = {};
  const summary = DATA_KEYS.map(key => {
    const raw = storage.getItem(key);
    values[key] = raw;

    if (raw === null) {
      return { key, label: LABELS[key], status: 'missing', count: 0 };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        key,
        label: LABELS[key],
        status: 'invalid JSON',
        count: null,
      };
    }

    const isArray = Array.isArray(parsed);
    const isObject = parsed !== null && typeof parsed === 'object';
    const count = isArray
      ? parsed.length
      : isObject
        ? Object.keys(parsed).length
        : null;
    const entry = {
      key,
      label: LABELS[key],
      status: isArray
        ? 'available'
        : isObject
          ? 'available'
          : 'unexpected shape',
      count,
    };

    if (key === 'blinkbudget_transactions' && isArray) {
      const timestamps = parsed
        .map(transaction => Date.parse(transaction?.timestamp))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
      entry.dateRange = timestamps.length
        ? {
            earliest: new Date(timestamps[0]).toISOString(),
            latest: new Date(timestamps[timestamps.length - 1]).toISOString(),
          }
        : null;
      entry.benchmarkRows = parsed.filter(transaction =>
        String(transaction?.id || '').startsWith('bench')
      ).length;
    }

    return entry;
  });

  return {
    metadata: {
      format: 'blinkbudget-local-recovery',
      version: 1,
      origin,
      capturedAt,
      note: 'Raw localStorage strings for BlinkBudget data keys only.',
    },
    data: values,
    summary,
  };
};

const formatDate = value =>
  value ? new Date(value).toLocaleDateString() : '—';

const renderSummary = summary => {
  const tbody = document.querySelector('#data-summary');
  if (!tbody) return;
  tbody.replaceChildren();

  summary.forEach(item => {
    const row = document.createElement('tr');
    const values = [
      item.label,
      item.status,
      item.count === null ? '—' : String(item.count),
      item.dateRange
        ? `${formatDate(item.dateRange.earliest)} – ${formatDate(item.dateRange.latest)}`
        : '—',
    ];
    values.forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
};

const initializeRecoveryPage = () => {
  const exportButton = document.querySelector('#export-button');
  const connectionStatus = document.querySelector('#connection-status');
  const storageStatus = document.querySelector('#storage-status');
  const exportStatus = document.querySelector('#export-status');
  const originLabel = document.querySelector('#origin');
  if (
    !exportButton ||
    !connectionStatus ||
    !storageStatus ||
    !exportStatus ||
    !originLabel
  ) {
    return;
  }

  originLabel.textContent = location.origin;
  let snapshot = null;
  const isProductionOrigin = location.origin === PRODUCTION_ORIGIN;
  const refreshSnapshot = () => {
    snapshot = collectRecoverySnapshot();
    renderSummary(snapshot.summary);
    const presentCount = snapshot.summary.filter(
      item => item.status !== 'missing'
    ).length;
    storageStatus.textContent = !isProductionOrigin
      ? 'Wrong website origin. Open this page on https://blinkbudget.netlify.app to inspect production local storage.'
      : presentCount
        ? `Found ${presentCount} BlinkBudget data key(s). Counts are local to this browser profile and are not uploaded.`
        : 'No BlinkBudget data keys were found for this website origin.';
  };
  try {
    refreshSnapshot();
  } catch (error) {
    storageStatus.textContent = `Unable to read local storage: ${error.message}`;
  }

  const updateConnectionStatus = () => {
    const isOffline = navigator.onLine === false;
    connectionStatus.textContent = !isProductionOrigin
      ? `Wrong origin. Use ${PRODUCTION_ORIGIN} in the browser profile containing the production data.`
      : isOffline
        ? 'Offline status confirmed by the browser. The export button is available.'
        : 'The browser reports an internet connection. Disconnect Wi-Fi and Ethernet before exporting.';
    exportButton.disabled = !isProductionOrigin || !isOffline || !snapshot;
  };

  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);

  exportButton.addEventListener('click', () => {
    if (!isProductionOrigin || navigator.onLine !== false || !snapshot) {
      updateConnectionStatus();
      return;
    }

    try {
      refreshSnapshot();
      const contents = JSON.stringify(snapshot, null, 2);
      const url = URL.createObjectURL(
        new Blob([contents], { type: 'application/json' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'blinkbudget-local-recovery.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      exportStatus.textContent =
        'Export downloaded. Keep this file private and verify its counts before restoring anything.';
    } catch (error) {
      snapshot = null;
      exportButton.disabled = true;
      exportStatus.textContent = `Export failed: ${error.message}`;
    }
  });
};

initializeRecoveryPage();

import '../styles/components/integrity-report.css';

/** A local, read-only diagnostic report. Copying requires an explicit click. */
export const IntegrityReport = result => {
  const container = document.createElement('section');
  container.className = 'integrity-report';
  container.tabIndex = -1;
  container.setAttribute('aria-label', 'Data integrity details');

  const title = document.createElement('h4');
  title.textContent = 'Data Integrity Details';
  const notice = document.createElement('p');
  notice.textContent =
    'Read-only report. Nothing has been changed. Reports may contain personal financial information; review before sharing.';
  const report = JSON.stringify(
    {
      summary: result.summary,
      issues: result.issues,
      recommendations: result.recommendations,
    },
    null,
    2
  );
  const text = document.createElement('pre');
  text.className = 'integrity-report-text';
  text.textContent = report;
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'btn btn-secondary';
  copy.textContent = 'Copy Report';
  copy.addEventListener('click', async () => {
    copy.disabled = true;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(report);
      status.textContent = 'Report copied.';
    } catch (error) {
      console.error('Failed to copy integrity report:', error);
      status.textContent =
        'Unable to copy report. You can select and copy the text manually.';
    } finally {
      copy.disabled = false;
    }
  });
  container.append(title, notice, text, copy, status);
  return container;
};

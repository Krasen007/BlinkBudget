import { TransactionForm } from '../components/TransactionForm.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { MobileBackButton } from '../components/MobileNavigation.js';

export const AddView = () => {
    const container = document.createElement('div');
    container.className = 'view-add';
    container.style.maxWidth = '600px';
    container.style.width = '100%';

    const header = document.createElement('div');
    header.style.marginBottom = 'var(--spacing-xl)';
    header.style.flexDirection = 'column';
    header.style.alignItems = 'stretch';
    header.style.gap = 'var(--spacing-md)';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Add Transaction';
    title.style.margin = '0';
    title.style.marginRight = 'var(--spacing-md)';

    // Date Input Container (for Top Right)
    const dateCtx = document.createElement('div');
    dateCtx.style.position = 'relative';
    dateCtx.style.display = 'flex';
    dateCtx.style.alignItems = 'center';
    dateCtx.style.width = '140px'; // Compact width
    dateCtx.style.marginRight = 'var(--spacing-sm)';

    // 1. Visible Display Input
    const displayDate = document.createElement('input');
    displayDate.type = 'text';
    displayDate.readOnly = true;
    displayDate.className = 'mobile-form-input';
    displayDate.style.width = '100%';
    displayDate.style.textAlign = 'center';
    displayDate.style.cursor = 'pointer';
    displayDate.style.color = 'var(--color-text-muted)';

    // 2. Hidden Native Date Input
    const realDate = document.createElement('input');
    realDate.type = 'date';
    realDate.style.position = 'absolute';
    realDate.style.top = '0';
    realDate.style.left = '0';
    realDate.style.width = '100%';
    realDate.style.height = '100%';
    realDate.style.opacity = '0';
    realDate.style.zIndex = '2';
    realDate.style.cursor = 'pointer';

    // Format Logic
    const formatDate = (isoDate) => {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-');
        const format = StorageService.getSetting('dateFormat') || 'US';
        switch (format) {
            case 'ISO': return `${year}-${month}-${day}`;
            case 'EU': return `${day}/${month}/${year}`;
            case 'US': default: return `${month}/${day}/${year}`;
        }
    };

    // Init Date
    const today = new Date().toISOString().split('T')[0];
    realDate.value = today;
    displayDate.value = formatDate(today);

    // Sync
    realDate.addEventListener('change', (e) => {
        displayDate.value = formatDate(e.target.value);
    });

    // Interaction Fixes
    realDate.addEventListener('click', (e) => {
        try { if (realDate.showPicker) realDate.showPicker(); } catch (err) { }
    });

    // Append
    dateCtx.appendChild(displayDate);
    dateCtx.appendChild(realDate);

    // Small Back button (Top Right)
    // Wrap Date and Back button in a container
    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.alignItems = 'center';

    const smallBackBtn = document.createElement('button');
    smallBackBtn.textContent = 'Back';
    smallBackBtn.className = 'btn btn-ghost';
    smallBackBtn.style.height = '56px'; // Match form element height
    smallBackBtn.style.minHeight = '56px';
    smallBackBtn.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    smallBackBtn.style.fontSize = 'var(--font-size-sm)';
    smallBackBtn.style.width = 'auto'; // Let it size to content
    smallBackBtn.style.flexShrink = '0'; // Don't shrink
    smallBackBtn.addEventListener('click', () => Router.navigate('dashboard'));

    rightControls.appendChild(dateCtx);
    rightControls.appendChild(smallBackBtn);

    topRow.appendChild(title);
    topRow.appendChild(rightControls);
    header.appendChild(topRow);
    container.appendChild(header);

    const form = TransactionForm({
        externalDateInput: realDate, // Pass the hidden input
        onSubmit: (data) => {
            StorageService.add(data);
            Router.navigate('dashboard');
        }
    });
    container.appendChild(form);

    const backLink = document.createElement('button');
    backLink.textContent = 'Cancel';
    backLink.className = 'mobile-form-input desktop-only'; // Hide on mobile, show mobile back button instead
    backLink.style.marginTop = 'var(--spacing-md)';
    backLink.style.cursor = 'pointer';
    backLink.style.border = '1px solid var(--color-border)';
    backLink.style.background = 'var(--color-surface)';
    backLink.style.color = 'var(--color-text-main)';
    backLink.style.display = 'flex';
    backLink.style.alignItems = 'center';
    backLink.style.justifyContent = 'center';
    backLink.style.fontWeight = '500';
    backLink.addEventListener('click', () => Router.navigate('dashboard'));
    container.appendChild(backLink);

    return container;
};

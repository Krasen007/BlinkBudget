import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { StorageService } from '../core/storage.js';

export const SettingsView = () => {
    const container = document.createElement('div');
    container.className = 'view-settings';
    container.style.maxWidth = '600px';
    container.style.width = '100%';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = 'var(--spacing-xl)';

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.margin = 0;

    const backBtn = Button({
        text: 'Back',
        variant: 'secondary',
        onClick: () => Router.navigate('dashboard')
    });
    backBtn.style.padding = 'var(--spacing-sm) var(--spacing-md)';

    header.appendChild(title);
    header.appendChild(backBtn);
    container.appendChild(header);

    // Feature 1: Date Format
    const dateSection = document.createElement('div');
    dateSection.className = 'card';
    dateSection.style.marginBottom = 'var(--spacing-lg)';

    const dateTitle = document.createElement('h3');
    dateTitle.textContent = 'Date Format';
    dateTitle.style.marginBottom = 'var(--spacing-md)';
    dateTitle.style.fontSize = '1.2rem';

    const currentFormat = StorageService.getSetting('dateFormat') || 'US'; // Default US

    const createOption = (label, value) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = 'var(--spacing-sm) 0';
        row.style.cursor = 'pointer';

        const lbl = document.createElement('span');
        lbl.textContent = label;

        const check = document.createElement('span');
        check.textContent = currentFormat === value ? '✓' : '';
        check.style.color = 'var(--color-primary)';
        check.style.fontWeight = 'bold';

        row.appendChild(lbl);
        row.appendChild(check);

        row.addEventListener('click', () => {
            StorageService.saveSetting('dateFormat', value);
            // Re-render view to show update
            const parent = container.parentNode;
            if (parent) {
                parent.innerHTML = '';
                parent.appendChild(SettingsView());
            }
        });

        return row;
    };

    dateSection.appendChild(dateTitle);
    dateSection.appendChild(createOption('US (MM/DD/YYYY)', 'US'));
    dateSection.appendChild(createOption('ISO (YYYY-MM-DD)', 'ISO'));
    dateSection.appendChild(createOption('European (DD/MM/YYYY)', 'EU'));

    container.appendChild(dateSection);

    return container;
};

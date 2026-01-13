import { Router } from '../core/router.js';
import { SPACING } from './constants.js';

/**
 * Creates navigation buttons for switching between main views
 * @param {string} currentView - The current view ('dashboard', 'reports', 'financial-planning', 'settings')
 * @returns {HTMLElement} - Container with navigation buttons
 */
export const createNavigationButtons = (currentView) => {
    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.alignItems = 'center';
    rightControls.style.gap = SPACING.SM;

    // Define all possible views and their properties
    const views = [
        {
            key: 'dashboard',
            icon: '🏠',
            title: 'Dashboard',
            route: 'dashboard'
        },
        {
            key: 'reports',
            icon: '🎯',
            title: 'Charts and Reports',
            route: 'reports'
        },
        {
            key: 'financial-planning',
            icon: '📊',
            title: 'Financial Planning',
            route: 'financial-planning'
        },
        {
            key: 'settings',
            icon: '⚙️',
            title: 'Settings',
            route: 'settings'
        }
    ];

    // Filter out current view and take first 3 remaining views
    const availableViews = views.filter(view => view.key !== currentView).slice(0, 3);

    // Create buttons for available views
    availableViews.forEach(view => {
        const button = document.createElement('button');
        button.innerHTML = view.icon;
        button.className = 'btn btn-ghost';
        button.style.fontSize = '1.5rem';
        button.style.padding = SPACING.XS;
        button.style.border = 'none';
        button.style.marginRight = SPACING.SM;
        button.title = view.title;
        button.addEventListener('click', () => Router.navigate(view.route));

        rightControls.appendChild(button);
    });

    return rightControls;
};

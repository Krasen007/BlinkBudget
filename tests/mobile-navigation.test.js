import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MobileNavigation, MobileBackButton, updateMobileNavigation } from '../src/components/MobileNavigation.js';

// Mock the Router
vi.mock('../src/core/router.js', () => ({
    Router: {
        navigate: vi.fn()
    }
}));

// Mock mobile utils
global.window.mobileUtils = {
    supportsHaptic: () => true,
    hapticFeedback: vi.fn()
};

describe('MobileNavigation', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should create navigation with correct structure', () => {
        const nav = MobileNavigation({ currentRoute: 'reports' });
        
        expect(nav.tagName).toBe('NAV');
        expect(nav.className).toBe('mobile-nav');
        expect(nav.getAttribute('role')).toBe('navigation');
        expect(nav.getAttribute('aria-label')).toBe('Main navigation');
        
        // Should have 3 navigation items
        const navItems = nav.querySelectorAll('.mobile-nav-item');
        expect(navItems.length).toBe(3);
        
        // Check navigation item structure - first item is now Charts/Reports
        const reportsItem = navItems[0];
        expect(reportsItem.classList.contains('active')).toBe(true);
        expect(reportsItem.getAttribute('data-route')).toBe('reports');
        
        const icon = reportsItem.querySelector('.mobile-nav-icon');
        const label = reportsItem.querySelector('.mobile-nav-label');
        expect(icon).toBeTruthy();
        expect(label).toBeTruthy();
        expect(label.textContent).toBe('Charts');
    });

    it('should highlight correct active route', () => {
        const nav = MobileNavigation({ currentRoute: 'add-expense' });
        
        const navItems = nav.querySelectorAll('.mobile-nav-item');
        const reportsItem = navItems[0]; // First item is now reports/charts
        const addItem = navItems[1];
        
        expect(reportsItem.classList.contains('active')).toBe(false);
        expect(addItem.classList.contains('active')).toBe(true);
    });

    it('should update navigation active state', () => {
        const nav = MobileNavigation({ currentRoute: 'reports' });
        document.body.appendChild(nav);
        
        // Update to settings
        updateMobileNavigation('settings');
        
        const navItems = nav.querySelectorAll('.mobile-nav-item');
        const reportsItem = navItems[0]; // First item is now reports/charts
        const settingsItem = navItems[2];
        
        expect(reportsItem.classList.contains('active')).toBe(false);
        expect(settingsItem.classList.contains('active')).toBe(true);
    });
});

describe('MobileBackButton', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should create back button with correct structure', () => {
        const onBack = vi.fn();
        const backBtn = MobileBackButton({ onBack, label: 'Cancel' });
        
        expect(backBtn.tagName).toBe('BUTTON');
        expect(backBtn.className).toBe('mobile-back-btn');
        
        const icon = backBtn.querySelector('.mobile-back-icon');
        const label = backBtn.querySelector('.mobile-back-label');
        
        expect(icon).toBeTruthy();
        expect(icon.textContent).toBe('←');
        expect(label).toBeTruthy();
        expect(label.textContent).toBe('Cancel');
    });

    it('should call onBack when clicked', () => {
        const onBack = vi.fn();
        const backBtn = MobileBackButton({ onBack });
        
        backBtn.click();
        
        expect(onBack).toHaveBeenCalledOnce();
    });

    it('should use default back behavior when no onBack provided', () => {
        const mockBack = vi.fn();
        global.window.history = { back: mockBack };
        
        const backBtn = MobileBackButton({});
        backBtn.click();
        
        expect(mockBack).toHaveBeenCalledOnce();
    });
});
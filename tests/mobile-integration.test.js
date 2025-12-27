import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MobileNavigation, updateMobileNavigation } from '../src/components/MobileNavigation.js';
import { Router } from '../src/core/router.js';

// Mock Router
vi.mock('../src/core/router.js', () => ({
    Router: {
        navigate: vi.fn()
    }
}));

// Mock mobile utils
global.window.mobileUtils = {
    supportsHaptic: () => true,
    hapticFeedback: vi.fn(),
    isMobile: () => true
};

describe('Mobile Navigation Integration', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should navigate when navigation items are clicked', () => {
        const nav = MobileNavigation({ currentRoute: 'reports' });
        document.body.appendChild(nav);
        
        const navItems = nav.querySelectorAll('.mobile-nav-item');
        const addItem = navItems[1]; // Add expense item
        
        // Simulate click
        addItem.click();
        
        expect(Router.navigate).toHaveBeenCalledWith('add-expense');
    });

    it('should update active states when navigation occurs', () => {
        const nav = MobileNavigation({ currentRoute: 'reports' }); // Start with reports active
        document.body.appendChild(nav);
        
        const navItems = nav.querySelectorAll('.mobile-nav-item');
        const reportsItem = navItems[0]; // First item is now reports/charts
        const settingsItem = navItems[2];
        
        // Initially reports should be active
        expect(reportsItem.classList.contains('active')).toBe(true);
        expect(settingsItem.classList.contains('active')).toBe(false);
        
        // Click settings
        settingsItem.click();
        
        // Should update active states
        expect(reportsItem.classList.contains('active')).toBe(false);
        expect(settingsItem.classList.contains('active')).toBe(true);
        
        expect(Router.navigate).toHaveBeenCalledWith('settings');
    });

    it('should provide proper accessibility attributes', () => {
        const nav = MobileNavigation({ currentRoute: 'reports' });
        
        expect(nav.getAttribute('role')).toBe('navigation');
        expect(nav.getAttribute('aria-label')).toBe('Main navigation');
        
        const navItems = nav.querySelectorAll('.mobile-nav-item');
        navItems.forEach(item => {
            expect(item.getAttribute('aria-label')).toBeTruthy();
            expect(item.getAttribute('data-route')).toBeTruthy();
        });
    });

    it('should handle dashboard route mapping to reports highlight', () => {
        const nav = MobileNavigation({ currentRoute: 'reports' });
        document.body.appendChild(nav);
        
        // Test the updateMobileNavigation function with dashboard route
        updateMobileNavigation('dashboard');
        
        const navItems = nav.querySelectorAll('.mobile-nav-item');
        const reportsItem = navItems[0]; // Should be highlighted when dashboard is active
        
        // Dashboard route should highlight the reports/charts button on mobile
        expect(reportsItem.classList.contains('active')).toBe(true);
    });
});
/**
 * InstallService
 * Manages the PWA installation flow by capturing the 'beforeinstallprompt' event.
 */

let deferredPrompt = null;
const listeners = new Set();

const notifyListeners = () => {
    listeners.forEach(listener => listener(deferredPrompt !== null));
};

export const InstallService = {
    /**
     * Initialize the service and listen for the beforeinstallprompt event.
     */
    init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;
            console.log('[InstallService] beforeinstallprompt captured');
            notifyListeners();
        });

        window.addEventListener('appinstalled', () => {
            console.log('[InstallService] App installed');
            deferredPrompt = null;
            notifyListeners();
        });
    },

    /**
     * Check if the app is currently installable.
     * @returns {boolean}
     */
    isInstallable() {
        return deferredPrompt !== null;
    },

    /**
     * Trigger the installation prompt.
     * @returns {Promise<boolean>} Resolves to true if installed, false otherwise.
     */
    async promptInstall() {
        if (!deferredPrompt) return false;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[InstallService] User choice: ${outcome}`);

        if (outcome === 'accepted') {
            deferredPrompt = null;
            notifyListeners();
            return true;
        }

        return false;
    },

    /**
     * Subscribe to installable state changes.
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        listeners.add(callback);
        // Initial call
        callback(deferredPrompt !== null);
        return () => listeners.delete(callback);
    }
};

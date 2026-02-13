import { registerSW } from 'virtual:pwa-register';
import { offlineDataManager } from './core/offline-data-manager.js';

registerSW({
  onNeedRefresh() {
    // Show a prompt to user to refresh, or just refresh automatically
    // For now, let's just log it. A proper UI would be better.
    console.log('New content available, click on reload button to update.');
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');

    // Load any pending sync operations
    offlineDataManager.loadSyncQueue();

    // Process sync queue if online
    if (offlineDataManager.isOnline) {
      offlineDataManager.processSyncQueue();
    }
  },
});

// Initialize offline data manager
console.log('[PWA] Initializing offline data manager...');
console.log(
  '[PWA] Offline status:',
  offlineDataManager.isOnline ? 'Online' : 'Offline'
);

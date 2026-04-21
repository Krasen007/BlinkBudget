import { registerSW } from 'virtual:pwa-register';
import { ToastNotification } from './components/ToastNotification.js';

const updateSW = registerSW({
  onNeedRefresh() {
    // Show visual notification for update
    ToastNotification({
      message: 'A new version is available',
      actionText: 'Update',
      variant: 'info',
      onAction: () => {
        updateSW(true); // Trigger the update
      },
    });
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
});

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        // Show a prompt to user to refresh, or just refresh automatically
        // For now, let's just log it. A proper UI would be better.
        console.log("New content available, click on reload button to update.");
    },
    onOfflineReady() {
        console.log("App is ready to work offline.");
    },
})

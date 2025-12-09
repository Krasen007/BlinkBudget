export const Router = {
    routes: {},

    // Register a route handler for a specific hash
    on(route, handler) {
        this.routes[route] = handler;
    },

    // Initialize the router
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    // Navigate to a new route
    navigate(route) {
        window.location.hash = route;
    },

    // Internal: Handle the current hash
    handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard'; // Default to dashboard
        const handler = this.routes[hash];
        if (handler) {
            handler();
        } else {
            console.warn(`No handler for route: ${hash}`);
            // Redirect to default if unknown
            if (hash !== 'dashboard') {
                this.navigate('dashboard');
            }
        }
    }
};

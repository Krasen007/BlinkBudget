export class Router {
  static routes = {};
  static beforeHook = null;

  // Register a route handler for a specific hash
  static on(route, handler) {
    this.routes[route] = handler;
  }

  // Initialize the router
  static init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    this.handleRoute(); // Handle initial route
  }

  static getCurrentRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    return hash.split('?')[0];
  }

  // Navigate to a new route
  static navigate(route, params = {}) {
    const urlParams = new URLSearchParams(params).toString();
    const hash = urlParams ? `${route}?${urlParams}` : route;
    window.location.hash = hash;
  }

  // Register a global before hook
  static before(hook) {
    this.beforeHook = hook;
  }

  // Internal: Handle the current hash
  static handleRoute() {
    const rawHash = window.location.hash.slice(1) || 'dashboard'; // Default to dashboard

    // Split route and params (e.g. edit-expense?id=123)
    const [route, paramString] = rawHash.split('?');
    const params = {};

    if (paramString) {
      const searchParams = new URLSearchParams(paramString);
      for (const [key, value] of searchParams) {
        params[key] = value;
      }
    }

    const executeHandler = () => {
      const handler = this.routes[route];
      if (handler) {
        handler(params);
      } else {
        console.warn(`No handler for route: ${route}`);
        // Redirect to default if unknown
        if (route !== 'dashboard') {
          this.navigate('dashboard');
        }
      }
    };

    // Execute global before hook if it exists
    if (this.beforeHook) {
      const result = this.beforeHook(route, params);
      if (result instanceof Promise) {
        result.then(canProceed => {
          if (canProceed !== false) executeHandler();
        });
      } else if (result !== false) {
        executeHandler();
      }
    } else {
      executeHandler();
    }
  }
}

export class Router {
  static routes = {};
  static beforeHook = null;

  static on(route, handler) {
    this.routes[route] = handler;
  }

  static init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    this.handleRoute();
  }

  static getCurrentRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    return hash.split('?')[0];
  }

  static navigate(route, params = {}) {
    const urlParams = new URLSearchParams(params).toString();
    const hash = urlParams ? `${route}?${urlParams}` : route;
    window.location.hash = hash;
  }

  static before(hook) {
    this.beforeHook = hook;
  }

  static handleRoute() {
    const rawHash = window.location.hash.slice(1) || 'dashboard';

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
        if (route !== 'dashboard') {
          this.navigate('dashboard');
        }
      }
    };

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

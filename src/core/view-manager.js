/**
 * ViewManager
 * Handles mounting and unmounting of application views.
 */

export const ViewManager = {
  currentView: null,
  appContainer: null,

  init(container) {
    this.appContainer = container;
  },

  /**
   * Set the current view
   * @param {HTMLElement} view - The view element to mount
   */
  setView(view) {
    if (!this.appContainer) {
      this.appContainer = document.querySelector('#app');
    }

    if (this.currentView && typeof this.currentView.cleanup === 'function') {
      this.currentView.cleanup();
    }

    // Instant swap for better performance
    this.appContainer.innerHTML = '';
    this.currentView = view;
    this.appContainer.appendChild(view);

    // Ensure we scroll to top on view changes
    window.scrollTo(0, 0);
  },

  getCurrentView() {
    return this.currentView;
  },
};

/**
 * ID Generation Utilities
 */

/**
 * Generate a unique ID (UUID v4)
 * Uses crypto.randomUUID where available, falling back to a mathematical implementation
 * @returns {string} Unique identifier
 */
export const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for secure context issues (http mostly)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

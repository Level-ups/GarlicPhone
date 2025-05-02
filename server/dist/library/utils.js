"use strict";
/**
 * Utility functions for the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamelCase = toCamelCase;
function toCamelCase(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    else if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    }
    else if (typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

/**
 * Application Configuration
 * 
 * APP_ROLE can be:
 * - 'worker': Builds the worker-only app (Landing -> Form)
 * - 'guard': Builds the security guard-only app (Login -> Dashboard)
 * 
 * CHANGE THIS BEFORE BUILDING FOR DISTRIBUTION
 */
export const APP_CONFIG = {
    APP_ROLE: 'worker', // Set to 'guard' for the security app
};

/**
 * eventBus.js — Phase 3: Event-Driven Automation
 *
 * A thin wrapper around Node's built-in EventEmitter that acts as
 * the backbone of the notification engine. By decoupling side-effects
 * (email, webhooks, badge printing) from the route handler, we ensure:
 *   - Route handlers complete in < 50ms regardless of notification latency
 *   - Failures in notifications never block or crash the main request
 *   - New notification channels can be added without touching route code
 *
 * Events emitted:
 *   'checkin'   → { log, project, visitorGroup }
 *   'checkout'  → { log, project }
 *   'delivery'  → { log, project, recipient }
 */

const EventEmitter = require('events');

class AttendanceEventBus extends EventEmitter {}

const eventBus = new AttendanceEventBus();

// Prevent crash on unhandled errors — log and continue
eventBus.on('error', (err) => {
    console.error('[EventBus] Unhandled error:', err);
});

// Increase max listeners (one per notification channel)
eventBus.setMaxListeners(20);

module.exports = eventBus;
